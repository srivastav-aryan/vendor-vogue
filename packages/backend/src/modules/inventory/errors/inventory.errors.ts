import { ApiError } from "../../../shared/utils/applevel.utils.js";

export const INVENTORY_ERROR_CODES = {
  VARIANT_NOT_FOUND: "VARIANT_NOT_FOUND",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  RESERVATION_NOT_FOUND: "RESERVATION_NOT_FOUND",
  RESERVATION_EXPIRED: "RESERVATION_EXPIRED",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  CONCURRENT_UPDATE_FAILED: "CONCURRENT_UPDATE_FAILED",
} as const;

export type InventoryErrorCode =
  (typeof INVENTORY_ERROR_CODES)[keyof typeof INVENTORY_ERROR_CODES];

export class InventoryError extends ApiError {
  public override name = "InventoryError";

  constructor(
    public readonly code: InventoryErrorCode,
    message: string,
    statusCode: number = 400,
  ) {
    super(statusCode, message);
  }
}

