import { ApiError } from "../../../shared/utils/applevel.utils.js";

export const ORDER_ERROR_CODES = {
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  CART_EMPTY: "CART_EMPTY",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  FORBIDDEN: "FORBIDDEN",
  INVALID_ADDRESS: "INVALID_ADDRESS",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  PAYMENT_GATEWAY_ERROR: "PAYMENT_GATEWAY_ERROR",
  PAYMENT_GATEWAY_NOT_CONFIGURED: "PAYMENT_GATEWAY_NOT_CONFIGURED",
  PAYMENT_MISMATCH: "PAYMENT_MISMATCH",
  INVALID_SIGNATURE: "INVALID_SIGNATURE",
  INVALID_PAYLOAD: "INVALID_PAYLOAD",
  INVALID_USER_ID: "INVALID_USER_ID",
} as const;

export type OrderErrorCode =
  (typeof ORDER_ERROR_CODES)[keyof typeof ORDER_ERROR_CODES];

export class OrderError extends ApiError {
  public override name = "OrderError";

  constructor(
    public readonly code: OrderErrorCode,
    message: string,
    statusCode: number = 400,
  ) {
    super(statusCode, message);
  }
}
