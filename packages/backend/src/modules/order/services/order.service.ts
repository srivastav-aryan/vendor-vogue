import mongoose from "mongoose";
import {
  IOrder,
  IShippingAddressSnapshot,
  isValidOrderStatusTransition,
  Order,
  ORDER_STATUS,
} from "../models/order.model.js";
import { Cart } from "../../inventory/models/Cart.model.js";
import { ProductVariant } from "../../catalog/models/productVariant.model.js";
import { Product } from "../../catalog/models/product.model.js";
import { IPricingService } from "../../pricing/interfaces/pricing.service.interface.js";
import { IInventoryService } from "../../inventory/interfaces/inventory.service.interface.js";
import {
  CancelOrderInput,
  CreateCheckoutOrderInput,
  GetUserOrdersInput,
  HandleRazorpayWebhookInput,
  IOrderService,
  MarkOrderPaidInput,
  PaginatedOrdersResult,
  TransitionOrderStatusInput,
  VerifyOrderPaymentInput,
} from "../interfaces/order.service.interface.js";
import { OrderError } from "../errors/order.errors.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import { EvaluateCartItemInput } from "../../pricing/interfaces/pricing.service.interface.js";
import { roundToTwoDecimals } from "../../../shared/utils/gst.utils.js";
import { IPaymentGatewayService } from "../../payment/interfaces/payment.gateway.interface.js";
import {
  parsePagination,
  buildPaginationMeta,
} from "../../../shared/utils/pagination.utils.js";

export class OrderService implements IOrderService {
  constructor(
    private readonly pricingService: IPricingService,
    private readonly inventoryService: IInventoryService,
    private readonly paymentGateway?: IPaymentGatewayService,
  ) {}

  /**
   * Internal Piece 3: The Checkout Intent Orchestrator
   *
   * Coordinates the complete transaction:
   * 1. Validates the cart items.
   * 2. Calls PricingService.evaluatePricing() to lock in the final payable amount.
   * 3. Calls InventoryService.reserveStock() for each cart item inside a MongoDB session (15m TTL).
   * 4. Creates the internal Order in PENDING_PAYMENT status with immutable legal snapshots.
   * 5. Clears the user's cart inside the session.
   */
  async createCheckoutOrder(
    input: CreateCheckoutOrderInput,
    ctx?: RequestContext,
  ): Promise<IOrder> {
    const {
      userId,
      shippingAddress,
      couponCode,
      shippingFee = 0,
      paymentMethod = "RAZORPAY",
    } = input;

    ctx?.logger?.info(
      { userId, couponCode, shippingFee },
      "Initiating checkout intent orchestrator",
    );

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.addressLine1 ||
      !shippingAddress.locality ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      throw new OrderError(
        "INVALID_ADDRESS",
        "Complete shipping address (name, phone, addressLine1, locality, city, state, pincode) is required",
        400,
      );
    }

    // 1. Fetch and validate cart
    let cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

    // Auto-populate cart if DB cart is empty but client passed valid checkout items
    if (
      (!cart || !cart.items || cart.items.length === 0) &&
      input.items &&
      input.items.length > 0
    ) {
      ctx?.logger?.info(
        { userId, itemCount: input.items.length },
        "Auto-populating backend cart from checkout direct items",
      );
      if (!cart) {
        cart = await Cart.create({
          userId: new mongoose.Types.ObjectId(userId),
          items: [],
        });
      }
      for (const it of input.items) {
        if (/^[0-9a-fA-F]{24}$/.test(it.variantId)) {
          cart.items.push({
            productVariant: new mongoose.Types.ObjectId(it.variantId),
            quantity: Math.max(1, Number(it.quantity) || 1),
            addedAt: new Date(),
          } as any);
        }
      }
      await cart.save();
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new OrderError(
        "CART_EMPTY",
        "Cannot create checkout order with an empty cart",
        400,
      );
    }

    // 2. Fetch catalog items for validation and snapshot preparation
    const variantIds = cart.items.map((i) => i.productVariant);
    const variants = await ProductVariant.find({ _id: { $in: variantIds } });
    const variantMap = new Map(variants.map((v) => [v._id.toString(), v]));

