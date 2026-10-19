import mongoose, { Document, Schema } from "mongoose";

export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const VALID_ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED],
  PAID: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  PROCESSING: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  SHIPPED: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  DELIVERED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

export function isValidOrderStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return VALID_ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface IOrderLineItem {
  vendorId: string;
  variantId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
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

export interface IShippingAddressSnapshot {
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

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  status: OrderStatus;
  items: IOrderLineItem[];
  shippingAddress: IShippingAddressSnapshot;
  cartSubtotal: number;
  totalDiscount: number;
  totalTaxableAmount: number;
  totalGst: number;
  shippingFee: number;
  finalPayableAmount: number;
  appliedRuleCodes: string[];
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  paymentProvider?: string;
  gatewayOrderId?: string;
  paymentTransactionId?: string;
  reservationExpiresAt: Date;
  paidAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderLineItemSchema = new Schema<IOrderLineItem>(
  {
    vendorId: {
      type: String,
      required: true,
      default: "DEFAULT_VENDOR",
      trim: true,
    },
    variantId: {
      type: Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    variantName: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    hsnCode: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    originalUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPerUnit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    discountedUnitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    appliedRuleCode: {
      type: String,
      trim: true,
    },
    gstRate: {
      type: Number,
      required: true,
      enum: [5, 12],
    },
    gstAmountPerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    taxableAmountPerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTaxTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    lineSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    lineTaxableTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const ShippingAddressSnapshotSchema = new Schema<IShippingAddressSnapshot>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: "" },
    locality: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: "India" },
  },
  { _id: false },
);

export const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING_PAYMENT,
      required: true,
      index: true,
    },
    items: {
      type: [OrderLineItemSchema],
      required: true,
      validate: [
        (val: IOrderLineItem[]) => val.length > 0,
        "Order must contain at least one line item",
      ],
    },
    shippingAddress: {
      type: ShippingAddressSnapshotSchema,
      required: true,
    },
    cartSubtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDiscount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalTaxableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalGst: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    finalPayableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    appliedRuleCodes: {
      type: [String],
      default: [],
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      default: "PENDING",
      required: true,
    },
    paymentProvider: {
      type: String,
      trim: true,
    },
    gatewayOrderId: {
      type: String,
      trim: true,
    },
    paymentTransactionId: {
      type: String,
      trim: true,
    },
    reservationExpiresAt: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ createdAt: 1 });
OrderSchema.index({ "items.vendorId": 1, status: 1 });
OrderSchema.index({ gatewayOrderId: 1 }, { sparse: true });
OrderSchema.index({ status: 1, reservationExpiresAt: 1 });

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
