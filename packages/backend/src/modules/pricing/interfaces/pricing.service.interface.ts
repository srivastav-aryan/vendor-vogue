import { RequestContext } from "../../../shared/types/request-context.js";
import { DiscountType, LeanPricingRule } from "../models/pricingRule.model.js";

export interface CreatePricingRuleInput {
  name: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  priority?: number;
  applicableCategories?: string[];
  applicableBrands?: string[];
  applicableVariants?: string[];
  minCartValue?: number;
  minQuantity?: number;
  validFrom: Date;
  validTo: Date;
  isActive?: boolean;
}

export interface EvaluateCartItemInput {
  variantId: string;
  productId: string;
  categoryId: string;
  brandId: string;
  hsnCode: string;
  unitPrice: number;        // MRP or base sellingPrice
  quantity: number;
}

export interface EvaluatedLineItem {
  variantId: string;
  productId: string;
  hsnCode: string;
  quantity: number;
  originalUnitPrice: number;
  discountPerUnit: number;
  discountedUnitPrice: number;
  appliedRuleCode?: string;
  // GST calculation details
  gstRate: 5 | 12;
  gstAmountPerUnit: number;
  taxableAmountPerUnit: number;
  lineTaxTotal: number;
  lineSubtotal: number;
  lineTaxableTotal: number;
}

export interface PricingEvaluationResult {
  items: EvaluatedLineItem[];
  cartSubtotal: number;       // Gross sum before discounts
  totalDiscount: number;      // Total savings
  totalTaxableAmount: number; // Sum of taxable bases
  totalGst: number;           // Total GST to pay
  finalPayableAmount: number; // Gross post-discount total (cartSubtotal - totalDiscount)
  appliedRuleCodes: string[];
}

export interface IPricingService {
  createPricingRule(
    input: CreatePricingRuleInput,
    ctx?: RequestContext,
  ): Promise<LeanPricingRule>;

  evaluatePricing(
    items: EvaluateCartItemInput[],
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<PricingEvaluationResult>;
}
