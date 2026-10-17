import { z } from "zod";
import { COUPON_CODE_REGEX, MAX_CART_ITEM_QUANTITY } from "../../constants/index.js";
import { objectIdAtom } from "../catalog/catalog.atoms.js";

// ---------------------------------------------------------------------------
// GET CART (Query validation)
// ---------------------------------------------------------------------------
export const getCartQuerySchema = z.object({
  query: z.object({
    coupon: z
      .string()
      .trim()
      .regex(COUPON_CODE_REGEX, "Invalid coupon code format")
      .optional(),
  }),
});

// ---------------------------------------------------------------------------
// ADD ITEM TO CART
// ---------------------------------------------------------------------------
export const addToCartSchema = z.object({
  body: z.object({
    variantId: objectIdAtom,
    quantity: z
      .number({ error: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .min(1, "Quantity must be at least 1")
      .max(
        MAX_CART_ITEM_QUANTITY,
        `Cannot add more than ${MAX_CART_ITEM_QUANTITY} units per line`,
      ),
  }),
  query: z
    .object({
      coupon: z
        .string()
        .trim()
        .regex(COUPON_CODE_REGEX, "Invalid coupon code format")
        .optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// UPDATE ITEM QUANTITY (0 = remove)
// ---------------------------------------------------------------------------
export const updateCartItemSchema = z.object({
  params: z.object({
    variantId: objectIdAtom,
  }),
  body: z.object({
    quantity: z
      .number({ error: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .min(0, "Quantity cannot be negative")
      .max(
        MAX_CART_ITEM_QUANTITY,
        `Cannot set more than ${MAX_CART_ITEM_QUANTITY} units per line`,
      ),
  }),
  query: z
    .object({
      coupon: z
        .string()
        .trim()
        .regex(COUPON_CODE_REGEX, "Invalid coupon code format")
        .optional(),
    })
    .optional(),
});

// ---------------------------------------------------------------------------
// REMOVE ITEM PARAM SCHEMA
// ---------------------------------------------------------------------------
export const cartVariantParamSchema = z.object({
  params: z.object({
    variantId: objectIdAtom,
  }),
  query: z
    .object({
      coupon: z
        .string()
        .trim()
        .regex(COUPON_CODE_REGEX, "Invalid coupon code format")
        .optional(),
    })
    .optional(),
});

export type AddToCartInputDto = z.infer<typeof addToCartSchema>["body"];
export type UpdateCartItemInputDto = z.infer<typeof updateCartItemSchema>["body"];
export type CartVariantParam = z.infer<typeof cartVariantParamSchema>["params"];
