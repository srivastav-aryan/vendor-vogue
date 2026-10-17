import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { PricingService } from "../../src/modules/pricing/services/pricing.service.js";
import { PricingError } from "../../src/modules/pricing/errors/pricing.errors.js";

describe("Integration: Pricing Rule Engine & GST Interaction", () => {
  const pricingService = new PricingService();

  let testCategoryId: string;
  let testBrandId: string;
  let testVariantIdA: string;

  beforeEach(() => {
    testCategoryId = new mongoose.Types.ObjectId().toString();
    testBrandId = new mongoose.Types.ObjectId().toString();
    testVariantIdA = new mongoose.Types.ObjectId().toString();
  });

  describe("Rule Evaluation & Priority System", () => {
    it("applies the highest priority rule when multiple rules match the same cart item", async () => {
      const now = new Date();
      const validFrom = new Date(now.getTime() - 1000 * 60 * 60);
      const validTo = new Date(now.getTime() + 1000 * 60 * 60 * 24);

      // Rule 1: 10% off with priority 1
      await pricingService.createPricingRule({
        name: "10% Welcome Discount",
        code: "WELCOME10",
        discountType: "PERCENTAGE",
        discountValue: 10,
        priority: 1,
        validFrom,
        validTo,
      });

      // Rule 2: Flat ₹200 off with priority 5 (higher priority)
      await pricingService.createPricingRule({
        name: "Flat ₹200 Promo",
        code: "SUPER200",
        discountType: "FLAT_AMOUNT",
        discountValue: 200,
        priority: 5,
        validFrom,
        validTo,
      });

      const evaluation = await pricingService.evaluatePricing([
        {
          variantId: testVariantIdA,
          productId: new mongoose.Types.ObjectId().toString(),
          categoryId: testCategoryId,
          brandId: testBrandId,
          hsnCode: "620520",
          unitPrice: 1200,
          quantity: 1,
        },
      ]);

      expect(evaluation.cartSubtotal).toBe(1200);
      expect(evaluation.totalDiscount).toBe(200);
      expect(evaluation.finalPayableAmount).toBe(1000);
      expect(evaluation.appliedRuleCodes).toContain("SUPER200");
      expect(evaluation.items[0].appliedRuleCode).toBe("SUPER200");
      expect(evaluation.items[0].discountedUnitPrice).toBe(1000);
      expect(evaluation.items[0].gstRate).toBe(12);
    });

    it("evaluates BOGO applying 50% discount per unit when quantity >= 2", async () => {
      const now = new Date();
      await pricingService.createPricingRule({
        name: "BOGO Special",
        code: "BOGO-SHIRTS",
        discountType: "BOGO",
        discountValue: 50,
        priority: 10,
        minQuantity: 2,
        validFrom: new Date(now.getTime() - 60000),
        validTo: new Date(now.getTime() + 86400000),
      });

      const evaluation = await pricingService.evaluatePricing([
        {
          variantId: testVariantIdA,
          productId: new mongoose.Types.ObjectId().toString(),
          categoryId: testCategoryId,
          brandId: testBrandId,
          hsnCode: "620520",
          unitPrice: 800,
          quantity: 2,
        },
      ]);

      expect(evaluation.cartSubtotal).toBe(1600);
      expect(evaluation.totalDiscount).toBe(800);
      expect(evaluation.finalPayableAmount).toBe(800);
      expect(evaluation.items[0].discountedUnitPrice).toBe(400);
      expect(evaluation.items[0].gstRate).toBe(5);
    });

    it("respects condition guards: ignores rule if minimum cart value is not met", async () => {
      const now = new Date();
      await pricingService.createPricingRule({
        name: "₹500 off on ₹2,500+",
        code: "BIGCART500",
        discountType: "FLAT_AMOUNT",
        discountValue: 500,
        minCartValue: 2500,
        validFrom: new Date(now.getTime() - 60000),
        validTo: new Date(now.getTime() + 86400000),
      });

      const evaluation = await pricingService.evaluatePricing([
        {
          variantId: testVariantIdA,
          productId: new mongoose.Types.ObjectId().toString(),
          categoryId: testCategoryId,
          brandId: testBrandId,
          hsnCode: "620520",
          unitPrice: 1200,
          quantity: 1,
        },
      ]);

      expect(evaluation.totalDiscount).toBe(0);
      expect(evaluation.finalPayableAmount).toBe(1200);
      expect(evaluation.appliedRuleCodes).toHaveLength(0);
    });

    it("rejects expired or non-existent coupon codes with a 400 error", async () => {
      const now = new Date();
      await pricingService.createPricingRule({
        name: "Expired Rule",
        code: "EXPIRED50",
        discountType: "PERCENTAGE",
        discountValue: 50,
        validFrom: new Date(now.getTime() - 100000),
        validTo: new Date(now.getTime() - 50000),
      });

      await expect(
        pricingService.evaluatePricing(
          [
            {
              variantId: testVariantIdA,
              productId: new mongoose.Types.ObjectId().toString(),
              categoryId: testCategoryId,
              brandId: testBrandId,
              hsnCode: "620520",
              unitPrice: 1000,
              quantity: 1,
            },
          ],
          "EXPIRED50",
        ),
      ).rejects.toThrow(PricingError);
    });
  });

  describe("GST Threshold Shift on Discounted Transaction Value", () => {
    it("shifts GST bracket from 12% down to 5% when discount brings selling price from ₹1,200 to ₹899", async () => {
      const now = new Date();
      await pricingService.createPricingRule({
        name: "Festive ₹301 Off",
        code: "DIWALI301",
        discountType: "FLAT_AMOUNT",
        discountValue: 301,
        validFrom: new Date(now.getTime() - 60000),
        validTo: new Date(now.getTime() + 86400000),
      });

      const evaluation = await pricingService.evaluatePricing([
        {
          variantId: testVariantIdA,
          productId: new mongoose.Types.ObjectId().toString(),
          categoryId: testCategoryId,
          brandId: testBrandId,
          hsnCode: "620520",
          unitPrice: 1200,
          quantity: 1,
        },
      ]);

      // Post discount: 1200 - 301 = ₹899 => 5% GST
      expect(evaluation.items[0].discountedUnitPrice).toBe(899);
      expect(evaluation.items[0].gstRate).toBe(5);
      expect(evaluation.items[0].gstAmountPerUnit).toBe(42.81);
      expect(evaluation.items[0].taxableAmountPerUnit).toBe(856.19);
    });
  });
});
