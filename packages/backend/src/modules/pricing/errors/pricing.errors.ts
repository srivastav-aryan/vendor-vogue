import { ApiError } from "../../../shared/utils/applevel.utils.js";

export const PRICING_ERROR_CODES = {
  RULE_NOT_FOUND: "RULE_NOT_FOUND",
  RULE_ALREADY_EXISTS: "RULE_ALREADY_EXISTS",
  RULE_EXPIRED: "RULE_EXPIRED",
  RULE_NOT_ACTIVE: "RULE_NOT_ACTIVE",
  INVALID_DISCOUNT_VALUE: "INVALID_DISCOUNT_VALUE",
  CONDITIONS_NOT_MET: "CONDITIONS_NOT_MET",
} as const;

export type PricingErrorCode =
  (typeof PRICING_ERROR_CODES)[keyof typeof PRICING_ERROR_CODES];

export class PricingError extends ApiError {
  public override name = "PricingError";

  constructor(
    public readonly code: PricingErrorCode,
    message: string,
    statusCode: number = 400,
  ) {
    super(statusCode, message);
  }
}
