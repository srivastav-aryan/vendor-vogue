import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { ProductVariant } from "../../src/modules/catalog/models/productVariant.model.js";
import { Product } from "../../src/modules/catalog/models/product.model.js";
import { Brand } from "../../src/modules/catalog/models/brand.model.js";
import { Category } from "../../src/modules/catalog/models/category.model.js";
import { Cart } from "../../src/modules/inventory/models/Cart.model.js";
import { InventoryEvent } from "../../src/modules/inventory/models/inventoryEvent.model.js";
import { Order, ORDER_STATUS } from "../../src/modules/order/models/order.model.js";
import { PricingService } from "../../src/modules/pricing/services/pricing.service.js";
import { InventoryService } from "../../src/modules/inventory/services/inventory.service.js";
import { OrderService } from "../../src/modules/order/services/order.service.js";
import { ReservationExpiryWorker } from "../../src/modules/order/workers/reservation-expiry.worker.js";

describe("Integration: Reservation Expiry Cleanup Worker", () => {
  const pricingService = new PricingService();
  const inventoryService = new InventoryService();
  const orderService = new OrderService(pricingService, inventoryService);
  const worker = new ReservationExpiryWorker(orderService, {
    intervalMs: 1000,
    batchSize: 50,
  });

  let userId: string;
  let variantId: string;
  let productId: string;

  const validAddress = {
    name: "Aryan",
    phone: "9876543210",
    addressLine1: "123 Street",
    locality: "Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    country: "India",
  };

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId().toString();

    const brand = await Brand.create({
      name: "Worker Test Brand",
      slug: `worker-brand-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Test brand description",
      isActive: true,
    });

    const category = await Category.create({
      name: "Worker Test Category",
      slug: `worker-cat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Test category description",
      isActive: true,
    });

    const product = await Product.create({
      name: "Worker Shirt",
      slug: `worker-shirt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Test product description",
      category: category._id,
      brand: brand._id,
      hsnCode: "620520",
      gstRate: 5,
      isActive: true,
    });
    productId = product._id.toString();

    const variant = await ProductVariant.create({
      productId: product._id,
      name: "Worker Shirt - Blue M",
      slug: `worker-shirt-blue-m-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sku: `SKU-WORKER-${Date.now()}`,
      sellingPrice: 999,
      mrp: 1499,
      stockQuantity: 10,
      reservedQuantity: 0,
      isActive: true,
    });
    variantId = variant._id.toString();
  });

  it("finds and cancels expired PENDING_PAYMENT orders and restores reserved stock", async () => {
    // 1. Add item to user's cart
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 3 }],
    });

    // 2. Checkout order (this reserves 3 units)
    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    // Verify stock is reserved
    let variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(10);
    expect(variant?.reservedQuantity).toBe(3);

    // 3. Fast-forward reservation expiry into the past (expired 2 minutes ago)
    await Order.findByIdAndUpdate(order._id, {
      reservationExpiresAt: new Date(Date.now() - 2 * 60 * 1000),
    });

    // 4. Trigger the worker sweep
    const result = await worker.processExpiredOrders();

    expect(result.scanned).toBe(1);
    expect(result.cancelled).toBe(1);
    expect(result.failed).toBe(0);

    // 5. Verify order was marked CANCELLED
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder?.status).toBe(ORDER_STATUS.CANCELLED);
    expect(updatedOrder?.cancelledAt).toBeDefined();
    expect(updatedOrder?.cancellationReason).toContain("Payment window expired");

    // 6. Verify reserved quantity was released back to 0
    variant = await ProductVariant.findById(variantId);
    expect(variant?.reservedQuantity).toBe(0);
    expect(variant?.stockQuantity).toBe(10);

    // 7. Verify inventory audit ledger recorded RESERVATION_EXPIRED
    const events = await InventoryEvent.find({
      productVariantId: variant?._id,
      eventType: "RESERVATION_EXPIRED",
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it("leaves active (non-expired) orders untouched", async () => {
    // Add to cart and checkout
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 2 }],
    });

    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    // Order has reservationExpiresAt 15 minutes in the future by default
    const result = await worker.processExpiredOrders();

    expect(result.scanned).toBe(0);
    expect(result.cancelled).toBe(0);

    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedOrder?.status).toBe(ORDER_STATUS.PENDING_PAYMENT);

    const variant = await ProductVariant.findById(variantId);
    expect(variant?.reservedQuantity).toBe(2);
  });

  it("safely ignores orders that have already been paid", async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 1 }],
    });

    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    // Mark order as paid
    await orderService.markOrderAsPaid({
      orderId: order._id.toString(),
      paymentProvider: "RAZORPAY",
      paymentTransactionId: "pay_test_already_paid",
    });

    // Even if its reservationExpiresAt date is in the past:
    await Order.findByIdAndUpdate(order._id, {
      reservationExpiresAt: new Date(Date.now() - 5 * 60 * 1000),
    });

    const result = await worker.processExpiredOrders();

    // Query filters for status: PENDING_PAYMENT, so paid order is not scanned
    expect(result.scanned).toBe(0);
    expect(result.cancelled).toBe(0);

    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedOrder?.status).toBe(ORDER_STATUS.PAID);
  });

  it("supports start and stop lifecycle without error", () => {
    expect(() => worker.start()).not.toThrow();
    // Second start is safely idempotent
    expect(() => worker.start()).not.toThrow();
    expect(() => worker.stop()).not.toThrow();
  });
});
