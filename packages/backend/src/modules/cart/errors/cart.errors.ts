import { ApiError } from "../../../shared/utils/applevel.utils.js";

export const CART_ERROR_CODES = {
  CART_NOT_FOUND: "CART_NOT_FOUND",
  VARIANT_NOT_FOUND: "VARIANT_NOT_FOUND",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  ITEM_NOT_IN_CART: "ITEM_NOT_IN_CART",
  CART_EMPTY: "CART_EMPTY",
} as const;

export type CartErrorCode =
  (typeof CART_ERROR_CODES)[keyof typeof CART_ERROR_CODES];

export class CartError extends ApiError {
  public override name = "CartError";

  constructor(
    public readonly code: CartErrorCode,
    message: string,
    statusCode: number = 400,
  ) {
    super(statusCode, message);
  }
}
