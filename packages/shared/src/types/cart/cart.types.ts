export interface CartItemSummaryDto {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  image?: string;
  attributes: Array<{ name: string; value: string; meta?: string | null }>;
  quantity: number;
  availableStock: number;
  originalUnitPrice: number;
  discountPerUnit: number;
  discountedUnitPrice: number;
  appliedRuleCode?: string;
  gstRate: 5 | 12;
  gstAmountPerUnit: number;
  taxableAmountPerUnit: number;
  lineTaxTotal: number;
  lineSubtotal: number;
  lineTaxableTotal: number;
}

export interface CartSummaryDto {
  cartId: string;
  userId: string;
  items: CartItemSummaryDto[];
  itemCount: number;
  cartSubtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalGst: number;
  finalPayableAmount: number;
  appliedRuleCodes: string[];
}
