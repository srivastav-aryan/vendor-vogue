import {
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@e-com/shared/schemas";
import mongoose from "mongoose";
import { RequestContext } from "../../../shared/types/request-context.js";
import {
  getDuplicateKeyField,
  isMongoDuplicateKeyError,
} from "../../../shared/utils/mongo.utils.js";
import {
  buildPaginationMeta,
  PaginatedResult,
  parsePagination,
} from "../../../shared/utils/pagination.utils.js";
import { generateSlug } from "../../../shared/utils/slug.utils.js";
import { CatalogError } from "../errors/catalog.errors.js";
import { ICategoryServices } from "../interfaces/category.service.interface.js";
import { Category, LeanCategory } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import {
  CategoryDetailResponse,
  CategoryTreeResponse,
} from "@e-com/shared/types";
import Fuse from "fuse.js";

export type CategoryWithStatus = LeanCategory & {
  isEffectivelyActive: boolean;
  blockingAncestorId: mongoose.Types.ObjectId | null;
};

export class CategoryService implements ICategoryServices {
  async createCategory(
    input: CreateCategoryInput,
    ctx?: RequestContext,
  ): Promise<LeanCategory> {
    try {
      ctx?.logger.info({ categoryName: input.name }, "Creating category");

      const slug: string = input.slug ?? generateSlug(input.name);

      if (!input.parent) {
        const category = await Category.create({
          name: input.name,
          slug,
          description: input.description,
        });

        ctx?.logger.info({ categoryId: category.id }, "Category created");

        return category.toObject();
      }

      const parentDoc: LeanCategory | null = await Category.findById(
        input.parent,
      ).lean();
      if (!parentDoc) {
        ctx?.logger.warn({ parentId: input.parent }, "Parent does not exist");
        throw new CatalogError(
          "CATEGORY_NOT_FOUND",
          "No such parent exists",
          404,
        );
      }

      const ancestors = [...parentDoc.ancestors, parentDoc._id];

      const isInActiveAncestors = await Category.findOne({
        _id: { $in: ancestors },
        isActive: false,
      }).lean();

      if (isInActiveAncestors) {
        ctx?.logger.warn(
          {
            ancestorId: isInActiveAncestors._id,
            ancestorName: isInActiveAncestors.name,
          },
          "An ancestor category is inactive",
        );
        throw new CatalogError(
          "CATEGORY_INACTIVE",
          "An ancestor category in this branch is inactive",
          400,
        );
      }

      const category = await Category.create({
        name: input.name,
        slug,
        description: input.description,
        parent: input.parent,
        ancestors,
      });

      ctx?.logger.info({ categoryId: category.id }, "Category created");

      return category.toObject();
    } catch (error: unknown) {
      if (error instanceof CatalogError) throw error;

      if (isMongoDuplicateKeyError(error)) {
        const field = getDuplicateKeyField(error);
        const value = error.keyValue[field];

        ctx?.logger.warn(
          { field, value, name: input.name },
          "Duplicate category field on create",
        );

        throw new CatalogError(
          "CATEGORY_ALREADY_EXISTS",
          `Category ${field} already exists`,
          409,
        );
      }

      throw error;
    }
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
    ctx?: RequestContext,
  ): Promise<LeanCategory> {
    ctx?.logger.info({ categoryId: id }, "Updating category");

    try {
      const category = await Category.findById(id);
      if (!category) {
        throw new CatalogError(
          "CATEGORY_NOT_FOUND",
          "Category not found",
          404,
        );
      }

      // If category is being marked active, ensure its ancestors are not inactive
      if (input.isActive === true && !category.isActive) {
        if (category.ancestors && category.ancestors.length > 0) {
          const inactiveAncestor = await Category.findOne({
            _id: { $in: category.ancestors },
            isActive: false,
          }).lean();

          if (inactiveAncestor) {
            ctx?.logger.warn(
              {
                categoryId: id,
                ancestorId: inactiveAncestor._id,
              },
              "Cannot activate category with inactive ancestor",
            );
            throw new CatalogError(
              "CATEGORY_INACTIVE",
              "Cannot activate category while its ancestor is inactive",
              400,
            );
          }
        }
      }

      // Update Tree Position (Parent)
      if (input.parent !== undefined) {
        const oldParentStr = category.parent ? category.parent.toString() : null;
        const newParentStr = input.parent ? input.parent : null;

        if (newParentStr !== oldParentStr) {
          let newAncestors: mongoose.Types.ObjectId[] = [];

          if (newParentStr !== null) {
            if (newParentStr === id) {
              throw new CatalogError(
                "CATEGORY_CYCLE",
                "Category cannot be its own parent",
                400,
              );
            }

            const newParentDoc = await Category.findById(newParentStr).lean();
            if (!newParentDoc) {
              throw new CatalogError(
                "CATEGORY_NOT_FOUND",
                "New parent category does not exist",
                404,
              );
            }

            // Prevent cycles: cannot move category under itself or one of its descendants
            if (
              newParentDoc.ancestors.some((a) => a.toString() === id) ||
              newParentDoc._id.toString() === id
            ) {
              throw new CatalogError(
                "CATEGORY_CYCLE",
                "Cannot move a category under itself or one of its descendants",
                400,
              );
            }

            // If this category is active, ensure new parent branch is active
            const targetActive = input.isActive !== undefined ? input.isActive : category.isActive;
            if (targetActive) {
              const fullParentChain = [...newParentDoc.ancestors, newParentDoc._id];
              const inactiveAncestor = await Category.findOne({
                _id: { $in: fullParentChain },
                isActive: false,
              }).lean();

              if (inactiveAncestor) {
                throw new CatalogError(
                  "CATEGORY_INACTIVE",
                  "Cannot move an active category under an inactive parent branch",
                  400,
                );
              }
            }

            newAncestors = [...newParentDoc.ancestors, newParentDoc._id];
          }

          // Update all descendants' ancestor chains
          const descendants = await Category.find({ ancestors: category._id });
          for (const desc of descendants) {
            const idx = desc.ancestors.findIndex(
              (a) => a.toString() === category._id.toString(),
            );
            if (idx !== -1) {
              const suffix = desc.ancestors.slice(idx + 1);
              desc.ancestors = [...newAncestors, category._id, ...suffix];
              await desc.save();
            }
          }

          category.parent = newParentStr
            ? new mongoose.Types.ObjectId(newParentStr)
            : null;
          category.ancestors = newAncestors;
        }
      }

      if (input.name !== undefined) category.name = input.name;
      if (input.description !== undefined) category.description = input.description;
      if (input.isActive !== undefined) category.isActive = input.isActive;

      await category.save();

      ctx?.logger.info({ categoryId: id }, "Category updated successfully");
      return category.toObject();
    } catch (error: unknown) {
      if (error instanceof CatalogError) throw error;

      if (isMongoDuplicateKeyError(error)) {
        const field = getDuplicateKeyField(error);
        throw new CatalogError(
          "CATEGORY_ALREADY_EXISTS",
          `Category ${field} already exists`,
          409,
        );
      }

      throw error;
    }
  }

  async deleteCategory(id: string, ctx?: RequestContext): Promise<void> {
    ctx?.logger.info({ categoryId: id }, "Deleting category");

    const category = await Category.findById(id);
    if (!category) {
      throw new CatalogError(
        "CATEGORY_NOT_FOUND",
        "Category not found",
        404,
      );
    }

    // Check if category has any children
    const hasChildren = await Category.exists({ parent: id });
    if (hasChildren) {
      ctx?.logger.warn(
        { categoryId: id },
        "Cannot delete category with subcategories",
      );
      throw new CatalogError(
        "CATEGORY_HAS_CHILDREN",
        "Cannot delete category that has subcategories. Reassign or delete subcategories first.",
        409,
      );
    }

    // Check if any product is linked to this category
    const hasProducts = await Product.exists({ category: id });
    if (hasProducts) {
      ctx?.logger.warn(
        { categoryId: id },
        "Cannot delete category linked to products",
      );
      throw new CatalogError(
        "CATEGORY_HAS_PRODUCTS",
        "Cannot delete category that has associated products.",
        409,
      );
    }

    await Category.findByIdAndDelete(id);
    ctx?.logger.info({ categoryId: id }, "Category deleted successfully");
  }

  async getCategoryTree(ctx?: RequestContext): Promise<CategoryWithStatus[]> {
    ctx?.logger.info("Fetching category tree with active status");

    try {
      const entireCatTree = await Category.find().lean();
      const categoryMap = new Map<string, LeanCategory>();

      for (const doc of entireCatTree) {
        categoryMap.set(doc._id.toString(), doc);
      }

      const categoriesWithStatus: CategoryWithStatus[] = entireCatTree.map(
        (doc) => {
          if (!doc.isActive) {
            return {
              ...doc,
              isEffectivelyActive: false,
              blockingAncestorId: null,
            };
          }

          for (const ancestorId of doc.ancestors) {
            const ancestorDoc = categoryMap.get(ancestorId.toString());

            if (!ancestorDoc || !ancestorDoc.isActive) {
              return {
                ...doc,
                isEffectivelyActive: false,
                blockingAncestorId: ancestorId,
              };
            }
          }

          return {
            ...doc,
            isEffectivelyActive: true,
            blockingAncestorId: null,
          };
        },
      );

      ctx?.logger.info(
        { totalCategories: categoriesWithStatus.length },
        "Category tree retrieved successfully",
      );

      return categoriesWithStatus;
    } catch (error: unknown) {
      ctx?.logger.error({ err: error }, "Failed to retrieve category tree");
      if (error instanceof CatalogError) throw error;
      throw error;
    }
  }

  async getCategory(
    query: CategoryListQuery,
    ctx?: RequestContext,
  ): Promise<PaginatedResult<CategoryWithStatus>> {
    ctx?.logger.info({ query }, "fetching categories for admin frontend");

    try {
      const { search, page, limit, status, depth, parent } = query;

      const entireCatTree = await Category.find().lean();
      ctx?.logger.info(
        { totalDBCount: entireCatTree.length },
        "Fetched entire category tree from DB",
      );
      const categoryMap = new Map<string, LeanCategory>();

      for (const doc of entireCatTree) {
        categoryMap.set(doc._id.toString(), doc);
      }

      const categoriesWithStatus: CategoryWithStatus[] = entireCatTree.map(
        (doc) => {
          if (!doc.isActive) {
            return {
              ...doc,
              isEffectivelyActive: false,
              blockingAncestorId: null,
            };
          }

          for (const ancestorId of doc.ancestors) {
            const ancestorDoc = categoryMap.get(ancestorId.toString());

            if (!ancestorDoc || !ancestorDoc.isActive) {
              return {
                ...doc,
                isEffectivelyActive: false,
                blockingAncestorId: ancestorId,
              };
            }
          }

          return {
            ...doc,
            isEffectivelyActive: true,
            blockingAncestorId: null,
          };
        },
      );

      let filteredData = categoriesWithStatus;

      // 1. Status Filter
      if (status === "active") {
        filteredData = filteredData.filter((cat) => cat.isEffectivelyActive);
      } else if (status === "inActive" || (status as string) === "inactive") {
        filteredData = filteredData.filter((cat) => !cat.isActive);
      } else if (status === "blocked") {
        filteredData = filteredData.filter(
          (cat) => cat.isActive && !cat.isEffectivelyActive,
        );
      }
      ctx?.logger.info(
        { count: filteredData.length, status },
        "Applied status filter",
      );

      // 2. Search Filter (name or slug)
      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const searchRegex = new RegExp(safeSearch, "i");
        filteredData = filteredData.filter(
          (cat) => searchRegex.test(cat.name) || searchRegex.test(cat.slug),
        );
        ctx?.logger.info(
          { count: filteredData.length, search },
          "Applied search filter",
        );
      }

      // 3. Depth Filter
      if (depth === "root") {
        filteredData = filteredData.filter((cat) => cat.ancestors.length === 0);
      } else if (depth === "level1") {
        filteredData = filteredData.filter((cat) => cat.ancestors.length === 1);
      } else if (depth === "level2") {
        filteredData = filteredData.filter((cat) => cat.ancestors.length === 2);
      }
      ctx?.logger.info(
        { count: filteredData.length, depth },
        "Applied depth filter",
      );

      // 4. Parent Filter (if provided)
      if (parent) {
        filteredData = filteredData.filter(
          (cat) => cat.parent?.toString() === parent,
        );
        ctx?.logger.info(
          { count: filteredData.length, parent },
          "Applied parent filter",
        );
      }

      // 5. Pagination
      const {
        page: safePage,
        limit: safeLimit,
        skip,
      } = parsePagination(page, limit);
      const totalCount = filteredData.length;
      const paginatedItems = filteredData.slice(skip, skip + safeLimit);
      const pagination = buildPaginationMeta(totalCount, safePage, safeLimit);

      ctx?.logger.info(
        {
          totalCount,
          returnedCount: paginatedItems.length,
          page: safePage,
          limit: safeLimit,
        },
        "Categories retrieved successfully",
      );

      return {
        items: paginatedItems,
        pagination,
      };
    } catch (error: unknown) {
      ctx?.logger.error({ err: error, query }, "Failed to retrieve categories");
      if (error instanceof CatalogError) throw error;
      throw error;
    }
  }

  async getTree(
    query: CategoryListQuery,
    ctx?: RequestContext,
  ): Promise<CategoryTreeResponse[]> {
    ctx?.logger.info({ query }, "Fetching category tree for admin frontend");

    try {
      const { status, search, parent } = query;

      const allCategories = await Category.find().lean();
      ctx?.logger.info(
        { totalDBCount: allCategories.length },
        "Fetched categories from DB",
      );

      const categoryMap = new Map<string, LeanCategory>();

      for (const category of allCategories) {
        categoryMap.set(category._id.toString(), category);
      }

      const categoriesWithStatus: CategoryWithStatus[] = allCategories.map(
        (doc) => {
          if (!doc.isActive) {
            return {
              ...doc,
              isEffectivelyActive: false,
              blockingAncestorId: null,
            };
          }

          for (const ancestorId of doc.ancestors) {
            const ancestorDoc = categoryMap.get(ancestorId.toString());

            if (!ancestorDoc || !ancestorDoc.isActive) {
              return {
                ...doc,
                isEffectivelyActive: false,
                blockingAncestorId: ancestorId,
              };
            }
          }

          return {
            ...doc,
            isEffectivelyActive: true,
            blockingAncestorId: null,
          };
        },
      );

      let filteredCategories = categoriesWithStatus;

      if (status == "active") {
        filteredCategories = filteredCategories.filter(
          (doc) => doc.isActive && doc.isEffectivelyActive,
        );
        ctx?.logger.info(
          { count: filteredCategories.length, status },
          "Applied status filter",
        );
      }

      if (search) {
        const fuse = new Fuse(categoriesWithStatus, {
          keys: ["name", "slug"],
          threshold: 0.3,
        });

        const searchHits = fuse.search(search).map((result) => result.item);

        const matchedCategoryIds = new Set(
          searchHits.map((cat) => cat._id.toString()),
        );

        const matchedOrAncestorIds = new Set<string>();
        for (const hit of searchHits) {
          matchedOrAncestorIds.add(hit._id.toString());
          for (const ancId of hit.ancestors) {
            matchedOrAncestorIds.add(ancId.toString());
          }
        }

        filteredCategories = filteredCategories.filter(
          (cat) =>
            matchedOrAncestorIds.has(cat._id.toString()) ||
            cat.ancestors.some((id) => matchedCategoryIds.has(id.toString())),
        );

        ctx?.logger.info(
          {
            count: filteredCategories.length,
            search,
            directMatches: searchHits.length,
          },
          "Applied search filter",
        );
      }

      if (parent) {
        filteredCategories = filteredCategories.filter(
          (cat) =>
            cat._id.toString() === parent ||
            cat.ancestors.some(
              (ancestorId) => ancestorId.toString() === parent,
            ),
        );
        ctx?.logger.info(
          { count: filteredCategories.length, parent },
          "Applied parent filter",
        );
      }

      const categoryTree: any[] = [];
      const treeMap = new Map<string, any>();

      for (const cat of filteredCategories) {
        treeMap.set(cat._id.toString(), { ...cat, children: [] });
      }

      for (const cat of filteredCategories) {
        const node = treeMap.get(cat._id.toString());
        if (cat.parent && treeMap.has(cat.parent.toString())) {
          treeMap.get(cat.parent.toString()).children.push(node);
        } else {
          categoryTree.push(node);
        }
      }
      // Since JS objects are held by reference, updating child in treeMap updates it in categoryTree as well

      ctx?.logger.info(
        {
          rootNodesCount: categoryTree.length,
          totalNodesCount: filteredCategories.length,
        },
        "Category tree assembled successfully",
      );

      const responseTree: CategoryTreeResponse[] = categoryTree;

      return responseTree;
    } catch (error: unknown) {
      ctx?.logger.error(
        { err: error, query },
        "Failed to retrieve category tree",
      );
      if (error instanceof CatalogError) throw error;
      throw error;
    }
  }

  async getTreeNode(
    id: string,
    ctx?: RequestContext,
  ): Promise<CategoryDetailResponse> {
    ctx?.logger.info("Fetching category tree node ");

    try {
      const categoryNode = await Category.findById(id)
        .populate<{
          parent: {
            _id: string;
            name: string;
            slug: string;
            isActive: boolean;
          } | null;
        }>("parent", "name slug isActive")
        .populate<{
          ancestors: {
            _id: string;
            name: string;
            slug: string;
            isActive: boolean;
          }[];
        }>("ancestors", "name slug isActive")
        .lean();

      if (!categoryNode) {
        throw new CatalogError(
          "CATEGORY_NOT_FOUND",
          "NO such category is in the catalog",
          404,
        );
      }

      const childrenCount = await Category.countDocuments({ parent: id });

      const blockingAncestor = categoryNode.ancestors.find(
        (ancestor) => ancestor.isActive === false,
      );

      let nodeWithStatus = categoryNode as any;

      if (!categoryNode.isActive) {
        nodeWithStatus.isEffectivelyActive = false;
        nodeWithStatus.blockingAncestorId = null;
      } else if (blockingAncestor) {
        nodeWithStatus.isEffectivelyActive = false;
        nodeWithStatus.blockingAncestorId = blockingAncestor._id.toString();
      } else {
        nodeWithStatus.isEffectivelyActive = true;
        nodeWithStatus.blockingAncestorId = null;
      }

      const parentId = categoryNode.parent
        ? typeof categoryNode.parent === "object" && "_id" in (categoryNode.parent as any)
          ? (categoryNode.parent as any)._id.toString()
          : String(categoryNode.parent)
        : null;

      const ancestorIds = (categoryNode.ancestors ?? []).map((a: any) =>
        typeof a === "object" && "_id" in a ? a._id.toString() : a.toString()
      );

      const parentDetail =
        categoryNode.parent &&
        typeof categoryNode.parent === "object" &&
        "_id" in (categoryNode.parent as any)
          ? {
              id: (categoryNode.parent as any)._id.toString(),
              name: (categoryNode.parent as any).name,
              slug: (categoryNode.parent as any).slug,
              isActive: (categoryNode.parent as any).isActive,
            }
          : null;

      const ancestorDetails = (categoryNode.ancestors ?? [])
        .filter((a: any) => typeof a === "object" && "_id" in a)
        .map((a: any) => ({
          id: a._id.toString(),
          name: a.name,
          slug: a.slug,
          isActive: a.isActive,
        }));

      return {
        id: categoryNode._id.toString(),
        name: categoryNode.name,
        slug: categoryNode.slug,
        description: categoryNode.description,
        parent: parentId,
        parentDetail,
        ancestors: ancestorIds,
        ancestorDetails,
        isActive: categoryNode.isActive,
        isEffectivelyActive: nodeWithStatus.isEffectivelyActive,
        blockingAncestorId: nodeWithStatus.blockingAncestorId,
        childrenCount,
        createdAt:
          categoryNode.createdAt instanceof Date
            ? categoryNode.createdAt.toISOString()
            : String(categoryNode.createdAt),
        updatedAt:
          categoryNode.updatedAt instanceof Date
            ? categoryNode.updatedAt.toISOString()
            : String(categoryNode.updatedAt),
      };
    } catch (error: unknown) {
      ctx?.logger.error({ err: error }, "Failed to retrieve category node");
      if (error instanceof CatalogError) throw error;
      throw error;
    }
  }
}
