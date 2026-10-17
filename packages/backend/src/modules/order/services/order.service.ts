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
  IOrderService,
  MarkOrderPaidInput,
  TransitionOrderStatusInput,
} from "../interfaces/order.service.interface.js";
import { OrderError } from "../errors/order.errors.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import { EvaluateCartItemInput } from "../../pricing/interfaces/pricing.service.interface.js";
import { roundToTwoDecimals } from "../../../shared/utils/gst.utils.js";

export class OrderService implements IOrderService {
  constructor(
    private readonly pricingService: IPricingService,
    private readonly inventoryService: IInventoryService,
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
    const { userId, shippingAddress, couponCode, shippingFee = 0 } = input;

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
    const cart = await Cart.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });

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

      // Clear the user's cart
      await Cart.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        { $set: { items: [] } },
        { session },
      );

      await session.commitTransaction();

      ctx?.logger?.info(
        { orderId: order._id, finalPayableAmount: grandTotal },
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
   * Retrieves all orders belonging to a specific user.
   */
  async getUserOrders(
    userId: string,
    ctx?: RequestContext,
  ): Promise<IOrder[]> {
    ctx?.logger?.info({ userId }, "Fetching user orders");
    return Order.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({
      createdAt: -1,
    });
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
   */
  async markOrderAsPaid(
    input: MarkOrderPaidInput,
    ctx?: RequestContext,
  ): Promise<IOrder> {
    const { orderId, paymentProvider, paymentTransactionId } = input;

    const order = await this.getOrderById(orderId, undefined, ctx);

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
      // Commit inventory sale for each line item (deducts physical stock and clears reservation)
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

      order.status = ORDER_STATUS.PAID;
      order.paymentStatus = "COMPLETED";
      order.paymentProvider = paymentProvider;
      order.paymentTransactionId = paymentTransactionId;
      order.paidAt = new Date();

      await order.save({ session });
      await session.commitTransaction();

      ctx?.logger?.info(
        { orderId, paymentTransactionId },
        "Order marked as PAID and inventory committed",
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
