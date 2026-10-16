import mongoose from "mongoose";
import {
  CreatePricingRuleInput,
  EvaluateCartItemInput,
  EvaluatedLineItem,
  IPricingService,
  PricingEvaluationResult,
} from "../interfaces/pricing.service.interface.js";
import {
  LeanPricingRule,
  PricingRule,
} from "../models/pricingRule.model.js";
import { PricingError } from "../errors/pricing.errors.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import {
  calculateInclusiveGst,
  roundToTwoDecimals,
} from "../../../shared/utils/gst.utils.js";

export class PricingService implements IPricingService {
  async createPricingRule(
    input: CreatePricingRuleInput,
    ctx?: RequestContext,
  ): Promise<LeanPricingRule> {
    ctx?.logger?.info({ code: input.code }, "Creating pricing rule");

    if (input.discountValue <= 0) {
      throw new PricingError(
        "INVALID_DISCOUNT_VALUE",
        "Discount value must be greater than zero",
        400,
      );
    }

    if (input.discountType === "PERCENTAGE" && input.discountValue > 100) {
      throw new PricingError(
        "INVALID_DISCOUNT_VALUE",
        "Percentage discount cannot exceed 100%",
        400,
      );
    }

    if (input.validTo <= input.validFrom) {
      throw new PricingError(
        "INVALID_DISCOUNT_VALUE",
        "validTo date must be after validFrom date",
        400,
      );
    }

    try {
      const rule = await PricingRule.create({
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description ?? "",
        discountType: input.discountType,
        discountValue: input.discountValue,
        priority: input.priority ?? 0,
        applicableCategories: input.applicableCategories ?? [],
        applicableBrands: input.applicableBrands ?? [],
        applicableVariants: input.applicableVariants ?? [],
        minCartValue: input.minCartValue ?? 0,
        minQuantity: input.minQuantity ?? 1,
        validFrom: input.validFrom,
        validTo: input.validTo,
        isActive: input.isActive ?? true,
      });

      return rule.toObject() as unknown as LeanPricingRule;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new PricingError(
          "RULE_ALREADY_EXISTS",
          `Pricing rule with code ${input.code} already exists`,
          409,
        );
      }
      throw error;
    }
  }

  /**
   * Evaluates promotions and GST for a cart.
   *
   * Flow:
   * 1. Check all active rules matching date & coupon.
   * 2. Sort rules by highest priority.
   * 3. Apply winning rule per item (preventing ambiguous double-discounting).
   * 4. Pass post-discount price to inclusive GST calculator.
   */
  async evaluatePricing(
    items: EvaluateCartItemInput[],
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<PricingEvaluationResult> {
    ctx?.logger?.debug(
      { itemCount: items.length, couponCode },
      "Evaluating pricing and GST for cart items",
    );

    const now = new Date();
    const cartGrossSubtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // Fetch active rules within valid date range
    const filter: Record<string, any> = {
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now },
    };

    if (couponCode) {
      filter.code = couponCode.trim().toUpperCase();
    }

    const availableRules = await PricingRule.find(filter)
      .sort({ priority: -1 })
      .lean();

    if (couponCode && availableRules.length === 0) {
      throw new PricingError(
        "RULE_EXPIRED",
        `Promotion code '${couponCode}' is invalid or expired`,
        400,
      );
    }

    const appliedRuleCodes = new Set<string>();
    const evaluatedItems: EvaluatedLineItem[] = [];

    for (const item of items) {
      let bestDiscountPerUnit = 0;
      let appliedRuleCode: string | undefined = undefined;

      // Find first rule where item matches conditions (highest priority wins)
      for (const rule of availableRules) {
        // Condition: minCartValue
        if (rule.minCartValue && cartGrossSubtotal < rule.minCartValue) {
          continue;
        }

        // Condition: minQuantity
        if (rule.minQuantity && item.quantity < rule.minQuantity) {
          continue;
        }

        // Condition: applicableVariants
        if (
          rule.applicableVariants &&
          rule.applicableVariants.length > 0 &&
          !rule.applicableVariants.some(
            (vId: any) => vId.toString() === item.variantId,
          )
        ) {
          continue;
        }

        // Condition: applicableCategories
        if (
          rule.applicableCategories &&
          rule.applicableCategories.length > 0 &&
          !rule.applicableCategories.some(
            (cId: any) => cId.toString() === item.categoryId,
          )
        ) {
          continue;
        }

        // Condition: applicableBrands
        if (
          rule.applicableBrands &&
          rule.applicableBrands.length > 0 &&
          !rule.applicableBrands.some(
            (bId: any) => bId.toString() === item.brandId,
          )
        ) {
          continue;
        }

        // Calculate discount based on rule type
        let discount = 0;
        switch (rule.discountType) {
          case "PERCENTAGE":
            discount = (item.unitPrice * rule.discountValue) / 100;
            break;
          case "FLAT_AMOUNT":
            discount = Math.min(rule.discountValue, item.unitPrice);
            break;
          case "BOGO":
            // Buy One Get One Free: 50% discount per unit when quantity >= 2
            if (item.quantity >= 2) {
              discount = item.unitPrice * 0.5;
            }
            break;
        }

        if (discount > 0) {
          bestDiscountPerUnit = roundToTwoDecimals(discount);
          appliedRuleCode = rule.code;
          appliedRuleCodes.add(rule.code);
          break; // Highest priority rule applied
        }
      }

      const discountedUnitPrice = roundToTwoDecimals(
        Math.max(0, item.unitPrice - bestDiscountPerUnit),
      );

      // Feature 2: Indian Inclusive GST calculated on the transaction value
      const gst = calculateInclusiveGst(discountedUnitPrice, item.quantity);

      evaluatedItems.push({
        variantId: item.variantId,
        productId: item.productId,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        originalUnitPrice: item.unitPrice,
        discountPerUnit: bestDiscountPerUnit,
        discountedUnitPrice,
        appliedRuleCode,
        gstRate: gst.gstRate,
        gstAmountPerUnit: gst.gstAmount,
        taxableAmountPerUnit: gst.taxableAmount,
        lineTaxTotal: gst.lineTaxTotal,
        lineSubtotal: gst.lineSubtotal,
        lineTaxableTotal: gst.lineTaxableTotal,
      });
    }

    const totalDiscount = roundToTwoDecimals(
      evaluatedItems.reduce(
        (acc, item) => acc + item.discountPerUnit * item.quantity,
        0,
      ),
    );

    const totalTaxableAmount = roundToTwoDecimals(
      evaluatedItems.reduce((acc, item) => acc + item.lineTaxableTotal, 0),
    );

    const totalGst = roundToTwoDecimals(
      evaluatedItems.reduce((acc, item) => acc + item.lineTaxTotal, 0),
    );

    const finalPayableAmount = roundToTwoDecimals(
      evaluatedItems.reduce((acc, item) => acc + item.lineSubtotal, 0),
    );

    return {
      items: evaluatedItems,
      cartSubtotal: roundToTwoDecimals(cartGrossSubtotal),
      totalDiscount,
      totalTaxableAmount,
      totalGst,
      finalPayableAmount,
      appliedRuleCodes: Array.from(appliedRuleCodes),
    };
  }
}
