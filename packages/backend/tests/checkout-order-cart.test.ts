import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { Cart } from "../src/modules/inventory/models/Cart.model.js";
import { ProductVariant } from "../src/modules/catalog/models/productVariant.model.js";
import { Product } from "../src/modules/catalog/models/product.model.js";
import { Brand } from "../src/modules/catalog/models/brand.model.js";
import { Category } from "../src/modules/catalog/models/category.model.js";
import { PricingRule } from "../src/modules/pricing/models/pricingRule.model.js";
import { CartReservation } from "../src/modules/inventory/models/cartReservation.model.js";
import { InventoryEvent } from "../src/modules/inventory/models/inventoryEvent.model.js";
import { Order, ORDER_STATUS } from "../src/modules/order/models/order.model.js";
import { CartService } from "../src/modules/cart/services/cart.service.js";
import { OrderService } from "../src/modules/order/services/order.service.js";
import { PricingService } from "../src/modules/pricing/services/pricing.service.js";
import { InventoryService } from "../src/modules/inventory/services/inventory.service.js";
import { CartError } from "../src/modules/cart/errors/cart.errors.js";
import { OrderError } from "../src/modules/order/errors/order.errors.js";

describe("Internal Pieces: Cart Service, Order Snapshot Model & Checkout Intent Orchestrator", () => {
  const pricingService = new PricingService();
  const inventoryService = new InventoryService();
  const cartService = new CartService(pricingService);
  const orderService = new OrderService(pricingService, inventoryService);

  let userIdA: string;
  let userIdB: string;
  let variantIdA: string;
  let variantIdB: string;
  let productId: string;
  let categoryId: string;
  let brandId: string;

  const validShippingAddress = {
    name: "Aryan Srivastava",
    phone: "9876543210",
    addressLine1: "Flat 402, Sunshine Heights",
    addressLine2: "Opposite Tech Park",
    locality: "Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    country: "India",
  };

  beforeEach(async () => {
    userIdA = new mongoose.Types.ObjectId().toString();
    userIdB = new mongoose.Types.ObjectId().toString();

    const brand = await Brand.create({
      name: "Vogue Brand",
      slug: `vogue-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Fashion brand",
      isActive: true,
    });
    brandId = brand._id.toString();

    const category = await Category.create({
      name: "Formal Shirts",
      slug: `shirts-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Men formal shirts",
      isActive: true,
    });
    categoryId = category._id.toString();

    const product = await Product.create({
      name: "Oxford Cotton Shirt",
      slug: `oxford-shirt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Classic slim fit button down",
      category: category._id,
      brand: brand._id,
      hsnCode: "620520",
      gstRate: 5,
      isActive: true,
    });
    productId = product._id.toString();

    // Variant A: ₹999 selling price, stock = 5
    const variantA = await ProductVariant.create({
      productId: product._id,
      name: "Oxford Cotton Shirt - Sky Blue M",
      slug: `oxford-blue-m-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sku: `SKU-BLU-M-${Date.now()}`,
      sellingPrice: 999,
      mrp: 1499,
      stockQuantity: 5,
      reservedQuantity: 0,
      attributes: [{ name: "Size", value: "M" }],
      images: ["https://example.com/blue-shirt.jpg"],
      isActive: true,
    });
    variantIdA = variantA._id.toString();

    // Variant B: ₹1200 selling price, stock = 2
    const variantB = await ProductVariant.create({
      productId: product._id,
      name: "Oxford Cotton Shirt - White L",
      slug: `oxford-white-l-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sku: `SKU-WHT-L-${Date.now()}`,
      sellingPrice: 1200,
      mrp: 1800,
      stockQuantity: 2,
      reservedQuantity: 0,
      attributes: [{ name: "Size", value: "L" }],
      images: ["https://example.com/white-shirt.jpg"],
      isActive: true,
    });
    variantIdB = variantB._id.toString();
  });

  describe("Internal Piece 1: Cart Service Layer", () => {
    it("adds variant to cart and returns dynamic summary", async () => {
      const summary = await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 2,
      });

      expect(summary.items).toHaveLength(1);
      expect(summary.items[0].variantId).toBe(variantIdA);
      expect(summary.items[0].quantity).toBe(2);
      expect(summary.items[0].originalUnitPrice).toBe(999);
      expect(summary.items[0].lineSubtotal).toBe(1998);
      expect(summary.cartSubtotal).toBe(1998);
      expect(summary.finalPayableAmount).toBe(1998);
      // Verify apparel GST inclusive formula at 5% (since unit price 999 <= 999)
      expect(summary.items[0].gstRate).toBe(5);
      expect(summary.items[0].gstAmountPerUnit).toBe(47.57);
    });

    it("rejects adding item to cart when requested quantity exceeds available stock", async () => {
      await expect(
        cartService.addItem({
          userId: userIdA,
          variantId: variantIdB, // stock is 2
          quantity: 3,
        }),
      ).rejects.toThrow(CartError);
    });

    it("updates item quantity in cart when within available stock", async () => {
      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 1,
      });

      const updated = await cartService.updateItemQuantity({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 4,
      });

      expect(updated.items[0].quantity).toBe(4);
      expect(updated.cartSubtotal).toBe(3996);
    });

    it("removes item from cart when quantity is updated to zero", async () => {
      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 1,
      });

      const updated = await cartService.updateItemQuantity({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 0,
      });

      expect(updated.items).toHaveLength(0);
      expect(updated.finalPayableAmount).toBe(0);
    });

    it("evaluates dynamic pricing rules and inclusive GST in live cart summary", async () => {
      // Create a 10% discount rule
      await PricingRule.create({
        name: "Festive 10%",
        code: "FESTIVE10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        priority: 10,
        validFrom: new Date(Date.now() - 3600000),
        validTo: new Date(Date.now() + 3600000),
        isActive: true,
      });

      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA, // 999
        quantity: 1,
      });

      const summary = await cartService.getCartSummary(userIdA, "FESTIVE10");

      expect(summary.cartSubtotal).toBe(999);
      expect(summary.items[0].discountPerUnit).toBe(99.9);
      expect(summary.items[0].discountedUnitPrice).toBe(899.1);
      expect(summary.totalDiscount).toBe(99.9);
      expect(summary.finalPayableAmount).toBe(899.1);
      expect(summary.appliedRuleCodes).toContain("FESTIVE10");
    });
  });

  describe("Internal Piece 2: Order & OrderLineItem Snapshot Model", () => {
    it("creates immutable legal snapshot on OrderLineItem preserving exact prices, HSN, and GST", async () => {
      const order = await Order.create({
        userId: new mongoose.Types.ObjectId(userIdA),
        status: ORDER_STATUS.PENDING_PAYMENT,
        items: [
          {
            variantId: new mongoose.Types.ObjectId(variantIdA),
            productId: new mongoose.Types.ObjectId(productId),
            sku: "SKU-BLU-M-SNAPSHOT",
            productName: "Original Oxford Shirt",
            variantName: "Original Sky Blue M",
            image: "https://example.com/blue.jpg",
            hsnCode: "620520",
            quantity: 2,
            originalUnitPrice: 999,
            discountPerUnit: 100,
            discountedUnitPrice: 899,
            appliedRuleCode: "FLAT100",
            gstRate: 5,
            gstAmountPerUnit: 42.81,
            taxableAmountPerUnit: 856.19,
            lineTaxTotal: 85.62,
            lineSubtotal: 1798,
            lineTaxableTotal: 1712.38,
          },
        ],
        shippingAddress: validShippingAddress,
        cartSubtotal: 1998,
        totalDiscount: 200,
        totalTaxableAmount: 1712.38,
        totalGst: 85.62,
        shippingFee: 0,
        finalPayableAmount: 1798,
        appliedRuleCodes: ["FLAT100"],
        paymentStatus: "PENDING",
        reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      expect(order._id).toBeDefined();
      expect(order.status).toBe(ORDER_STATUS.PENDING_PAYMENT);
      expect(order.items[0].vendorId).toBe("DEFAULT_VENDOR");
      expect(order.items[0].hsnCode).toBe("620520");
      expect(order.items[0].gstRate).toBe(5);
      expect(order.items[0].discountedUnitPrice).toBe(899);
      expect(order.shippingAddress.pincode).toBe("560038");

      // Verify changing catalog product price afterwards does not affect the order snapshot
      await ProductVariant.findByIdAndUpdate(variantIdA, { sellingPrice: 2999 });
      const fetchedOrder = await Order.findById(order._id);
      expect(fetchedOrder?.items[0].discountedUnitPrice).toBe(899);
    });

    it("enforces valid order status state transitions PENDING_PAYMENT -> PAID -> PROCESSING -> SHIPPED -> DELIVERED", async () => {
      const order = await Order.create({
        userId: new mongoose.Types.ObjectId(userIdA),
        status: ORDER_STATUS.PENDING_PAYMENT,
        items: [
          {
            variantId: new mongoose.Types.ObjectId(variantIdA),
            productId: new mongoose.Types.ObjectId(productId),
            sku: "SKU-VAL-1",
            productName: "Shirt",
            variantName: "Blue",
            hsnCode: "620520",
            quantity: 1,
            originalUnitPrice: 999,
            discountPerUnit: 0,
            discountedUnitPrice: 999,
            gstRate: 5,
            gstAmountPerUnit: 47.57,
            taxableAmountPerUnit: 951.43,
            lineTaxTotal: 47.57,
            lineSubtotal: 999,
            lineTaxableTotal: 951.43,
          },
        ],
        shippingAddress: validShippingAddress,
        cartSubtotal: 999,
        totalDiscount: 0,
        totalTaxableAmount: 951.43,
        totalGst: 47.57,
        shippingFee: 0,
        finalPayableAmount: 999,
        paymentStatus: "PENDING",
        reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      // PENDING_PAYMENT -> PAID
      const paid = await orderService.transitionOrderStatus({
        orderId: order._id.toString(),
        targetStatus: ORDER_STATUS.PAID,
      });
      expect(paid.status).toBe(ORDER_STATUS.PAID);

      // PAID -> PROCESSING
      const processing = await orderService.transitionOrderStatus({
        orderId: order._id.toString(),
        targetStatus: ORDER_STATUS.PROCESSING,
      });
      expect(processing.status).toBe(ORDER_STATUS.PROCESSING);

      // PROCESSING -> SHIPPED
      const shipped = await orderService.transitionOrderStatus({
        orderId: order._id.toString(),
        targetStatus: ORDER_STATUS.SHIPPED,
      });
      expect(shipped.status).toBe(ORDER_STATUS.SHIPPED);

      // SHIPPED -> DELIVERED
      const delivered = await orderService.transitionOrderStatus({
        orderId: order._id.toString(),
        targetStatus: ORDER_STATUS.DELIVERED,
      });
      expect(delivered.status).toBe(ORDER_STATUS.DELIVERED);
    });

    it("rejects invalid status transitions such as shipping a cancelled order", async () => {
      const order = await Order.create({
        userId: new mongoose.Types.ObjectId(userIdA),
        status: ORDER_STATUS.CANCELLED,
        items: [
          {
            variantId: new mongoose.Types.ObjectId(variantIdA),
            productId: new mongoose.Types.ObjectId(productId),
            sku: "SKU-VAL-2",
            productName: "Shirt",
            variantName: "Blue",
            hsnCode: "620520",
            quantity: 1,
            originalUnitPrice: 999,
            discountPerUnit: 0,
            discountedUnitPrice: 999,
            gstRate: 5,
            gstAmountPerUnit: 47.57,
            taxableAmountPerUnit: 951.43,
            lineTaxTotal: 47.57,
            lineSubtotal: 999,
            lineTaxableTotal: 951.43,
          },
        ],
        shippingAddress: validShippingAddress,
        cartSubtotal: 999,
        totalDiscount: 0,
        totalTaxableAmount: 951.43,
        totalGst: 47.57,
        shippingFee: 0,
        finalPayableAmount: 999,
        paymentStatus: "PENDING",
        reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });

      // CANCELLED is terminal: cannot transition to SHIPPED or PAID
      await expect(
        orderService.transitionOrderStatus({
          orderId: order._id.toString(),
          targetStatus: ORDER_STATUS.SHIPPED,
        }),
      ).rejects.toThrow(OrderError);
    });
  });

  describe("Internal Piece 3: The Checkout Intent Orchestrator", () => {
    it("rejects checkout intent when cart is empty", async () => {
      await expect(
        orderService.createCheckoutOrder({
          userId: userIdA,
          shippingAddress: validShippingAddress,
        }),
      ).rejects.toThrow(OrderError);
    });

    it("rejects checkout intent when any cart item has insufficient stock", async () => {
      // Add item within stock
      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdB, // stock = 2
        quantity: 2,
      });

      // Simulate stock reduced out of band before user clicks checkout
      await ProductVariant.findByIdAndUpdate(variantIdB, {
        stockQuantity: 1,
      });

      await expect(
        orderService.createCheckoutOrder({
          userId: userIdA,
          shippingAddress: validShippingAddress,
        }),
      ).rejects.toThrow(OrderError);
    });

    it("atomically reserves stock with 15m TTL and creates order in PENDING_PAYMENT status", async () => {
      // Initial stock = 5, reserved = 0
      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 2,
      });

      const order = await orderService.createCheckoutOrder({
        userId: userIdA,
        shippingAddress: validShippingAddress,
      });

      expect(order.status).toBe(ORDER_STATUS.PENDING_PAYMENT);
      expect(order.paymentStatus).toBe("PENDING");
      expect(order.items).toHaveLength(1);
      expect(order.items[0].vendorId).toBe("Default Vendor");
      expect(order.finalPayableAmount).toBe(1998);

      // Verify atomic stock reservation: reservedQuantity should now be 2
      const variant = await ProductVariant.findById(variantIdA);
      expect(variant?.stockQuantity).toBe(5);
      expect(variant?.reservedQuantity).toBe(2);
      expect((variant as any)?.availableStock).toBe(3);

      // Verify CartReservation was created with TTL
      const reservation = await CartReservation.findOne({
        userId: new mongoose.Types.ObjectId(userIdA),
        productVariantId: new mongoose.Types.ObjectId(variantIdA),
      });
      expect(reservation).toBeDefined();
      expect(reservation?.reservedQuantity).toBe(2);
      expect(reservation?.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Verify cart was emptied
      const cart = await Cart.findOne({
        userId: new mongoose.Types.ObjectId(userIdA),
      });
      expect(cart?.items).toHaveLength(0);
    });

    it("markOrderAsPaid commits inventory sale and transitions order to PAID", async () => {
      // Add and checkout
      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 2,
      });

      const order = await orderService.createCheckoutOrder({
        userId: userIdA,
        shippingAddress: validShippingAddress,
      });

      // Mark as paid
      const paidOrder = await orderService.markOrderAsPaid({
        orderId: order._id.toString(),
        paymentProvider: "RAZORPAY",
        paymentTransactionId: "pay_test_12345",
      });

      expect(paidOrder.status).toBe(ORDER_STATUS.PAID);
      expect(paidOrder.paymentStatus).toBe("COMPLETED");
      expect(paidOrder.paymentTransactionId).toBe("pay_test_12345");
      expect(paidOrder.paidAt).toBeDefined();

      // Verify physical stock was permanently deducted and reservation cleared
      const variant = await ProductVariant.findById(variantIdA);
      expect(variant?.stockQuantity).toBe(3); // 5 - 2 = 3
      expect(variant?.reservedQuantity).toBe(0);

      // Verify immutable InventoryEvent ledger recorded the SALE
      const saleEvent = await InventoryEvent.findOne({
        productVariantId: new mongoose.Types.ObjectId(variantIdA),
        eventType: "SALE",
      });
      expect(saleEvent).toBeDefined();
      expect(saleEvent?.delta).toBe(-2);
      expect(saleEvent?.ResultingStockQuantity).toBe(3);
    });

    it("cancelling a PENDING_PAYMENT order releases the stock reservation", async () => {
      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 2,
      });

      const order = await orderService.createCheckoutOrder({
        userId: userIdA,
        shippingAddress: validShippingAddress,
      });

      // Cancel before payment
      const cancelledOrder = await orderService.cancelOrder({
        orderId: order._id.toString(),
        reason: "User changed mind",
      });

      expect(cancelledOrder.status).toBe(ORDER_STATUS.CANCELLED);

      // Verify stock reservation was released back to available pool
      const variant = await ProductVariant.findById(variantIdA);
      expect(variant?.stockQuantity).toBe(5);
      expect(variant?.reservedQuantity).toBe(0);
      expect((variant as any)?.availableStock).toBe(5);
    });

    it("cancelling a PAID order restocks physical inventory", async () => {
      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 2,
      });

      const order = await orderService.createCheckoutOrder({
        userId: userIdA,
        shippingAddress: validShippingAddress,
      });

      await orderService.markOrderAsPaid({
        orderId: order._id.toString(),
        paymentProvider: "RAZORPAY",
        paymentTransactionId: "pay_refund_test",
      });

      // Stock is now 3. Now cancel/refund the order:
      const cancelledOrder = await orderService.cancelOrder({
        orderId: order._id.toString(),
        reason: "Customer return request",
      });

      expect(cancelledOrder.status).toBe(ORDER_STATUS.CANCELLED);
      expect(cancelledOrder.paymentStatus).toBe("REFUNDED");

      // Verify stock was restored to 5
      const variant = await ProductVariant.findById(variantIdA);
      expect(variant?.stockQuantity).toBe(5);
    });

    it("prevents unauthorized user from accessing another user's order", async () => {
      await cartService.addItem({
        userId: userIdA,
        variantId: variantIdA,
        quantity: 1,
      });

      const order = await orderService.createCheckoutOrder({
        userId: userIdA,
        shippingAddress: validShippingAddress,
      });

      // User A can access
      const userAOrder = await orderService.getOrderById(
        order._id.toString(),
        userIdA,
      );
      expect(userAOrder._id.toString()).toBe(order._id.toString());

      // User B cannot access User A's order
      await expect(
        orderService.getOrderById(order._id.toString(), userIdB),
      ).rejects.toThrow(OrderError);
    });
  });
});
