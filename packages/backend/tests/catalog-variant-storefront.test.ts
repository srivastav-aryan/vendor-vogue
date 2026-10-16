import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { VariantService } from "../src/modules/catalog/services/variant.service.js";
import { ProductService } from "../src/modules/catalog/services/product.service.js";
import { Brand } from "../src/modules/catalog/models/brand.model.js";
import { Category } from "../src/modules/catalog/models/category.model.js";
import { Product } from "../src/modules/catalog/models/product.model.js";
import { ProductVariant } from "../src/modules/catalog/models/productVariant.model.js";
import { CatalogError } from "../src/modules/catalog/errors/catalog.errors.js";

describe("Catalog Module - ProductVariant & Storefront Integration Tests", () => {
  const variantService = new VariantService();
  const productService = new ProductService();

  let testBrandId: string;
  let testCategoryId: string;
  let testProductId: string;

  beforeEach(async () => {
    // 1. Seed brand
    const brand = await Brand.create({
      name: "Acme Apparel",
      slug: "acme-apparel",
      description: "Premium apparel brand for sustainable fashion",
      isActive: true,
    });
    testBrandId = brand.id;

    // 2. Seed category
    const category = await Category.create({
      name: "Shirts",
      slug: "shirts",
      description: "Men and Women Shirts collection",
      isActive: true,
    });
    testCategoryId = category.id;

    // 3. Seed product
    const product = await Product.create({
      name: "Classic Linen Shirt",
      slug: "classic-linen-shirt",
      description: "Breathable pure linen shirt for hot Indian summer days.",
      category: testCategoryId,
      brand: testBrandId,
      hsnCode: "620520",
      gstRate: 5,
      isActive: true,
      tags: ["linen", "summer", "breathable"],
    });
    testProductId = product.id;
  });

  describe("ProductVariant Creation", () => {
    it("creates a variant with valid pricing, attributes, and calculates availableStock", async () => {
      const variant = await variantService.createVariant(testProductId, {
        name: "Classic Linen Shirt - Blue M",
        sku: "LN-BLU-M",
        sellingPrice: 899,
        mrp: 1499,
        costPrice: 450,
        stockQuantity: 20,
        weightInGrams: 200,
        attributes: [
          { name: "Size", value: "M" },
          { name: "Color", value: "Blue", meta: "#0000FF" },
        ],
        images: ["https://example.com/linen-blue.jpg"],
      });

      expect(variant).toBeDefined();
      expect(variant.sku).toBe("LN-BLU-M");
      expect(variant.sellingPrice).toBe(899);
      expect(variant.mrp).toBe(1499);
      expect(variant.availableStock).toBe(20);
      expect(variant.isActive).toBe(true);
    });

    it("rejects variant creation if parent product does not exist", async () => {
      const fakeProductId = new mongoose.Types.ObjectId().toString();

      await expect(
        variantService.createVariant(fakeProductId, {
          name: "Ghost Variant",
          sku: "GHOST-01",
          sellingPrice: 500,
          mrp: 1000,
          stockQuantity: 10,
          weightInGrams: 100,
          attributes: [{ name: "Size", value: "S" }],
          images: [],
        }),
      ).rejects.toThrow(CatalogError);
    });

    it("rejects variant creation when sellingPrice exceeds mrp", async () => {
      await expect(
        variantService.createVariant(testProductId, {
          name: "Overpriced Variant",
          sku: "OVP-01",
          sellingPrice: 1500,
          mrp: 1200,
          stockQuantity: 10,
          weightInGrams: 100,
          attributes: [{ name: "Size", value: "S" }],
          images: [],
        }),
      ).rejects.toThrow(CatalogError);
    });

    it("prevents duplicate SKUs on creation", async () => {
      await variantService.createVariant(testProductId, {
        name: "Linen Shirt - Red S",
        sku: "LN-RED-S",
        sellingPrice: 899,
        mrp: 1499,
        stockQuantity: 10,
        weightInGrams: 200,
        attributes: [{ name: "Size", value: "S" }],
        images: [],
      });

      await expect(
        variantService.createVariant(testProductId, {
          name: "Duplicate SKU Variant",
          sku: "LN-RED-S",
          sellingPrice: 899,
          mrp: 1499,
          stockQuantity: 5,
          weightInGrams: 200,
          attributes: [{ name: "Size", value: "S" }],
          images: [],
        }),
      ).rejects.toThrow(CatalogError);
    });
  });

  describe("ProductVariant Updation", () => {
    it("updates attributes and prices while keeping sku and productId immutable", async () => {
      const created = await variantService.createVariant(testProductId, {
        name: "Linen Shirt - Green L",
        sku: "LN-GRN-L",
        sellingPrice: 899,
        mrp: 1499,
        stockQuantity: 15,
        weightInGrams: 220,
        attributes: [{ name: "Size", value: "L" }],
        images: [],
      });

      const updated = await variantService.updateVariant(created._id.toString(), {
        sellingPrice: 999,
        attributes: [
          { name: "Size", value: "L" },
          { name: "Fit", value: "Slim Fit" },
        ],
      });

      expect(updated.sellingPrice).toBe(999);
      expect(updated.mrp).toBe(1499);
      expect(updated.attributes).toHaveLength(2);
      expect(updated.sku).toBe("LN-GRN-L");
      expect(updated.productId.toString()).toBe(testProductId);
    });

    it("rejects price update if new sellingPrice exceeds existing mrp", async () => {
      const created = await variantService.createVariant(testProductId, {
        name: "Linen Shirt - Yellow M",
        sku: "LN-YLW-M",
        sellingPrice: 899,
        mrp: 1200,
        stockQuantity: 15,
        weightInGrams: 220,
        attributes: [{ name: "Size", value: "M" }],
        images: [],
      });

      await expect(
        variantService.updateVariant(created._id.toString(), {
          sellingPrice: 1500, // exceeds mrp 1200
        }),
      ).rejects.toThrow(CatalogError);
    });
  });

  describe("ProductVariant Soft Deletion", () => {
    it("soft deletes a variant by setting isActive to false without dropping audit record", async () => {
      const created = await variantService.createVariant(testProductId, {
        name: "Linen Shirt - Black XL",
        sku: "LN-BLK-XL",
        sellingPrice: 999,
        mrp: 1499,
        stockQuantity: 5,
        weightInGrams: 250,
        attributes: [{ name: "Size", value: "XL" }],
        images: [],
      });

      await variantService.deleteVariant(created._id.toString());

      const docInDb = await ProductVariant.findById(created._id);
      expect(docInDb).not.toBeNull();
      expect(docInDb?.isActive).toBe(false);

      // Verifies it is excluded from active listing
      const activeVariants = await variantService.getVariantsByProductId(testProductId);
      expect(activeVariants.some((v) => v.sku === "LN-BLK-XL")).toBe(false);
    });
  });

  describe("Storefront Aggregation (Product + Variants)", () => {
    it("returns product with populated brand and category plus active variants in one call", async () => {
      await variantService.createVariant(testProductId, {
        name: "Linen Shirt - White S",
        sku: "LN-WHT-S",
        sellingPrice: 899,
        mrp: 1399,
        stockQuantity: 12,
        weightInGrams: 200,
        attributes: [{ name: "Size", value: "S" }],
        images: ["https://example.com/white-s.jpg"],
      });

      const inactive = await variantService.createVariant(testProductId, {
        name: "Linen Shirt - White M (Discontinued)",
        sku: "LN-WHT-M",
        sellingPrice: 899,
        mrp: 1399,
        stockQuantity: 0,
        weightInGrams: 200,
        attributes: [{ name: "Size", value: "M" }],
        images: [],
      });
      await variantService.deleteVariant(inactive._id.toString());

      const result = await productService.getProductWithVariantsBySlug("classic-linen-shirt");

      expect(result.product).toBeDefined();
      expect(result.product.name).toBe("Classic Linen Shirt");
      expect(result.product.brand.name).toBe("Acme Apparel");
      expect(result.product.category.name).toBe("Shirts");

      // Only active variants should be returned for storefront
      expect(result.variants).toHaveLength(1);
      expect(result.variants[0].sku).toBe("LN-WHT-S");
      expect(result.variants[0].availableStock).toBe(12);
    });
  });
});
