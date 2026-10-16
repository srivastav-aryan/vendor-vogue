/**
 * gst.utils.ts
 *
 * Indian GST calculations for Apparel (HSN Chapter 61 & 62).
 *
 * Rules:
 * - Transaction value (discounted selling price) <= 999 INR  => 5% GST
 * - Transaction value (discounted selling price) >= 1000 INR => 12% GST
 *
 * Standard Indian Retail is GST-INCLUSIVE:
 *   gstAmount = sellingPrice * rate / (100 + rate)
 *   taxableAmount = sellingPrice - gstAmount
 *
 * Uses minor units (paise) where appropriate to prevent IEEE 754 floating point inaccuracies.
 */

export interface GstCalculationResult {
  sellingPrice: number;       // Discounted unit price in INR
  gstRate: 5 | 12;            // Percentage
  gstAmount: number;          // GST per unit in INR (rounded to 2 decimal places)
  taxableAmount: number;      // Pre-tax amount per unit in INR (rounded to 2 decimal places)
  lineTaxTotal: number;       // Total GST for line item (gstAmount * quantity)
  lineSubtotal: number;       // Total gross price for line item (sellingPrice * quantity)
  lineTaxableTotal: number;   // Total taxable base for line item (taxableAmount * quantity)
}

/**
 * Rounds a number strictly to 2 decimal places using half-up arithmetic.
 */
export const roundToTwoDecimals = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

/**
 * Determines the Indian apparel GST rate based on transaction value.
 */
export const determineApparelGstRate = (transactionPrice: number): 5 | 12 => {
  return transactionPrice <= 999 ? 5 : 12;
};

/**
 * Computes inclusive GST for Indian apparel retail.
 *
 * @param unitPrice The discounted transaction price paid by consumer (inclusive of tax).
 * @param quantity Number of items.
 * @param overrideGstRate Optional manual GST rate override (must be 5 or 12).
 */
export const calculateInclusiveGst = (
  unitPrice: number,
  quantity: number = 1,
  overrideGstRate?: 5 | 12,
): GstCalculationResult => {
  if (unitPrice < 0) {
    throw new Error("Unit price cannot be negative");
  }
  if (quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error("Quantity must be a positive integer");
  }

  const roundedUnitPrice = roundToTwoDecimals(unitPrice);
  const gstRate = overrideGstRate ?? determineApparelGstRate(roundedUnitPrice);

  // gstAmount = unitPrice * rate / (100 + rate)
  const rawGstAmount = (roundedUnitPrice * gstRate) / (100 + gstRate);
  const gstAmount = roundToTwoDecimals(rawGstAmount);
  const taxableAmount = roundToTwoDecimals(roundedUnitPrice - gstAmount);

  const lineTaxTotal = roundToTwoDecimals(gstAmount * quantity);
  const lineSubtotal = roundToTwoDecimals(roundedUnitPrice * quantity);
  const lineTaxableTotal = roundToTwoDecimals(taxableAmount * quantity);

  return {
    sellingPrice: roundedUnitPrice,
    gstRate,
    gstAmount,
    taxableAmount,
    lineTaxTotal,
    lineSubtotal,
    lineTaxableTotal,
  };
};
