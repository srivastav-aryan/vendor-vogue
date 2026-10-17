import { describe, expect, it } from "vitest";
import {
  addToCartSchema,
  updateCartItemSchema,
  cartVariantParamSchema,
  createCheckoutOrderSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
} from "../../src/schemas/index.js";

describe("Cart and Order Zod Schemas", () => {
  const validVariantId = "507f1f77bcf86cd799439011";

  describe("Cart Schemas", () => {
    it("validates valid addToCart input", () => {
      const result = addToCartSchema.safeParse({
        body: {
          variantId: validVariantId,
          quantity: 2,
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-positive quantity in addToCart", () => {
      const result = addToCartSchema.safeParse({
        body: {
          variantId: validVariantId,
          quantity: 0,
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid ObjectId format in addToCart", () => {
      const result = addToCartSchema.safeParse({
        body: {
          variantId: "not-an-id",
          quantity: 1,
        },
      });
      expect(result.success).toBe(false);
    });

    it("allows 0 quantity in updateCartItem (to trigger item removal)", () => {
      const result = updateCartItemSchema.safeParse({
        params: {
          variantId: validVariantId,
        },
        body: {
          quantity: 0,
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative quantity in updateCartItem", () => {
      const result = updateCartItemSchema.safeParse({
        params: {
          variantId: validVariantId,
        },
        body: {
          quantity: -1,
        },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Order Schemas", () => {
    const validShippingAddress = {
      name: "Aryan Srivastava",
      phone: "9876543210",
      addressLine1: "Flat 402, Sunshine Heights",
      locality: "Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      country: "India",
    };

    it("validates valid checkout input", () => {
      const result = createCheckoutOrderSchema.safeParse({
        body: {
          shippingAddress: validShippingAddress,
          couponCode: "SUMMER10",
          shippingFee: 50,
        },
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid Indian PIN code", () => {
      const result = createCheckoutOrderSchema.safeParse({
        body: {
          shippingAddress: {
            ...validShippingAddress,
            pincode: "012345", // PIN codes in India cannot start with 0
          },
        },
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid Indian phone number", () => {
      const result = createCheckoutOrderSchema.safeParse({
        body: {
          shippingAddress: {
            ...validShippingAddress,
            phone: "12345",
          },
        },
      });
      expect(result.success).toBe(false);
    });

    it("validates order status transition schema", () => {
      const result = updateOrderStatusSchema.safeParse({
        params: {
          orderId: validVariantId,
        },
        body: {
          status: "PAID",
          reason: "Payment verified",
        },
      });
      expect(result.success).toBe(true);
    });

    it("validates cancel order schema with default reason", () => {
      const result = cancelOrderSchema.safeParse({
        params: {
          orderId: validVariantId,
        },
        body: {},
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.reason).toBe("Customer requested cancellation");
      }
    });
  });
});
