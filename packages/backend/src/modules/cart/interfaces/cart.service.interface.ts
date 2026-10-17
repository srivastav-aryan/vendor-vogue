import { RequestContext } from "../../../shared/types/request-context.js";

export interface CartItemSummary {
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

export interface CartSummary {
  cartId: string;
  userId: string;
  items: CartItemSummary[];
  itemCount: number;
  cartSubtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalGst: number;
  finalPayableAmount: number;
  appliedRuleCodes: string[];
}

export interface AddToCartInput {
  userId: string;
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  userId: string;
  variantId: string;
  quantity: number;
}

export interface ICartService {
  getCartSummary(
    userId: string,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary>;

  addItem(
    input: AddToCartInput,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary>;

  updateItemQuantity(
    input: UpdateCartItemInput,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary>;

  removeItem(
    userId: string,
    variantId: string,
    couponCode?: string,
    ctx?: RequestContext,
  ): Promise<CartSummary>;

  clearCart(userId: string, ctx?: RequestContext): Promise<void>;
}