    const productIds = variants.map((v) => v.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const evalItems: EvaluateCartItemInput[] = [];

    for (const item of cart.items) {
      const vId = item.productVariant.toString();
      const variant = variantMap.get(vId);

      if (!variant || !variant.isActive) {
        throw new OrderError(
          "INSUFFICIENT_STOCK",
          `Product variant ${vId} is no longer available`,
          409,
        );
      }

      const availableStock = variant.stockQuantity - variant.reservedQuantity;
      if (availableStock < item.quantity) {
        throw new OrderError(
          "INSUFFICIENT_STOCK",
          `Insufficient stock for SKU ${variant.sku}. Requested: ${item.quantity}, Available: ${Math.max(0, availableStock)}`,
          409,
        );
      }

      const product = productMap.get(variant.productId.toString());
      if (!product) {
        throw new OrderError(
          "INSUFFICIENT_STOCK",
          `Product for SKU ${variant.sku} not found`,
          404,
        );
      }

      evalItems.push({
        variantId: variant._id.toString(),
        productId: product._id.toString(),
        categoryId: product.category.toString(),
        brandId: product.brand.toString(),
        hsnCode: product.hsnCode,
        unitPrice: variant.sellingPrice,
        quantity: item.quantity,
      });
    }

    // 3. Evaluate pricing rules & inclusive GST
    const evaluation = await this.pricingService.evaluatePricing(
      evalItems,
      couponCode,
      ctx,
    );

    const evaluatedMap = new Map(
      evaluation.items.map((item) => [item.variantId, item]),
    );

    // 4. Run atomic stock reservation and order creation inside MongoDB session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Reserve stock atomically for each cart item
      for (const item of cart.items) {
        await this.inventoryService.reserveStock(
          {
            userId,
            variantId: item.productVariant.toString(),
            quantity: item.quantity,
            ttlMinutes: 15,
          },
          ctx,
          session,
        );
      }

      // Build immutable snapshot line items
      const orderLineItems = evaluation.items.map((evaluated) => {
        const variant = variantMap.get(evaluated.variantId)!;
        const product = productMap.get(evaluated.productId)!;

        return {
          vendorId: (product as any).vendorId || "DEFAULT_VENDOR",
          variantId: variant._id,
          productId: product._id,
          sku: variant.sku,
          productName: product.name,
          variantName: variant.name,
          image: variant.images?.[0] || product.images?.[0] || "",
          hsnCode: evaluated.hsnCode,
          quantity: evaluated.quantity,
          originalUnitPrice: evaluated.originalUnitPrice,
          discountPerUnit: evaluated.discountPerUnit,
          discountedUnitPrice: evaluated.discountedUnitPrice,
          appliedRuleCode: evaluated.appliedRuleCode,
          gstRate: evaluated.gstRate,
          gstAmountPerUnit: evaluated.gstAmountPerUnit,
          taxableAmountPerUnit: evaluated.taxableAmountPerUnit,
          lineTaxTotal: evaluated.lineTaxTotal,
          lineSubtotal: evaluated.lineSubtotal,
          lineTaxableTotal: evaluated.lineTaxableTotal,
        };
      });

      const totalShipping = roundToTwoDecimals(Math.max(0, shippingFee));
      const grandTotal = roundToTwoDecimals(
        evaluation.finalPayableAmount + totalShipping,
      );

      // Create Order document in PENDING_PAYMENT status
      const [order] = await Order.create(
        [
          {
            userId: new mongoose.Types.ObjectId(userId),
            status: ORDER_STATUS.PENDING_PAYMENT,
            items: orderLineItems,
            shippingAddress,
            cartSubtotal: evaluation.cartSubtotal,
            totalDiscount: evaluation.totalDiscount,
            totalTaxableAmount: evaluation.totalTaxableAmount,
            totalGst: evaluation.totalGst,
            shippingFee: totalShipping,
            finalPayableAmount: grandTotal,
            appliedRuleCodes: evaluation.appliedRuleCodes,
            paymentStatus: "PENDING",
            reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        ],
        { session },
      );

      // Branch gateway interaction based on selected payment method
      if (paymentMethod === "COD") {
        order.paymentProvider = "COD";
        order.paymentStatus = "PENDING";
        order.status = ORDER_STATUS.PROCESSING;
        order.invoiceNumber = `INV-${new Date().getFullYear()}-${order._id.toString().slice(-6).toUpperCase()}`;
        order.invoiceGeneratedAt = new Date();

        // Commit physical stock sale immediately for confirmed COD orders
        for (const item of order.items) {
          await this.inventoryService.commitSale(
            {
              variantId: item.variantId.toString(),
              quantity: item.quantity,
              userId: order.userId.toString(),
              orderId: order._id.toString(),
            },
            ctx,
            session,
          );
        }

        await order.save({ session });
      } else if (this.paymentGateway) {
        try {
          const gatewayOrder = await this.paymentGateway.createPaymentOrder({
            orderId: order._id.toString(),
            amountInRupees: grandTotal,
            notes: {
              internalOrderId: order._id.toString(),
              userId,
            },
          });
          order.gatewayOrderId = gatewayOrder.gatewayOrderId;
          order.paymentProvider = "RAZORPAY";
          await order.save({ session });
        } catch (gwErr) {
          ctx?.logger?.error(
            { err: gwErr, orderId: order._id },
            "Failed to register order with Razorpay payment gateway",
          );
          throw new OrderError(
            "PAYMENT_GATEWAY_ERROR",
            "Payment gateway initialization failed. Please retry.",
            502,
          );
        }
      }

      // Clear the user's cart
      await Cart.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $set: { items: [] } },
        { session },
      );

