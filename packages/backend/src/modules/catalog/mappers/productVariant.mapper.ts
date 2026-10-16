import { VariantResponse } from "@e-com/shared/types";
import {
  LeanProductVariant,
  ProductVariantDocument,
} from "../models/productVariant.model.js";

type VariantSource = LeanProductVariant | ProductVariantDocument;

export class ProductVariantMapper {
  /**
   * Maps an internal product variant document or lean object to the public VariantResponse DTO.
   * costPrice is intentionally excluded to prevent leaking procurement costs.
   */
  static toResponse(variant: VariantSource): VariantResponse {
    const rawId = (variant as any)._id ?? (variant as any).id;
    const rawProductId = (variant as any).productId;

    return {
      id: rawId?.toString() ?? "",
      productId: rawProductId?.toString() ?? "",
      name: variant.name,
      slug: variant.slug,
      description: variant.description ?? "",
      sku: variant.sku,
      sellingPrice: variant.sellingPrice,
      mrp: variant.mrp,
      stockQuantity: variant.stockQuantity,
      availableStock:
        (variant as any).availableStock ??
        Math.max(0, variant.stockQuantity - variant.reservedQuantity),
      weightInGrams: variant.weightInGrams,
      attributes: (variant.attributes ?? []).map((attr) => ({
        name: attr.name,
        value: attr.value,
        meta: attr.meta ?? undefined,
      })),
      images: variant.images ?? [],
      isActive: variant.isActive ?? true,
      createdAt:
        variant.createdAt instanceof Date
          ? variant.createdAt.toISOString()
          : String(variant.createdAt),
      updatedAt:
        variant.updatedAt instanceof Date
          ? variant.updatedAt.toISOString()
          : String(variant.updatedAt),
    };
  }

  static toResponseList(variants: VariantSource[]): VariantResponse[] {
    return variants.map((v) => ProductVariantMapper.toResponse(v));
  }
}
