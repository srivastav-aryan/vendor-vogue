import { describe, it, expect, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import crypto from "node:crypto";
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
import { RazorpayPaymentService } from "../../src/modules/payment/services/razorpay.service.js";
import { OrderError } from "../../src/modules/order/errors/order.errors.js";

describe("Integration: Razorpay Dual-Path Payment Verify & Webhook Architecture", () => {
  const keyId = "rzp_test_flowKey123";
  const keySecret = "secretKeySample123456789";
  const webhookSecret = "webhookSecretSample987654321";

  const pricingService = new PricingService();
  const inventoryService = new InventoryService();
  const paymentGateway = new RazorpayPaymentService(
    keyId,
    keySecret,
    webhookSecret,
  );
  const orderService = new OrderService(
    pricingService,
    inventoryService,
    paymentGateway,
  );

  let userId: string;
  let variantId: string;
  let productId: string;

  const validAddress = {
    name: "Aryan Srivastava",
    phone: "9876543210",
    addressLine1: "Flat 402, Sunshine Heights",
    locality: "Indiranagar",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560038",
    country: "India",
  };

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId().toString();

    // Mock createPaymentOrder so it doesn't make outbound HTTP calls to Razorpay
    vi.spyOn(paymentGateway, "createPaymentOrder").mockImplementation(
      async (input) => ({
        gatewayOrderId: `order_rzp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        amountInPaise: Math.round(input.amountInRupees * 100),
        currency: "INR",
      }),
    );

    const brand = await Brand.create({
      name: "Payment Test Brand",
      slug: `brand-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Brand desc",
      isActive: true,
    });

    const category = await Category.create({
      name: "Payment Test Category",
      slug: `cat-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Category desc",
      isActive: true,
    });

    const product = await Product.create({
      name: "Payment Linen Shirt",
      slug: `shirt-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      description: "Product desc",
      category: category._id,
      brand: brand._id,
      hsnCode: "620520",
      gstRate: 5,
      isActive: true,
    });
    productId = product._id.toString();

    const variant = await ProductVariant.create({
      productId: product._id,
      name: "Payment Shirt Blue M",
      slug: `shirt-blue-m-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sku: `SKU-PAY-${Date.now()}`,
      sellingPrice: 999,
      mrp: 1499,
      stockQuantity: 10,
      reservedQuantity: 0,
      isActive: true,
    });
    variantId = variant._id.toString();
  });

  // Helper to generate a cryptographically genuine Razorpay client signature
  const createClientSignature = (gatewayOrderId: string, paymentId: string) => {
    return crypto
      .createHmac("sha256", keySecret)
      .update(`${gatewayOrderId}|${paymentId}`)
      .digest("hex");
  };

  // Helper to generate a genuine Razorpay webhook payload and signature
  const createWebhookPayload = (
    gatewayOrderId: string,
    paymentId: string,
    amountInPaise: number = 99900,
  ) => {
    const rawBody = JSON.stringify({
      entity: "event",
      account_id: "acc_test_123",
      event: "payment.captured",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: gatewayOrderId,
            amount: amountInPaise,
            currency: "INR",
            status: "captured",
          },
        },
      },
    });

    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    return { rawBody, signature };
  };

  it("Path 1: Client verification transitions order to PAID and commits inventory sale", async () => {
    // 1. User adds 2 items to cart and checks out
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 2 }],
    });

    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    expect(order.status).toBe(ORDER_STATUS.PENDING_PAYMENT);
    expect(order.gatewayOrderId).toBeDefined();

    // Verify initial stock reservation
    let variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(10);
    expect(variant?.reservedQuantity).toBe(2);

    // 2. Client modal submits genuine payment details
    const paymentId = "pay_client_test_1";
    const signature = createClientSignature(order.gatewayOrderId!, paymentId);

    const verifiedOrder = await orderService.verifyPayment({
      orderId: order._id.toString(),
      razorpayOrderId: order.gatewayOrderId!,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      userId,
    });

    // 3. Verify order state
    expect(verifiedOrder.status).toBe(ORDER_STATUS.PAID);
    expect(verifiedOrder.paymentStatus).toBe("COMPLETED");
    expect(verifiedOrder.paymentTransactionId).toBe(paymentId);
    expect(verifiedOrder.paidAt).toBeDefined();

    // 4. Verify inventory deduction: stockQuantity 10 -> 8, reservedQuantity 2 -> 0
    variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(8);
    expect(variant?.reservedQuantity).toBe(0);

    // 5. Verify immutable audit ledger entry
    const ledgerEvent = await InventoryEvent.findOne({
      productVariantId: variant?._id,
      eventType: "SALE",
    });
    expect(ledgerEvent).toBeDefined();
    expect(ledgerEvent?.delta).toBe(-2);
    expect(ledgerEvent?.ResultingStockQuantity).toBe(8);
    expect(ledgerEvent?.ResultingReservedQuantity).toBe(0);
  });

  it("Path 2: Server webhook transitions order to PAID and commits inventory sale", async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 1 }],
    });

    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    const paymentId = "pay_webhook_test_2";
    const { rawBody, signature } = createWebhookPayload(
      order.gatewayOrderId!,
      paymentId,
    );

    const result = await orderService.handleRazorpayWebhook({
      rawBody,
      signature,
    });

    expect(result.handled).toBe(true);
    expect(result.orderId).toBe(order._id.toString());

    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder?.status).toBe(ORDER_STATUS.PAID);
    expect(updatedOrder?.paymentTransactionId).toBe(paymentId);

    const variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(9);
    expect(variant?.reservedQuantity).toBe(0);
  });

  it("Dual-Path Idempotency: Webhook arriving after Client Verify causes zero duplicate deductions", async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 3 }],
    });

    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    const paymentId = "pay_dual_path_1";

    // 1. Client verify arrives first
    const clientSig = createClientSignature(order.gatewayOrderId!, paymentId);
    await orderService.verifyPayment({
      orderId: order._id.toString(),
      razorpayOrderId: order.gatewayOrderId!,
      razorpayPaymentId: paymentId,
      razorpaySignature: clientSig,
      userId,
    });

    let variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(7); // 10 - 3 = 7
    expect(variant?.reservedQuantity).toBe(0);

    // 2. Webhook arrives shortly after for the exact same order
    const { rawBody, signature: webhookSig } = createWebhookPayload(
      order.gatewayOrderId!,
      paymentId,
    );

    const webhookResult = await orderService.handleRazorpayWebhook({
      rawBody,
      signature: webhookSig,
    });

    // Idempotent return
    expect(webhookResult.handled).toBe(true);

    // CRITICAL ASSERTION: Stock must still be 7, NOT 4!
    variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(7);
    expect(variant?.reservedQuantity).toBe(0);

    // Only ONE SALE_COMMITTED audit ledger entry exists
    const ledgerEvents = await InventoryEvent.find({
      productVariantId: variant?._id,
      eventType: "SALE",
    });
    expect(ledgerEvents.length).toBe(1);
  });

  it("Inverted Race: Webhook arriving before Client Verify is handled idempotently", async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 2 }],
    });

    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    const paymentId = "pay_inverted_race_2";

    // 1. Webhook arrives first (user closed browser tab or dropped connection)
    const { rawBody, signature: webhookSig } = createWebhookPayload(
      order.gatewayOrderId!,
      paymentId,
    );
    await orderService.handleRazorpayWebhook({
      rawBody,
      signature: webhookSig,
    });

    let variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(8);
    expect(variant?.reservedQuantity).toBe(0);

    // 2. Client tab reconnects and posts verify
    const clientSig = createClientSignature(order.gatewayOrderId!, paymentId);
    const orderAfterClientVerify = await orderService.verifyPayment({
      orderId: order._id.toString(),
      razorpayOrderId: order.gatewayOrderId!,
      razorpayPaymentId: paymentId,
      razorpaySignature: clientSig,
      userId,
    });

    expect(orderAfterClientVerify.status).toBe(ORDER_STATUS.PAID);

    // Zero duplicate deduction
    variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(8);
    expect(variant?.reservedQuantity).toBe(0);

    const ledgerEvents = await InventoryEvent.find({
      productVariantId: variant?._id,
      eventType: "SALE",
    });
    expect(ledgerEvents.length).toBe(1);
  });

  it("Security: Rejects client verify with tampered/invalid signature without modifying stock", async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 2 }],
    });

    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    const forgedSignature =
      "0000000000000000000000000000000000000000000000000000000000000000";

    await expect(
      orderService.verifyPayment({
        orderId: order._id.toString(),
        razorpayOrderId: order.gatewayOrderId!,
        razorpayPaymentId: "pay_fraud_123",
        razorpaySignature: forgedSignature,
        userId,
      }),
    ).rejects.toThrowError(OrderError);

    // Order remains pending, stock remains safe
    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedOrder?.status).toBe(ORDER_STATUS.PENDING_PAYMENT);

    const variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(10);
    expect(variant?.reservedQuantity).toBe(2);

    const ledgerEvents = await InventoryEvent.find({
      productVariantId: variant?._id,
      eventType: "SALE",
    });
    expect(ledgerEvents.length).toBe(0);
  });

  it("Security: Rejects webhook with forged signature without modifying order", async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(userId),
      items: [{ productVariant: new mongoose.Types.ObjectId(variantId), quantity: 1 }],
    });

    const order = await orderService.createCheckoutOrder({
      userId,
      shippingAddress: validAddress,
    });

    const { rawBody } = createWebhookPayload(order.gatewayOrderId!, "pay_fake_99");
    const fakeSignature = "invalid_webhook_signature_hex_1234567890";

    await expect(
      orderService.handleRazorpayWebhook({
        rawBody,
        signature: fakeSignature,
      }),
    ).rejects.toThrowError(OrderError);

    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedOrder?.status).toBe(ORDER_STATUS.PENDING_PAYMENT);

    const variant = await ProductVariant.findById(variantId);
    expect(variant?.stockQuantity).toBe(10);
    expect(variant?.reservedQuantity).toBe(1);
  });
});
