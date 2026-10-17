import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { RazorpayPaymentService } from "../../src/modules/payment/services/razorpay.service.js";

describe("Unit: Razorpay Gateway Adapter & Signatures", () => {
  const keyId = "rzp_test_sampleKey";
  const keySecret = "sampleSecretKey12345";
  const webhookSecret = "webhookSecretKey54321";

  const paymentService = new RazorpayPaymentService(
    keyId,
    keySecret,
    webhookSecret,
  );

  describe("verifyPaymentSignature", () => {
    it("returns true for a genuine, unmodified Razorpay signature", () => {
      const gatewayOrderId = "order_EKwxwAgIt42yEa";
      const paymentId = "pay_29QQoUBi66xm2f";

      const validSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${gatewayOrderId}|${paymentId}`)
        .digest("hex");

      const isValid = paymentService.verifyPaymentSignature({
        gatewayOrderId,
        paymentId,
        signature: validSignature,
      });

      expect(isValid).toBe(true);
    });

    it("rejects when signature has been tampered with", () => {
      const gatewayOrderId = "order_EKwxwAgIt42yEa";
      const paymentId = "pay_29QQoUBi66xm2f";
      const tamperedSignature =
        "0000000000000000000000000000000000000000000000000000000000000000";

      const isValid = paymentService.verifyPaymentSignature({
        gatewayOrderId,
        paymentId,
        signature: tamperedSignature,
      });

      expect(isValid).toBe(false);
    });

    it("safely rejects signatures with different lengths without throwing (timing attack resilience)", () => {
      const isValid = paymentService.verifyPaymentSignature({
        gatewayOrderId: "order_123",
        paymentId: "pay_123",
        signature: "short_fake_signature",
      });

      expect(isValid).toBe(false);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("returns true for a genuine Razorpay webhook payload and signature", () => {
      const rawBody = JSON.stringify({
        entity: "event",
        account_id: "acc_test",
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_test_123" } } },
      });

      const validWebhookSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const isValid = paymentService.verifyWebhookSignature(
        rawBody,
        validWebhookSignature,
      );

      expect(isValid).toBe(true);
    });

    it("rejects webhook if body was altered in transit (replay/tamper protection)", () => {
      const rawBody = JSON.stringify({ event: "payment.captured", amount: 1000 });
      const tamperedBody = JSON.stringify({ event: "payment.captured", amount: 100 });

      const validSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const isValid = paymentService.verifyWebhookSignature(
        tamperedBody,
        validSignature,
      );

      expect(isValid).toBe(false);
    });
  });
});
