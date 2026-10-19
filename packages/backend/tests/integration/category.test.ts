import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { CategoryService } from "../../src/modules/catalog/services/category.service.js";
import { Category } from "../../src/modules/catalog/models/category.model.js";
import { Product } from "../../src/modules/catalog/models/product.model.js";
import { Brand } from "../../src/modules/catalog/models/brand.model.js";
import { CatalogError } from "../../src/modules/catalog/errors/catalog.errors.js";

describe("Integration: Catalog Category Domain", () => {
  const categoryService = new CategoryService();

  let testBrandId: string;

  beforeEach(async () => {
    const brand = await Brand.create({
      name: "Acme Brand",
      slug: "acme-brand",
      description: "Acme Brand Description",
      isActive: true,
    });
    testBrandId = brand.id;
  });

  describe("Category Creation", () => {
    it("creates a root category successfully with auto-generated slug", async () => {
      const cat = await categoryService.createCategory({
        name: "Men's Apparel",
        description: "Complete clothing catalog for men",
      });

      expect(cat).toBeDefined();
      expect(cat.name).toBe("Men's Apparel");
      expect(cat.slug).toBe("mens-apparel");
      expect(cat.parent).toBeNull();
      expect(cat.ancestors).toEqual([]);
      expect(cat.isActive).toBe(true);
    });

    it("creates a nested child category with correct parent and ancestors", async () => {
      const root = await categoryService.createCategory({
        name: "Women",
        description: "Women's collection",
      });

      const child = await categoryService.createCategory({
        name: "Western Wear",
        description: "Western dresses and tops",
        parent: root._id.toString(),
      });

      const grandChild = await categoryService.createCategory({
        name: "Dresses",
        description: "Casual and evening dresses",
        parent: child._id.toString(),
      });

      expect(child.parent?.toString()).toBe(root._id.toString());
      expect(child.ancestors.map((a) => a.toString())).toEqual([root._id.toString()]);

      expect(grandChild.parent?.toString()).toBe(child._id.toString());
      expect(grandChild.ancestors.map((a) => a.toString())).toEqual([
        root._id.toString(),
        child._id.toString(),
      ]);
    });

    it("rejects creation under a non-existent parent", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(
        categoryService.createCategory({
          name: "Orphan Category",
          description: "No parent exists here",
          parent: fakeId,
        }),
      ).rejects.toThrow(CatalogError);
    });

    it("rejects creation if parent or any ancestor is inactive", async () => {
      const inactiveRoot = await Category.create({
        name: "Winter Sports",
        slug: "winter-sports",
        description: "Winter sports apparel",
        isActive: false,
      });

      await expect(
        categoryService.createCategory({
          name: "Ski Jackets",
          description: "Jackets for skiing",
          parent: inactiveRoot.id,
        }),
      ).rejects.toThrow("An ancestor category in this branch is inactive");
    });

    it("prevents duplicate category names under the same parent", async () => {
      await categoryService.createCategory({
        name: "Outerwear",
        slug: "outerwear",
        description: "Coats and jackets",
      });

      await expect(
        categoryService.createCategory({
          name: "Outerwear",
          slug: "outerwear-alt",
          description: "Duplicate outerwear at root",
        }),
      ).rejects.toThrow(CatalogError);
    });
  });

  describe("Category Tree & Effective Status", () => {
    it("computes isEffectivelyActive and blockingAncestorId correctly", async () => {
      const root = await Category.create({
        name: "Accessories",
        slug: "accessories",
        description: "Fashion accessories",
        isActive: false, // inactive parent
      });

      const child = await Category.create({
        name: "Watches",
        slug: "watches",
        description: "Analog and digital watches",
        parent: root._id,
        ancestors: [root._id],
        isActive: true,
      });

      const tree = await categoryService.getCategoryTree();
      const childNode = tree.find((c) => c._id.toString() === child._id.toString());

      expect(childNode).toBeDefined();
      expect(childNode?.isActive).toBe(true);
      expect(childNode?.isEffectivelyActive).toBe(false);
      expect(childNode?.blockingAncestorId?.toString()).toBe(root._id.toString());
    });

    it("retrieves single tree node detail with accurate childrenCount", async () => {
      const parent = await categoryService.createCategory({
        name: "Footwear",
        description: "Shoes and sneakers",
      });

      await categoryService.createCategory({
        name: "Sneakers",
        description: "Running and lifestyle sneakers",
        parent: parent._id.toString(),
      });

      await categoryService.createCategory({
        name: "Formal Shoes",
        description: "Leather formal shoes",
        parent: parent._id.toString(),
      });

      const detail = await categoryService.getTreeNode(parent._id.toString());

      expect(detail.id).toBe(parent._id.toString());
      expect(detail.name).toBe("Footwear");
      expect(detail.childrenCount).toBe(2);
      expect(detail.isEffectivelyActive).toBe(true);
    });
  });

  describe("Category Updation", () => {
    it("updates name, description, and status", async () => {
      const created = await categoryService.createCategory({
        name: "Summer Collection",
        description: "Initial summer clothing list",
      });

      const updated = await categoryService.updateCategory(created._id.toString(), {
        name: "Summer Wear 2026",
        description: "Updated description for summer collection",
        isActive: false,
      });

      expect(updated.name).toBe("Summer Wear 2026");
      expect(updated.description).toBe("Updated description for summer collection");
      expect(updated.isActive).toBe(false);
    });

    it("prevents activating a child category if its ancestor is inactive", async () => {
      const root = await Category.create({
        name: "Activewear",
        slug: "activewear",
        description: "Activewear collection",
        isActive: false,
      });

      const child = await Category.create({
        name: "Gym Shorts",
        slug: "gym-shorts",
        description: "Breathable gym shorts",
        parent: root._id,
        ancestors: [root._id],
        isActive: false,
      });

      await expect(
        categoryService.updateCategory(child._id.toString(), {
          isActive: true,
        }),
      ).rejects.toThrow("Cannot activate category while its ancestor is inactive");
    });

    it("updates tree position by moving category to a new parent and updates descendants", async () => {
      const oldRoot = await categoryService.createCategory({
        name: "Old Department",
        description: "Old department for clothing",
      });

      const newRoot = await categoryService.createCategory({
        name: "New Department",
        description: "New department for clothing",
      });

      const section = await categoryService.createCategory({
        name: "Casuals Section",
        description: "Casual clothes section",
        parent: oldRoot._id.toString(),
      });

      const item = await categoryService.createCategory({
        name: "Polo Tees",
        description: "Cotton polo t-shirts",
        parent: section._id.toString(),
      });

      // Move section from oldRoot to newRoot
      const moved = await categoryService.updateCategory(section._id.toString(), {
        parent: newRoot._id.toString(),
      });

      expect(moved.parent?.toString()).toBe(newRoot._id.toString());
      expect(moved.ancestors.map((a) => a.toString())).toEqual([newRoot._id.toString()]);

      // Check descendant updated
      const descendant = await Category.findById(item._id);
      expect(descendant?.ancestors.map((a) => a.toString())).toEqual([
        newRoot._id.toString(),
        section._id.toString(),
      ]);
    });

    it("prevents circular tree cycles when repositioning", async () => {
      const parent = await categoryService.createCategory({
        name: "Parent Branch",
        description: "Parent branch",
      });

      const child = await categoryService.createCategory({
        name: "Child Branch",
        description: "Child branch",
        parent: parent._id.toString(),
      });

      // Attempting to move parent under child
      await expect(
        categoryService.updateCategory(parent._id.toString(), {
          parent: child._id.toString(),
        }),
      ).rejects.toThrow("Cannot move a category under itself or one of its descendants");

      // Attempting to move category under itself
      await expect(
        categoryService.updateCategory(parent._id.toString(), {
          parent: parent._id.toString(),
        }),
      ).rejects.toThrow("Category cannot be its own parent");
    });
  });

  describe("Category Deletion", () => {
    it("deletes a leaf category with no children or products", async () => {
      const leaf = await categoryService.createCategory({
        name: "Temporary Category",
        description: "Category to be deleted",
      });

      await categoryService.deleteCategory(leaf._id.toString());

      const found = await Category.findById(leaf._id);
      expect(found).toBeNull();
    });

    it("rejects deletion if category has subcategories", async () => {
      const parent = await categoryService.createCategory({
        name: "Parent Category",
        description: "Parent with children",
      });

      await categoryService.createCategory({
        name: "Child Category",
        description: "Child of parent",
        parent: parent._id.toString(),
      });

      await expect(
        categoryService.deleteCategory(parent._id.toString()),
      ).rejects.toThrow("Cannot delete category that has subcategories");
    });

    it("rejects deletion if category is linked to products", async () => {
      const category = await categoryService.createCategory({
        name: "Pants",
        description: "Men and Women pants",
      });

      await Product.create({
        name: "Chino Pants",
        slug: "chino-pants",
        description: "Slim fit chino trousers",
        category: category._id,
        brand: testBrandId,
        hsnCode: "620342",
        gstRate: 12,
        isActive: true,
        tags: ["pants", "chinos"],
      });

      await expect(
        categoryService.deleteCategory(category._id.toString()),
      ).rejects.toThrow("Cannot delete category that has associated products");
    });
  });
});
