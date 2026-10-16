import {
  CreateProductInput,
  UpdateProductInput,
  ProductListQuery,
} from "@e-com/shared/schemas";
import { IProductService } from "../interfaces/product.service.interface.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import {
  LeanProduct,
  PopulatedLeanProduct,
  Product,
} from "../models/product.model.js";
import { Brand } from "../models/brand.model.js";
import { Category } from "../models/category.model.js";
import { ProductVariant } from "../models/productVariant.model.js";
import { CatalogError } from "../errors/catalog.errors.js";
import { generateSlug } from "../../../shared/utils/slug.utils.js";
import {
  PaginatedResult,
  parsePagination,
  buildPaginationMeta,
} from "../../../shared/utils/pagination.utils.js";
import {
  getDuplicateKeyField,
  isMongoDuplicateKeyError,
} from "../../../shared/utils/mongo.utils.js";

export class ProductService implements IProductService {
  async createProduct(
    input: CreateProductInput,
    ctx?: RequestContext,
  ): Promise<LeanProduct> {
    ctx?.logger?.info({ productName: input.name }, "Creating product");

    // Pragmatic relation validation: concurrent check for brand and category existence & active state
    const [brandDoc, categoryDoc] = await Promise.all([
      Brand.findOne({ _id: input.brand, isActive: true }).select("_id").lean(),
      Category.findOne({ _id: input.category, isActive: true })
        .select("_id")
        .lean(),
    ]);

    if (!brandDoc) {
      ctx?.logger?.warn({ brandId: input.brand }, "Brand not found or inactive");
      throw new CatalogError(
        "BRAND_NOT_FOUND",
        "Associated brand not found or is inactive",
        400,
      );
    }

    if (!categoryDoc) {
      ctx?.logger?.warn(
        { categoryId: input.category },
        "Category not found or inactive",
      );
      throw new CatalogError(
        "CATEGORY_NOT_FOUND",
        "Associated category not found or is inactive",
        400,
      );
    }

    try {
      const slug = input.slug ?? generateSlug(input.name);

      const product = await Product.create({
        name: input.name,
        slug,
        description: input.description,
        category: input.category,
        brand: input.brand,
        hsnCode: input.hsnCode,
        gstRate: input.gstRate,
        images: input.images ?? [],
        tags: input.tags ?? [],
      });

      ctx?.logger?.info({ productId: product.id }, "Product created");
      return product.toObject();
    } catch (error: unknown) {
      if (error instanceof CatalogError) throw error;

      if (isMongoDuplicateKeyError(error)) {
        const field = getDuplicateKeyField(error);
        const value = error.keyValue?.[field];

        ctx?.logger?.warn(
          { field, value, name: input.name },
          "Duplicate product field on create",
        );

        throw new CatalogError(
          "PRODUCT_ALREADY_EXISTS",
          `Product ${field} already exists`,
          409,
        );
      }

      throw error;
    }
  }

  async getProductById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PopulatedLeanProduct> {
    ctx?.logger?.debug({ productId: id }, "Fetching product by ID");

    const product = await Product.findById(id)
      .populate<{
        category: {
          _id: any;
          name: string;
          slug: string;
        };
      }>("category", "name slug")
      .populate<{
        brand: {
          _id: any;
          name: string;
          slug: string;
          logo?: string | null;
        };
      }>("brand", "name slug logo")
      .lean();

    if (!product) {
      ctx?.logger?.warn({ productId: id }, "Product not found");
      throw new CatalogError("PRODUCT_NOT_FOUND", "Product not found", 404);
    }

    return product as unknown as PopulatedLeanProduct;
  }

  async getProductBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<PopulatedLeanProduct> {
    ctx?.logger?.debug({ slug }, "Fetching product by slug");

    const product = await Product.findOne({ slug })
      .populate<{
        category: {
          _id: any;
          name: string;
          slug: string;
        };
      }>("category", "name slug")
      .populate<{
        brand: {
          _id: any;
          name: string;
          slug: string;
          logo?: string | null;
        };
      }>("brand", "name slug logo")
      .lean();

    if (!product) {
      ctx?.logger?.warn({ slug }, "Product not found");
      throw new CatalogError("PRODUCT_NOT_FOUND", "Product not found", 404);
    }

    return product as unknown as PopulatedLeanProduct;
  }

  async getProductWithVariantsBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<{
    product: PopulatedLeanProduct;
    variants: import("../models/productVariant.model.js").LeanProductVariant[];
  }> {
    ctx?.logger?.debug({ slug }, "Fetching product with variants by slug");

    const product = await this.getProductBySlug(slug, ctx);

    const variants = await ProductVariant.find({
      productId: product._id,
      isActive: true,
    }).lean();

    const variantsWithAvailableStock = variants.map((v) => ({
      ...v,
      availableStock: Math.max(0, v.stockQuantity - v.reservedQuantity),
    })) as unknown as import("../models/productVariant.model.js").LeanProductVariant[];

    return {
      product,
      variants: variantsWithAvailableStock,
    };
  }

