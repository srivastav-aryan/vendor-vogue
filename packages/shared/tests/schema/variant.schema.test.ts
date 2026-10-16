import { describe, expect, it } from "vitest";
import {
  createProductVariantSchema,
  updateProductVariantSchema,
  variantIdParamSchema,
  variantProductParamsSchema,
} from "../../src/schemas/catalog/variant.schema.js";

describe("Variant Schema Validation Tests", () => {
  const validObjectId = "507f1f77bcf86cd799439011";

  describe("createProductVariantSchema", () => {
    it("should accept valid variant payload with proper prices, attributes, and SKU", () => {
      const input = {
        params: { productId: validObjectId },
        body: {
          name: "Red Cotton Shirt - Size L",
          sku: "SHRT-RED-L",
          sellingPrice: 899,
          mrp: 1299,
          costPrice: 400,
          stockQuantity: 50,
          weightInGrams: 250,
          attributes: [
            { name: "Size", value: "L" },
            { name: "Color", value: "Red", meta: "#FF0000" },
          ],
          images: ["https://example.com/red-shirt.jpg"],
        },
      };

      const result = createProductVariantSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.sku).toBe("SHRT-RED-L");
        expect(result.data.body.sellingPrice).toBe(899);
      }
    });

    it("should automatically normalize SKU to uppercase", () => {
      const input = {
        params: { productId: validObjectId },
        body: {
          name: "Blue Cotton Shirt - Size M",
          sku: "shrt-blue-m",
          sellingPrice: 899,
          mrp: 1299,
          attributes: [{ name: "Size", value: "M" }],
        },
      };

      const result = createProductVariantSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.sku).toBe("SHRT-BLUE-M");
      }
    });

    it("should reject when sellingPrice exceeds mrp", () => {
      const input = {
        params: { productId: validObjectId },
        body: {
          name: "Invalid Pricing Variant",
          sku: "SHRT-INV-01",
          sellingPrice: 1500,
          mrp: 1200,
          attributes: [{ name: "Size", value: "M" }],
        },
      };

      const result = createProductVariantSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const priceError = result.error.issues.find(
          (i) => i.path.join(".") === "body.sellingPrice",
        );
        expect(priceError?.message).toBe("Selling price cannot exceed MRP");
      }
    });

    it("should reject when costPrice exceeds sellingPrice", () => {
      const input = {
        params: { productId: validObjectId },
        body: {
          name: "Negative Margin Variant",
          sku: "SHRT-NEG-01",
          sellingPrice: 800,
          mrp: 1000,
          costPrice: 900,
          attributes: [{ name: "Size", value: "M" }],
        },
      };

      const result = createProductVariantSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const costError = result.error.issues.find(
          (i) => i.path.join(".") === "body.costPrice",
        );
        expect(costError?.message).toContain("negative margin");
      }
    });

    it("should reject duplicate attribute names in a single variant", () => {
      const input = {
        params: { productId: validObjectId },
        body: {
          name: "Duplicate Attributes Variant",
          sku: "SHRT-DUP-01",
          sellingPrice: 899,
          mrp: 1299,
          attributes: [
            { name: "Color", value: "Red" },
            { name: "color", value: "Blue" },
          ],
        },
      };

      const result = createProductVariantSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const attrError = result.error.issues.find(
          (i) => i.path.join(".") === "body.attributes",
        );
        expect(attrError?.message).toContain("Duplicate attribute names are not allowed");
      }
    });
  });

  describe("updateProductVariantSchema", () => {
    it("should reject empty body with no fields to update", () => {
      const input = {
        params: { id: validObjectId },
        body: {},
      };

      const result = updateProductVariantSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject when both sellingPrice and mrp are provided and sellingPrice > mrp", () => {
      const input = {
        params: { id: validObjectId },
        body: {
          sellingPrice: 2000,
          mrp: 1500,
        },
      };

      const result = updateProductVariantSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const priceError = result.error.issues.find(
          (i) => i.path.join(".") === "body.sellingPrice",
        );
        expect(priceError?.message).toBe("Selling price cannot exceed MRP");
      }
    });

    it("should accept valid updates to attributes, prices, and status", () => {
      const input = {
        params: { id: validObjectId },
        body: {
          sellingPrice: 999,
          mrp: 1499,
          isActive: false,
          attributes: [{ name: "Fit", value: "Slim" }],
        },
      };

      const result = updateProductVariantSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("param schemas", () => {
    it("should validate 24-character hexadecimal IDs", () => {
      expect(
        variantIdParamSchema.safeParse({ params: { id: validObjectId } }).success,
      ).toBe(true);
      expect(
        variantIdParamSchema.safeParse({ params: { id: "invalid-id" } }).success,
      ).toBe(false);

      expect(
        variantProductParamsSchema.safeParse({ params: { productId: validObjectId } })
          .success,
      ).toBe(true);
      expect(
        variantProductParamsSchema.safeParse({ params: { productId: "12345" } })
          .success,
      ).toBe(false);
    });
  });
});
