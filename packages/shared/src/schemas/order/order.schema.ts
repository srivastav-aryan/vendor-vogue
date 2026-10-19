import { z } from "zod";
import {
  COUPON_CODE_REGEX,
  DEFAULT_PAGE_SIZE,
  INDIAN_PHONE_REGEX,
  INDIAN_PINCODE_REGEX,
  MAX_PAGE_SIZE,
} from "../../constants/index.js";
import { objectIdAtom } from "../catalog/catalog.atoms.js";

// ---------------------------------------------------------------------------
// SHIPPING ADDRESS SCHEMA
// ---------------------------------------------------------------------------
export const shippingAddressSchema = z.object({
  name: z
    .string({ error: "Recipient name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  phone: z
    .string({ error: "Phone number is required" })
    .trim()
    .regex(
      INDIAN_PHONE_REGEX,
      "Phone must be a valid 10-digit Indian phone number (optionally with +91)",
    ),

  addressLine1: z
    .string({ error: "Address line 1 is required" })
    .trim()
    .min(3, "Address line 1 must be at least 3 characters")
    .max(200, "Address line 1 cannot exceed 200 characters"),

  addressLine2: z
    .string()
    .trim()
    .max(200, "Address line 2 cannot exceed 200 characters")
    .optional()
    .default(""),

  locality: z
    .string({ error: "Locality / Landmark is required" })
    .trim()
    .min(2, "Locality must be at least 2 characters")
    .max(100, "Locality cannot exceed 100 characters"),

  city: z
    .string({ error: "City is required" })
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City cannot exceed 100 characters"),

  state: z
    .string({ error: "State is required" })
    .trim()
    .min(2, "State must be at least 2 characters")
    .max(100, "State cannot exceed 100 characters"),

  pincode: z
    .string({ error: "PIN code is required" })
    .trim()
    .regex(
      INDIAN_PINCODE_REGEX,
      "PIN code must be exactly 6 digits and cannot start with 0",
    ),

  country: z
    .string()
    .trim()
    .max(50, "Country cannot exceed 50 characters")
    .default("India"),
});

// ---------------------------------------------------------------------------
// CHECKOUT INTENT ORDER SCHEMA
// ---------------------------------------------------------------------------
export const createCheckoutOrderSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,
    couponCode: z
      .string()
      .trim()
      .regex(COUPON_CODE_REGEX, "Invalid coupon code format")
      .optional(),
    shippingFee: z
      .number()
      .min(0, "Shipping fee cannot be negative")
      .max(10000, "Shipping fee exceeds maximum permitted amount")
      .optional()
      .default(0),
  }),
});

// ---------------------------------------------------------------------------
// ORDER PARAM SCHEMAS
// ---------------------------------------------------------------------------
export const orderIdParamSchema = z.object({
  params: z.object({
    orderId: objectIdAtom,
  }),
});

// ---------------------------------------------------------------------------
// ORDER STATUS TRANSITION SCHEMA
// ---------------------------------------------------------------------------
export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: objectIdAtom,
  }),
  body: z.object({
    status: z.enum([
      "PENDING_PAYMENT",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ]),
    reason: z
      .string()
      .trim()
      .max(500, "Reason cannot exceed 500 characters")
      .optional(),
  }),
});

// ---------------------------------------------------------------------------
// CANCEL ORDER SCHEMA
// ---------------------------------------------------------------------------
export const cancelOrderSchema = z.object({
  params: z.object({
    orderId: objectIdAtom,
  }),
  body: z
    .object({
      reason: z
        .string()
        .trim()
        .min(3, "Cancellation reason must be at least 3 characters")
        .max(500, "Cancellation reason cannot exceed 500 characters")
        .optional()
        .default("Customer requested cancellation"),
    })
    .default({ reason: "Customer requested cancellation" }),
});

// ---------------------------------------------------------------------------
// ORDER LIST QUERY SCHEMA
// ---------------------------------------------------------------------------
export const orderListQuerySchema = z.object({
  query: z
    .object({
      page: z
        .union([z.string(), z.number()])
        .optional()
        .transform((val) => {
          if (val === undefined || val === null) return 1;
          const parsed = typeof val === "number" ? val : parseInt(val, 10);
          return isNaN(parsed) || parsed < 1 ? 1 : parsed;
        }),
      limit: z
        .union([z.string(), z.number()])
        .optional()
        .transform((val) => {
          if (val === undefined || val === null) return DEFAULT_PAGE_SIZE;
          const parsed = typeof val === "number" ? val : parseInt(val, 10);
          if (isNaN(parsed) || parsed < 1) return DEFAULT_PAGE_SIZE;
          return Math.min(parsed, MAX_PAGE_SIZE);
        }),
      status: z
        .enum([
          "PENDING_PAYMENT",
          "PAID",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ])
        .optional(),
      userId: z.string().trim().optional(),
    })
    .optional(),
});

export type CreateCheckoutOrderInputDto = z.infer<
  typeof createCheckoutOrderSchema
>["body"];
export type ShippingAddressDto = z.infer<typeof shippingAddressSchema>;
export type UpdateOrderStatusInputDto = z.infer<
  typeof updateOrderStatusSchema
>["body"];
export type CancelOrderInputDto = z.infer<typeof cancelOrderSchema>["body"];
export type OrderIdParamDto = z.infer<typeof orderIdParamSchema>["params"];

// ---------------------------------------------------------------------------
// VERIFY PAYMENT SCHEMA (Razorpay)
// ---------------------------------------------------------------------------
export const verifyPaymentSchema = z.object({
  body: z.object({
    orderId: objectIdAtom,
    razorpayOrderId: z
      .string({ error: "Razorpay order ID is required" })
      .trim()
      .min(1, "Razorpay order ID cannot be empty"),
    razorpayPaymentId: z
      .string({ error: "Razorpay payment ID is required" })
      .trim()
      .min(1, "Razorpay payment ID cannot be empty"),
    razorpaySignature: z
      .string({ error: "Razorpay signature is required" })
      .trim()
      .min(1, "Razorpay signature cannot be empty"),
  }),
});

export type VerifyPaymentInputDto = z.infer<typeof verifyPaymentSchema>["body"];