  async getProductWithVariantsById(
    id: string,
    ctx?: RequestContext,
  ): Promise<{
    product: PopulatedLeanProduct;
    variants: import("../models/productVariant.model.js").LeanProductVariant[];
  }> {
    ctx?.logger?.debug({ productId: id }, "Fetching product with variants by ID");

    const product = await this.getProductById(id, ctx);

    const variants = await ProductVariant.find({
      productId: product._id,
      isActive: true,
    }).lean();

    const variantsWithAvailableStock = variants.map((v) => ({
      ...v,
      availableStock: Math.max(0, v.stockQuantity - v.reservedQuantity),
    })) as unknown as import("../models/productVariant.model.js").LeanProductVariant[];

    return {
      product,
      variants: variantsWithAvailableStock,
    };
  }


  async listProducts(
    query: ProductListQuery,
    ctx?: RequestContext,
  ): Promise<PaginatedResult<PopulatedLeanProduct>> {
    ctx?.logger?.debug({ query }, "Listing products");

    const { page, limit, skip } = parsePagination(query.page, query.limit);

    const filter: Record<string, any> = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.categoryId) {
      filter.category = query.categoryId;
    }

    if (query.brandId) {
      filter.brand = query.brandId;
    }

    if (query.tags && query.tags.length > 0) {
      filter.tags = { $in: query.tags };
    }

    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }

    const [totalCount, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate<{
          category: {
            _id: any;
            name: string;
            slug: string;
          };
        }>("category", "name slug")
        .populate<{
          brand: {
            _id: any;
            name: string;
            slug: string;
            logo?: string | null;
          };
        }>("brand", "name slug logo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      items: products as unknown as PopulatedLeanProduct[],
      pagination: buildPaginationMeta(totalCount, page, limit),
    };
  }

  async updateProduct(
    id: string,
    input: UpdateProductInput,
    ctx?: RequestContext,
  ): Promise<LeanProduct> {
    ctx?.logger?.info({ productId: id }, "Updating product");

    // If updating relations, pragmatically verify existence if provided
    if (input.brand) {
      const brandExists = await Brand.exists({
        _id: input.brand,
        isActive: true,
      });
      if (!brandExists) {
        throw new CatalogError(
          "BRAND_NOT_FOUND",
          "Brand not found or is inactive",
          400,
        );
      }
    }

    if (input.category) {
      const categoryExists = await Category.exists({
        _id: input.category,
        isActive: true,
      });
      if (!categoryExists) {
        throw new CatalogError(
          "CATEGORY_NOT_FOUND",
          "Category not found or is inactive",
          400,
        );
      }
    }

    try {
      const product = await Product.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true, runValidators: true },
      ).lean();

      if (!product) {
        throw new CatalogError("PRODUCT_NOT_FOUND", "Product not found", 404);
      }

      ctx?.logger?.info({ productId: id }, "Product updated");
      return product;
    } catch (error: unknown) {
      if (error instanceof CatalogError) throw error;

      if (isMongoDuplicateKeyError(error)) {
        const field = getDuplicateKeyField(error);
        const value = error.keyValue?.[field];

        ctx?.logger?.warn(
          { productId: id, field, value },
          "Duplicate product field on update",
        );

        throw new CatalogError(
          "PRODUCT_ALREADY_EXISTS",
          `Product ${field} already exists`,
          409,
        );
      }

      throw error;
    }
  }

  async softDeleteProduct(id: string, ctx?: RequestContext): Promise<void> {
    ctx?.logger?.info({ productId: id }, "Soft deleting product");

    const product = await Product.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } },
      { new: true },
    );

    if (!product) {
      ctx?.logger?.info({ productId: id }, "Product already inactive or not found");
      return; // idempotent success
    }

    ctx?.logger?.info({ productId: id }, "Product soft deleted");
  }

  async hardDeleteProduct(id: string, ctx?: RequestContext): Promise<void> {
    ctx?.logger?.info({ productId: id }, "Hard deleting product");

    const linkedVariant = await ProductVariant.exists({
      productId: id,
    });

    if (linkedVariant) {
      ctx?.logger?.warn(
        { productId: id },
        "Product has variants and cannot be hard deleted",
      );
      throw new CatalogError(
        "PRODUCT_HAS_VARIANTS",
        "Product has associated variants and cannot be deleted",
        409,
      );
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      ctx?.logger?.info({ productId: id }, "Product already deleted or not found");
      return; // idempotent success
    }

    ctx?.logger?.info({ productId: id }, "Product hard deleted");
  }
}
