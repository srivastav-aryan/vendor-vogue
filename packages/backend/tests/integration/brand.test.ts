import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { BrandService } from "../../src/modules/catalog/services/brand.service.js";
import { Brand } from "../../src/modules/catalog/models/brand.model.js";
import { Product } from "../../src/modules/catalog/models/product.model.js";
import { Category } from "../../src/modules/catalog/models/category.model.js";
import { CatalogError } from "../../src/modules/catalog/errors/catalog.errors.js";

describe("Integration: Catalog Brand Domain", () => {
  const brandService = new BrandService();

  beforeEach(async () => {
    await Brand.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});
  });

  describe("Brand Creation", () => {
    it("creates a brand with auto-generated slug and default active state", async () => {
      const brand = await brandService.createBrand({
        name: "FabIndia Heritage",
        description: "Artisanal handcrafted Indian clothing and home decor.",
        logo: "https://res.cloudinary.com/demo/image/upload/fabindia.png",
      });

      expect(brand).toBeDefined();
      expect(brand.name).toBe("FabIndia Heritage");
      expect(brand.slug).toBe("fabindia-heritage");
      expect(brand.description).toBe("Artisanal handcrafted Indian clothing and home decor.");
      expect(brand.logo).toBe("https://res.cloudinary.com/demo/image/upload/fabindia.png");
      expect(brand.isActive).toBe(true);
    });

    it("prevents creating a brand with duplicate name", async () => {
      await brandService.createBrand({
        name: "Allen Solly",
        description: "Smart casuals for work and leisure wear.",
      });

      await expect(
        brandService.createBrand({
          name: "Allen Solly",
          description: "Duplicate brand description for testing.",
        }),
      ).rejects.toThrowError(CatalogError);

      try {
        await brandService.createBrand({
          name: "Allen Solly",
          description: "Duplicate brand description for testing.",
        });
      } catch (err: any) {
        expect(err.code).toBe("BRAND_ALREADY_EXISTS");
        expect(err.statusCode).toBe(409);
      }
    });
  });

  describe("Brand Retrieval", () => {
    it("retrieves a brand by ID", async () => {
      const created = await brandService.createBrand({
        name: "Peter England",
        description: "Honest and formal clothing for men in India.",
      });

      const retrieved = await brandService.getBrandById(created._id.toString());
      expect(retrieved.name).toBe("Peter England");
      expect(retrieved.slug).toBe("peter-england");
    });

    it("retrieves a brand by Slug", async () => {
      await brandService.createBrand({
        name: "Raymond Fine",
        description: "The complete man suitings and formal fabrics.",
      });

      const retrieved = await brandService.getBrandBySlug("raymond-fine");
      expect(retrieved.name).toBe("Raymond Fine");
    });

    it("throws BRAND_NOT_FOUND when ID does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await expect(brandService.getBrandById(fakeId)).rejects.toThrowError(CatalogError);
    });
  });

  describe("Brand Listing & Filtering", () => {
    beforeEach(async () => {
      const b1 = await Brand.create({
        name: "Nike Athletics",
        slug: "nike-athletics",
        description: "Just do it athletic sportswear and sneakers.",
        isActive: true,
      });

      const b2 = await Brand.create({
        name: "Adidas Originals",
        slug: "adidas-originals",
        description: "Streetwear and classic sneakers worldwide.",
        isActive: true,
      });

      const b3 = await Brand.create({
        name: "Puma Heritage (Legacy)",
        slug: "puma-heritage-legacy",
        description: "Archived retro footwear and lifestyle apparel.",
        isActive: false,
      });
    });

    it("returns active brands by default", async () => {
      const result = await brandService.listBrands({
        page: 1,
        limit: 10,
        isActive: true,
      });

      expect(result.items.length).toBe(2);
      expect(result.items.map((b) => b.name)).toEqual(["Adidas Originals", "Nike Athletics"]);
    });

    it("returns all brands when isActive is undefined (all)", async () => {
      const result = await brandService.listBrands({
        page: 1,
        limit: 10,
        isActive: undefined,
      });

      expect(result.items.length).toBe(3);
    });

    it("filters deactivated brands when isActive is false", async () => {
      const result = await brandService.listBrands({
        page: 1,
        limit: 10,
        isActive: false,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe("Puma Heritage (Legacy)");
    });

    it("supports search query with special regex characters safely", async () => {
      const result = await brandService.listBrands({
        page: 1,
        limit: 10,
        search: "(Legacy)",
        isActive: undefined,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe("Puma Heritage (Legacy)");
    });
  });

  describe("Brand Updation", () => {
    it("updates brand details including name, description, logo, and active status", async () => {
      const brand = await brandService.createBrand({
        name: "Zara Studio",
        description: "Fast fashion apparel from Inditex flagship.",
      });

      const updated = await brandService.updateBrand(brand._id.toString(), {
        name: "Zara Global Studio",
        description: "Updated international fast fashion collection.",
        logo: "https://res.cloudinary.com/demo/image/upload/zara-new.png",
        isActive: false,
      });

      expect(updated.name).toBe("Zara Global Studio");
      expect(updated.description).toBe("Updated international fast fashion collection.");
      expect(updated.logo).toBe("https://res.cloudinary.com/demo/image/upload/zara-new.png");
      expect(updated.isActive).toBe(false);
    });

    it("rejects renaming to a name that already exists", async () => {
      await brandService.createBrand({
        name: "H&M Basic",
        description: "Everyday fashion essentials and denim.",
      });

      const target = await brandService.createBrand({
        name: "Uniqlo LifeWear",
        description: "Japanese minimalist casual essentials.",
      });

      await expect(
        brandService.updateBrand(target._id.toString(), {
          name: "H&M Basic",
        }),
      ).rejects.toThrowError(CatalogError);
    });
  });

  describe("Brand Deletion", () => {
    it("soft deletes a brand by setting isActive to false", async () => {
      const brand = await brandService.createBrand({
        name: "Levi Strauss",
        description: "Pioneer in denim jeans and jackets.",
      });

      await brandService.softDeleteBrand(brand._id.toString());

      const fetched = await Brand.findById(brand._id);
      expect(fetched?.isActive).toBe(false);
    });

    it("hard deletes an unlinked brand from the database", async () => {
      const brand = await brandService.createBrand({
        name: "Temporary Brand",
        description: "Temporary label with no products created.",
      });

      await brandService.hardDeleteBrand(brand._id.toString());

      const fetched = await Brand.findById(brand._id);
      expect(fetched).toBeNull();
    });

    it("rejects hard deletion if the brand has associated products", async () => {
      const brand = await brandService.createBrand({
        name: "Wrangler Jeans",
        description: "Authentic cowboy cut denim and western shirts.",
      });

      const category = await Category.create({
        name: "Denim",
        slug: "denim",
        description: "Denim jeans category for men and women.",
        isActive: true,
      });

      await Product.create({
        name: "Wrangler Texas Denim",
        slug: "wrangler-texas-denim",
        description: "Classic straight leg denim jeans.",
        category: category._id,
        brand: brand._id,
        hsnCode: "620342",
        gstRate: 12,
        isActive: true,
      });

      await expect(
        brandService.hardDeleteBrand(brand._id.toString()),
      ).rejects.toThrowError(CatalogError);

      try {
        await brandService.hardDeleteBrand(brand._id.toString());
      } catch (err: any) {
        expect(err.code).toBe("BRAND_HAS_PRODUCTS");
        expect(err.statusCode).toBe(409);
      }
    });
  });
});