      await session.commitTransaction();

      ctx?.logger?.info(
        {
          orderId: order._id,
          finalPayableAmount: grandTotal,
          gatewayOrderId: order.gatewayOrderId,
        },
        "Checkout order created successfully in PENDING_PAYMENT status",
      );

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Retrieves an order by ID with authorization boundary verification.
   */
  async getOrderById(
    orderId: string,
    userId?: string,
    ctx?: RequestContext,
  ): Promise<IOrder> {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new OrderError("ORDER_NOT_FOUND", "Invalid order ID format", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new OrderError("ORDER_NOT_FOUND", "Order not found", 404);
    }

    // Authorization rule: user A cannot read user B's order
    if (userId && order.userId.toString() !== userId) {
      ctx?.logger?.warn(
        { orderId, requestingUser: userId, orderOwner: order.userId },
        "Unauthorized access attempt to order",
      );
      throw new OrderError(
        "FORBIDDEN",
        "You do not have permission to view this order",
        403,
      );
    }

    return order;
  }

  /**
   * Retrieves paginated orders belonging to a specific user or platform-wide (if admin).
   */
  async getUserOrders(
    input: GetUserOrdersInput | string,
    ctx?: RequestContext,
  ): Promise<PaginatedOrdersResult> {
    const params: GetUserOrdersInput =
      typeof input === "string" ? { userId: input } : input;

    const { userId, status, page, limit } = params;
    const { page: safePage, limit: safeLimit, skip } = parsePagination(
      page,
      limit,
    );

    const query: mongoose.FilterQuery<IOrder> = {};
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new OrderError("INVALID_USER_ID", "Invalid user ID format", 400);
      }
      query.userId = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      query.status = status;
    }

    ctx?.logger?.info(
      { userId, status, page: safePage, limit: safeLimit },
      "Fetching paginated orders",
    );

    const [items, totalCount] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      Order.countDocuments(query),
    ]);

    const pagination = buildPaginationMeta(totalCount, safePage, safeLimit);

    return { items, pagination };
  }

  /**
   * Validates and applies internal order status state machine transitions.
   */
  async transitionOrderStatus(
    input: TransitionOrderStatusInput,
    ctx?: RequestContext,
  ): Promise<IOrder> {
    const { orderId, targetStatus, reason } = input;

    const order = await this.getOrderById(orderId, undefined, ctx);

    if (!isValidOrderStatusTransition(order.status, targetStatus)) {
      ctx?.logger?.warn(
        { orderId, currentStatus: order.status, targetStatus },
        "Illegal order status transition rejected",
      );
      throw new OrderError(
        "INVALID_STATUS_TRANSITION",
        `Cannot transition order status from ${order.status} to ${targetStatus}`,
        400,
      );
    }

    order.status = targetStatus;
    if (targetStatus === ORDER_STATUS.CANCELLED) {
      order.cancelledAt = new Date();
      if (reason) order.cancellationReason = reason;
    }

    await order.save();

    ctx?.logger?.info(
      { orderId, newStatus: targetStatus },
      "Order status updated successfully",
    );

    return order;
  }

  /**
   * Marks an order as PAID upon payment gateway confirmation.
   * Commits inventory sales to the ledger inside a transaction.
   * Fully atomic and idempotent to withstand duplicate deliveries and race conditions.
   */
  async markOrderAsPaid(
    input: MarkOrderPaidInput,
    ctx?: RequestContext,
  ): Promise<IOrder> {
    const { orderId, paymentProvider, paymentTransactionId } = input;

    const order = await this.getOrderById(orderId, undefined, ctx);

    // Idempotency fast-path: If already paid, return safely with zero side effects
    if (order.status === ORDER_STATUS.PAID) {
      ctx?.logger?.info(
        { orderId, paymentTransactionId },
        "Order is already marked as PAID (Idempotent response)",
      );
      return order;
    }

    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      throw new OrderError(
        "INVALID_STATUS_TRANSITION",
        `Cannot mark order as paid: current status is ${order.status}`,
        400,
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Atomic conditional update: acts as a distributed lock so only one concurrent request claims the transition
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(orderId),
          status: ORDER_STATUS.PENDING_PAYMENT,
        },
        {
          $set: {
            status: ORDER_STATUS.PAID,
            paymentStatus: "COMPLETED",
            paymentProvider,
            paymentTransactionId,
            paidAt: new Date(),
            invoiceNumber: `INV-${new Date().getFullYear()}-${orderId.slice(-6).toUpperCase()}`,
            invoiceGeneratedAt: new Date(),
          },
        },
        { new: true, session },
      );

      if (!updatedOrder) {
        // Concurrently claimed by another verify or webhook worker
        await session.abortTransaction();
        ctx?.logger?.info(
          { orderId },
          "Concurrent payment confirmation detected, returning existing order state",
        );
        return this.getOrderById(orderId, undefined, ctx);
      }

      // Commit inventory sale for each line item (deducts physical stock and clears reservation)
      for (const item of updatedOrder.items) {
        await this.inventoryService.commitSale(
          {
            variantId: item.variantId.toString(),
            quantity: item.quantity,
            userId: updatedOrder.userId.toString(),
            orderId: updatedOrder._id.toString(),
          },
          ctx,
          session,
        );
      }

      await session.commitTransaction();

      ctx?.logger?.info(
        { orderId, paymentTransactionId },
        "Order marked as PAID and inventory committed",
      );

      return updatedOrder;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Verifies the cryptographic HMAC-SHA256 signature from the client checkout modal.
   * If genuine, transitions the order to PAID idempotently.
   */
  async verifyPayment(
    input: VerifyOrderPaymentInput,
    ctx?: RequestContext,
  ): Promise<IOrder> {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      userId,
    } = input;

    if (!this.paymentGateway) {
      throw new OrderError(
        "PAYMENT_GATEWAY_NOT_CONFIGURED",
        "Payment gateway is not configured",
        500,
      );
    }

    // Verify ownership and existence
    const order = await this.getOrderById(orderId, userId, ctx);

    // If order has an associated gateway order ID, ensure it matches
    if (order.gatewayOrderId && order.gatewayOrderId !== razorpayOrderId) {
      throw new OrderError(
        "PAYMENT_MISMATCH",
        "Razorpay order ID does not match order record",
        400,
      );
    }

    // Verify cryptographic signature
    const isValid = this.paymentGateway.verifyPaymentSignature({
      gatewayOrderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      ctx?.logger?.warn(
        { orderId, razorpayOrderId, razorpayPaymentId },
        "Cryptographic payment signature verification failed",
      );
      throw new OrderError(
        "INVALID_SIGNATURE",
        "Payment verification failed: invalid signature",
        400,
      );
    }

    // Signature is genuine: transition order to PAID
    return this.markOrderAsPaid(
      {
        orderId,
        paymentProvider: "RAZORPAY",
        paymentTransactionId: razorpayPaymentId,
      },
      ctx,
    );
  }

  /**
   * Processes incoming server-to-server Razorpay webhooks.
   * Cryptographically verifies the raw payload signature and idempotently marks order as paid.
   */
  async handleRazorpayWebhook(
    input: HandleRazorpayWebhookInput,
    ctx?: RequestContext,
  ): Promise<{ handled: boolean; orderId?: string }> {
    const { rawBody, signature } = input;

    if (!this.paymentGateway) {
      throw new OrderError(
        "PAYMENT_GATEWAY_NOT_CONFIGURED",
        "Payment gateway is not configured",
        500,
      );
    }

    const isValid = this.paymentGateway.verifyWebhookSignature(
      rawBody,
      signature,
    );
    if (!isValid) {
      ctx?.logger?.warn("Invalid Razorpay webhook signature");
      throw new OrderError("INVALID_SIGNATURE", "Invalid webhook signature", 400);
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new OrderError(
        "INVALID_PAYLOAD",
        "Malformed webhook JSON payload",
        400,
      );
    }

    ctx?.logger?.info(
      { eventType: event.event },
      "Processing verified Razorpay webhook event",
    );

    // Handle payment success events (payment.captured or order.paid)
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (!gatewayOrderId || !paymentId) {
        return { handled: false };
      }

      const order = await Order.findOne({ gatewayOrderId });
      if (!order) {
        ctx?.logger?.warn(
          { gatewayOrderId },
          "Webhook gateway order not found in database",
        );
        return { handled: false };
      }

      await this.markOrderAsPaid(
        {
          orderId: order._id.toString(),
          paymentProvider: "RAZORPAY",
          paymentTransactionId: paymentId,
        },
        ctx,
      );

      return { handled: true, orderId: order._id.toString() };
    }

    // Handle payment failure events
    if (event.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id;
      if (gatewayOrderId) {
        const order = await Order.findOne({ gatewayOrderId });
        if (order && order.status === ORDER_STATUS.PENDING_PAYMENT) {
          order.paymentStatus = "FAILED";
          await order.save();
          ctx?.logger?.info(
            { orderId: order._id, errorDesc: paymentEntity?.error_description },
            "Recorded payment failure on pending order from webhook",
          );
          return { handled: true, orderId: order._id.toString() };
        }
      }
    }

    return { handled: false };
  }

  /**
   * Cancels an order and restores or releases stock appropriately.
   */
  async cancelOrder(
    input: CancelOrderInput,
    ctx?: RequestContext,
  ): Promise<IOrder> {
    const { orderId, reason, userId } = input;

    const order = await this.getOrderById(orderId, userId, ctx);

    if (!isValidOrderStatusTransition(order.status, ORDER_STATUS.CANCELLED)) {
      throw new OrderError(
        "INVALID_STATUS_TRANSITION",
        `Cannot cancel order with status ${order.status}`,
        400,
      );
    }

    const previousStatus = order.status;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (previousStatus === ORDER_STATUS.PENDING_PAYMENT) {
        // Soft reservation was in place: release reservations back to available stock
        for (const item of order.items) {
          await this.inventoryService.releaseReservation(
            {
              userId: order.userId.toString(),
              variantId: item.variantId.toString(),
              quantity: item.quantity,
              reason: `Order cancelled: ${reason}`,
            },
            ctx,
            session,
          );
        }
      } else if (
        previousStatus === ORDER_STATUS.PAID ||
        previousStatus === ORDER_STATUS.PROCESSING
      ) {
        // Sale was committed: restock items into physical warehouse inventory
        for (const item of order.items) {
          await this.inventoryService.restock(
            {
              variantId: item.variantId.toString(),
              quantity: item.quantity,
              reason: `Order ${order._id} cancelled: ${reason}`,
              refId: order._id.toString(),
            },
            ctx,
            session,
          );
        }
      }

      order.status = ORDER_STATUS.CANCELLED;
      order.cancelledAt = new Date();
      order.cancellationReason = reason;

      if (order.paymentStatus === "COMPLETED") {
        order.paymentStatus = "REFUNDED";
      }

      await order.save({ session });
      await session.commitTransaction();

      ctx?.logger?.info(
        { orderId, reason, previousStatus },
        "Order cancelled and inventory restored/released successfully",
      );

      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
