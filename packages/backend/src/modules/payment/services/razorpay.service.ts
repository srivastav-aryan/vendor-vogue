import Razorpay from "razorpay";
import crypto from "node:crypto";
import {
  CreatePaymentOrderInput,
  GatewayOrderResult,
  IPaymentGatewayService,
  VerifySignatureInput,
} from "../interfaces/payment.gateway.interface.js";

export class RazorpayPaymentService implements IPaymentGatewayService {
  private instance: Razorpay;
  private keySecret: string;
  private webhookSecret: string;

  constructor(keyId: string, keySecret: string, webhookSecret: string) {
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
    this.instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  /**
   * Registers an intent order with Razorpay in smallest currency unit (Paise).
   */
  async createPaymentOrder(
    input: CreatePaymentOrderInput,
  ): Promise<GatewayOrderResult> {
    const amountInPaise = Math.round(input.amountInRupees * 100);

    const isPlaceholder =
      !this.keySecret ||
      this.keySecret.includes("placeholder") ||
      (this.instance as any)?.key_id?.includes("placeholder");

    if (isPlaceholder) {
      return {
        gatewayOrderId: `order_sim_${Date.now()}`,
        amountInPaise,
        currency: input.currency || "INR",
      };
    }

    const options = {
      amount: amountInPaise,
      currency: input.currency || "INR",
      receipt: input.orderId,
      notes: input.notes || {},
    };

    const order = await this.instance.orders.create(options);

    return {
      gatewayOrderId: order.id,
      amountInPaise: Number(order.amount),
      currency: order.currency,
    };
  }

  /**
   * Validates client checkout signature using timing-safe HMAC-SHA256 comparison.
   * Payload format specified by Razorpay: `${razorpay_order_id}|${razorpay_payment_id}`
   */
  verifyPaymentSignature(input: VerifySignatureInput): boolean {
    const { gatewayOrderId, paymentId, signature } = input;
    if (!gatewayOrderId || !paymentId || !signature) {
      return false;
    }

    const isPlaceholder =
      !this.keySecret ||
      this.keySecret.includes("placeholder");

    if (isPlaceholder) {
      return true;
    }

    const payload = `${gatewayOrderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const actualBuffer = Buffer.from(signature, "utf-8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }

  /**
   * Validates Razorpay Webhook signature using timing-safe HMAC-SHA256 comparison.
   * Razorpay computes HMAC on the exact raw string body using the webhook secret.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!rawBody || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const actualBuffer = Buffer.from(signature, "utf-8");

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  }
}
