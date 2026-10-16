import { describe, expect, it } from "vitest";
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
} from "../../src/schemas/catalog/product.schema.js";

describe("Product Schema Validation Tests", () => {
  const validObjectId = "507f1f77bcf86cd799439011";

  describe("createProductSchema", () => {
    it("should accept valid product payload with valid HSN code and deduplicate tags", () => {
      const input = {
        body: {
          name: "Classic Oxford Cotton Shirt",
          description:
            "A premium breathable 100% cotton casual shirt designed for all seasons.",
          category: validObjectId,
          brand: validObjectId,
          hsnCode: "620520", // Chapter 62
          gstRate: 5,
          tags: ["Cotton", "COTTON", "formal", "slim-fit"],
          images: ["https://example.com/shirt.jpg"],
        },
      };

      const result = createProductSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.tags).toEqual(["cotton", "formal", "slim-fit"]);
        expect(result.data.body.gstRate).toBe(5);
        expect(result.data.body.hsnCode).toBe("620520");
      }
    });

    it("should reject invalid HSN code not belonging to Chapter 61, 62, or 63", () => {
      const input = {
        body: {
          name: "Classic Oxford Cotton Shirt",
          description:
            "A premium breathable 100% cotton casual shirt designed for all seasons.",
          category: validObjectId,
          brand: validObjectId,
          hsnCode: "851712", // Electronics HSN, not apparel!
          gstRate: 5,
        },
      };

      const result = createProductSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hsnError = result.error.issues.find(
          (issue) => issue.path.join(".") === "body.hsnCode",
        );
        expect(hsnError?.message).toContain("Invalid HSN code");
      }
    });

    it("should reject description shorter than 20 characters (anti-stub rule)", () => {
      const input = {
        body: {
          name: "Classic Oxford Cotton Shirt",
          description: "Too short.",
          category: validObjectId,
          brand: validObjectId,
          hsnCode: "620520",
          gstRate: 5,
        },
      };

      const result = createProductSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const descError = result.error.issues.find(
          (issue) => issue.path.join(".") === "body.description",
        );
        expect(descError?.message).toContain("at least 20 characters");
      }
    });

    it("should reject invalid GST rate", () => {
      const input = {
        body: {
          name: "Classic Oxford Cotton Shirt",
          description:
            "A premium breathable 100% cotton casual shirt designed for all seasons.",
          category: validObjectId,
          brand: validObjectId,
          hsnCode: "620520",
          gstRate: 18, // Apparel is only 5 or 12
        },
      };

      const result = createProductSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("updateProductSchema", () => {
    it("should require at least one field to update", () => {
      const input = {
        params: { id: validObjectId },
        body: {},
      };

      const result = updateProductSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain(
          "At least one field must be provided to update",
        );
      }
    });

    it("should permit partial updates with valid fields", () => {
      const input = {
        params: { id: validObjectId },
        body: {
          name: "Updated Oxford Shirt",
          isActive: false,
        },
      };

      const result = updateProductSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.body.name).toBe("Updated Oxford Shirt");
        expect(result.data.body.isActive).toBe(false);
      }
    });
  });

  describe("productListQuerySchema", () => {
    it("should transform string numbers and boolean strings in query params", () => {
      const input = {
        query: {
          page: "2",
          limit: "25",
          isActive: "false",
          tags: "cotton, formal",
        },
      };

      const result = productListQuerySchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query.page).toBe(2);
        expect(result.data.query.limit).toBe(25);
        expect(result.data.query.isActive).toBe(false);
        expect(result.data.query.tags).toEqual(["cotton", "formal"]);
      }
    });
  });
});
