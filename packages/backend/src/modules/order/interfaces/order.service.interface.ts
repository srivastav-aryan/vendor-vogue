import { RequestContext } from "../../../shared/types/request-context.js";
import {
  IOrder,
  IShippingAddressSnapshot,
  OrderStatus,
} from "../models/order.model.js";

export interface CreateCheckoutOrderInput {
  userId: string;
  shippingAddress: IShippingAddressSnapshot;
  couponCode?: string;
  shippingFee?: number;
  paymentMethod?: "COD" | "RAZORPAY";
  items?: Array<{ variantId: string; quantity: number }>;
}

export interface MarkOrderPaidInput {
  orderId: string;
  paymentProvider: string;
  paymentTransactionId: string;
}

export interface CancelOrderInput {
  orderId: string;
  reason: string;
  userId?: string; // If provided, ensures requesting user is the order owner
}

export interface TransitionOrderStatusInput {
  orderId: string;
  targetStatus: OrderStatus;
  reason?: string;
}

export interface VerifyOrderPaymentInput {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  userId?: string;
}

export interface HandleRazorpayWebhookInput {
  rawBody: string;
  signature: string;
}

export interface GetUserOrdersInput {
  userId?: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedOrdersResult {
  items: IOrder[];
  pagination: import("../../../shared/utils/pagination.utils.js").PaginationMeta;
}

export interface IOrderService {
  createCheckoutOrder(
    input: CreateCheckoutOrderInput,
    ctx?: RequestContext,
  ): Promise<IOrder>;

  getOrderById(
    orderId: string,
    userId?: string,
    ctx?: RequestContext,
  ): Promise<IOrder>;

  getUserOrders(
    input: GetUserOrdersInput | string,
    ctx?: RequestContext,
  ): Promise<PaginatedOrdersResult>;

  transitionOrderStatus(
    input: TransitionOrderStatusInput,
    ctx?: RequestContext,
  ): Promise<IOrder>;

  markOrderAsPaid(
    input: MarkOrderPaidInput,
    ctx?: RequestContext,
  ): Promise<IOrder>;

  cancelOrder(
    input: CancelOrderInput,
    ctx?: RequestContext,
  ): Promise<IOrder>;

  verifyPayment(
    input: VerifyOrderPaymentInput,
    ctx?: RequestContext,
  ): Promise<IOrder>;

  handleRazorpayWebhook(
    input: HandleRazorpayWebhookInput,
    ctx?: RequestContext,
  ): Promise<{ handled: boolean; orderId?: string }>;
}
