export type OrderStatusDto =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderLineItemDto {
  vendorId: string;
  variantId: string;
  productId: string;
  sku: string;
  productName: string;
  variantName: string;
  image?: string;
  hsnCode: string;
  quantity: number;
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

export interface ShippingAddressDto {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface OrderDto {
  id: string;
  userId: string;
  status: OrderStatusDto;
  items: OrderLineItemDto[];
  shippingAddress: ShippingAddressDto;
  cartSubtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalGst: number;
  shippingFee: number;
  finalPayableAmount: number;
  appliedRuleCodes: string[];
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentProvider?: string;
  paymentTransactionId?: string;
  reservationExpiresAt: string;
  invoiceNumber?: string;
  invoiceGeneratedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}
