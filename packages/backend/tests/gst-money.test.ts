import { describe, it, expect } from "vitest";
import {
  calculateInclusiveGst,
  determineApparelGstRate,
  roundToTwoDecimals,
} from "../src/shared/utils/gst.utils.js";

describe("Unit Tests: Money & Indian GST Logic (Apparel HSN Chapters 61/62)", () => {
  describe("Apparel GST Rate Determination", () => {
    it("assigns 5% GST for transaction value <= 999 INR", () => {
      expect(determineApparelGstRate(500)).toBe(5);
      expect(determineApparelGstRate(999)).toBe(5);
      expect(determineApparelGstRate(999.0)).toBe(5);
    });

    it("assigns 12% GST for transaction value >= 1000 INR", () => {
      expect(determineApparelGstRate(1000)).toBe(12);
      expect(determineApparelGstRate(1499)).toBe(12);
      expect(determineApparelGstRate(2999.99)).toBe(12);
    });
  });

  describe("Inclusive GST Formula Calculation", () => {
    it("calculates exact inclusive 5% GST for a ₹999 shirt matching standard CA audit formula", () => {
      // Selling price ₹999 at 5% GST
      // gstAmount    = 999 * 5 / 105 = 47.5714... -> ₹47.57
      // taxableAmount = 999 - 47.57  = ₹951.43
      // Check: 951.43 * 1.05 = 999.0015 -> ₹999.00
      const result = calculateInclusiveGst(999, 1);

      expect(result.sellingPrice).toBe(999);
      expect(result.gstRate).toBe(5);
      expect(result.gstAmount).toBe(47.57);
      expect(result.taxableAmount).toBe(951.43);
      expect(result.lineTaxTotal).toBe(47.57);
      expect(result.lineSubtotal).toBe(999);
      expect(roundToTwoDecimals(result.taxableAmount + result.gstAmount)).toBe(999);
    });

    it("calculates exact inclusive 12% GST for a ₹1,200 shirt", () => {
      // Selling price ₹1200 at 12% GST
      // gstAmount    = 1200 * 12 / 112 = 128.5714... -> ₹128.57
      // taxableAmount = 1200 - 128.57  = ₹1071.43
      const result = calculateInclusiveGst(1200, 1);

      expect(result.sellingPrice).toBe(1200);
      expect(result.gstRate).toBe(12);
      expect(result.gstAmount).toBe(128.57);
      expect(result.taxableAmount).toBe(1071.43);
      expect(result.lineTaxTotal).toBe(128.57);
      expect(result.lineSubtotal).toBe(1200);
      expect(roundToTwoDecimals(result.taxableAmount + result.gstAmount)).toBe(1200);
    });

    it("multiplies quantity cleanly without floating-point accumulation drift", () => {
      // 3 shirts at ₹899 each
      const result = calculateInclusiveGst(899, 3);

      expect(result.sellingPrice).toBe(899);
      expect(result.gstRate).toBe(5);
      expect(result.gstAmount).toBe(42.81); // 899 * 5 / 105 = 42.8095 -> 42.81
      expect(result.taxableAmount).toBe(856.19); // 899 - 42.81 = 856.19
      expect(result.lineSubtotal).toBe(2697); // 899 * 3
      expect(result.lineTaxTotal).toBe(128.43); // 42.81 * 3
      expect(result.lineTaxableTotal).toBe(2568.57); // 856.19 * 3
      expect(roundToTwoDecimals(result.lineTaxableTotal + result.lineTaxTotal)).toBe(2697);
    });

    it("rejects negative prices and invalid zero or non-integer quantities", () => {
      expect(() => calculateInclusiveGst(-100, 1)).toThrow("Unit price cannot be negative");
      expect(() => calculateInclusiveGst(500, 0)).toThrow("Quantity must be a positive integer");
      expect(() => calculateInclusiveGst(500, 1.5)).toThrow("Quantity must be a positive integer");
    });
  });
});
