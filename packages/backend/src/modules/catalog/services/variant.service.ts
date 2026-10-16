import {
  CreateProductVariantInput,
  UpdateProductVariantInput,
} from "@e-com/shared/schemas";
import { IVariantService } from "../interfaces/variant.service.interface.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import {
  LeanProductVariant,
  ProductVariant,
} from "../models/productVariant.model.js";
import { Product } from "../models/product.model.js";
import { CatalogError } from "../errors/catalog.errors.js";
import { generateSlug } from "../../../shared/utils/slug.utils.js";
import {
  getDuplicateKeyField,
  isMongoDuplicateKeyError,
} from "../../../shared/utils/mongo.utils.js";

export class VariantService implements IVariantService {
  async createVariant(
    productId: string,
    input: CreateProductVariantInput,
    ctx?: RequestContext,
  ): Promise<LeanProductVariant> {
    ctx?.logger?.info(
      { productId, sku: input.sku, variantName: input.name },
      "Creating product variant",
    );

    // 1. Verify parent product exists and is active
    const product = await Product.findOne({ _id: productId, isActive: true })
      .select("_id")
      .lean();

    if (!product) {
      ctx?.logger?.warn({ productId }, "Parent product not found or inactive");
      throw new CatalogError(
        "PRODUCT_NOT_FOUND",
        "Parent product not found or is inactive",
        404,
      );
    }

    // 2. Validate price constraint (sellingPrice <= mrp)
    if (input.sellingPrice > input.mrp) {
      throw new CatalogError(
        "VARIANT_PRICE_INVALID",
        "Selling price cannot exceed MRP",
        400,
      );
    }

    try {
      const slug = input.slug ?? generateSlug(input.name);

      const variant = await ProductVariant.create({
        productId,
        name: input.name,
        slug,
        description: input.description ?? "",
        sku: input.sku,
        sellingPrice: input.sellingPrice,
        mrp: input.mrp,
        costPrice: input.costPrice ?? 0,
        stockQuantity: input.stockQuantity ?? 0,
        reservedQuantity: 0,
        weightInGrams: input.weightInGrams ?? 0,
        attributes: input.attributes,
        images: input.images ?? [],
        isActive: true,
      });

      ctx?.logger?.info(
        { variantId: variant.id, sku: variant.sku },
        "Product variant created successfully",
      );

      const obj = variant.toObject() as unknown as LeanProductVariant;
      obj.availableStock = variant.stockQuantity - variant.reservedQuantity;
      return obj;
    } catch (error: unknown) {
      if (error instanceof CatalogError) throw error;

      if (isMongoDuplicateKeyError(error)) {
        const field = getDuplicateKeyField(error);
        const value = error.keyValue?.[field];

        ctx?.logger?.warn(
          { field, value, sku: input.sku },
          "Duplicate variant field on create",
        );

        throw new CatalogError(
          "VARIANT_ALREADY_EXISTS",
          `Variant with this ${field} already exists`,
          409,
        );
      }

      throw error;
    }
  }

  async getVariantsByProductId(
    productId: string,
    ctx?: RequestContext,
  ): Promise<LeanProductVariant[]> {
    ctx?.logger?.debug({ productId }, "Fetching variants for product");

    // Check parent product exists
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      ctx?.logger?.warn({ productId }, "Product not found when fetching variants");
      throw new CatalogError("PRODUCT_NOT_FOUND", "Product not found", 404);
    }

    const variants = await ProductVariant.find({
      productId,
      isActive: true,
    }).lean();

    return variants.map((v) => ({
      ...v,
      availableStock: Math.max(0, v.stockQuantity - v.reservedQuantity),
    })) as unknown as LeanProductVariant[];
  }

  async getVariantById(
    id: string,
    ctx?: RequestContext,
  ): Promise<LeanProductVariant> {
    ctx?.logger?.debug({ variantId: id }, "Fetching variant by ID");

    const variant = await ProductVariant.findById(id).lean();

    if (!variant) {
      ctx?.logger?.warn({ variantId: id }, "Variant not found");
      throw new CatalogError("VARIANT_NOT_FOUND", "Variant not found", 404);
    }

    return {
      ...variant,
      availableStock: Math.max(0, variant.stockQuantity - variant.reservedQuantity),
    } as unknown as LeanProductVariant;
  }

  async updateVariant(
    id: string,
    input: UpdateProductVariantInput,
    ctx?: RequestContext,
  ): Promise<LeanProductVariant> {
    ctx?.logger?.info({ variantId: id }, "Updating variant");

    const currentVariant = await ProductVariant.findById(id);

    if (!currentVariant) {
      ctx?.logger?.warn({ variantId: id }, "Variant not found for update");
      throw new CatalogError("VARIANT_NOT_FOUND", "Variant not found", 404);
    }

    // Determine target prices for cross-validation
    const targetSellingPrice =
      input.sellingPrice !== undefined
        ? input.sellingPrice
        : currentVariant.sellingPrice;
    const targetMrp =
      input.mrp !== undefined ? input.mrp : currentVariant.mrp;

    if (targetSellingPrice > targetMrp) {
      throw new CatalogError(
        "VARIANT_PRICE_INVALID",
        "Selling price cannot exceed MRP",
        400,
      );
    }

    // sku and productId are protected and never mutated here
    if (input.name !== undefined) currentVariant.name = input.name;
    if (input.description !== undefined)
      currentVariant.description = input.description;
    if (input.sellingPrice !== undefined)
      currentVariant.sellingPrice = input.sellingPrice;
    if (input.mrp !== undefined) currentVariant.mrp = input.mrp;
    if (input.costPrice !== undefined)
      currentVariant.costPrice = input.costPrice ?? 0;
    if (input.weightInGrams !== undefined)
      currentVariant.weightInGrams = input.weightInGrams;
    if (input.attributes !== undefined)
      currentVariant.attributes = input.attributes as any;
    if (input.images !== undefined) currentVariant.images = input.images;
    if (input.isActive !== undefined) currentVariant.isActive = input.isActive;

    try {
      await currentVariant.save();

      ctx?.logger?.info({ variantId: id }, "Variant updated successfully");

      const obj = currentVariant.toObject() as unknown as LeanProductVariant;
      obj.availableStock =
        currentVariant.stockQuantity - currentVariant.reservedQuantity;
      return obj;
    } catch (error: unknown) {
      if (error instanceof CatalogError) throw error;

      if (isMongoDuplicateKeyError(error)) {
        const field = getDuplicateKeyField(error);
        throw new CatalogError(
          "VARIANT_ALREADY_EXISTS",
          `Variant ${field} already exists`,
          409,
        );
      }

      throw error;
    }
  }

  async deleteVariant(id: string, ctx?: RequestContext): Promise<void> {
    ctx?.logger?.info({ variantId: id }, "Soft deleting variant");

    const variant = await ProductVariant.findOneAndUpdate(
      { _id: id, isActive: true },
      { $set: { isActive: false } },
      { new: true },
    );

    if (!variant) {
      ctx?.logger?.info({ variantId: id }, "Variant already inactive or not found");
      return;
    }

    ctx?.logger?.info({ variantId: id }, "Variant soft deleted");
  }
}
