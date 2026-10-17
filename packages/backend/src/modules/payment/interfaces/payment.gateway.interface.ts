export interface CreatePaymentOrderInput {
  orderId: string;
  amountInRupees: number;
  currency?: string;
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
  amountInPaise: number;
  currency: string;
}

export interface VerifySignatureInput {
  gatewayOrderId: string;
  paymentId: string;
  signature: string;
}

export interface IPaymentGatewayService {
  /**
   * Registers a payment intent order with the payment gateway.
   */
  createPaymentOrder(
    input: CreatePaymentOrderInput,
  ): Promise<GatewayOrderResult>;

  /**
   * Cryptographically verifies the HMAC-SHA256 signature returned from client checkout.
   */
  verifyPaymentSignature(input: VerifySignatureInput): boolean;

  /**
   * Cryptographically verifies the HMAC-SHA256 signature on an incoming Webhook event.
   */
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}
