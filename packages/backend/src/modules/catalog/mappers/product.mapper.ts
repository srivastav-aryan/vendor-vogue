import { ProductResponse, ProductDetailResponse } from "@e-com/shared/types";
import {
  LeanProduct,
  ProductDocument,
  PopulatedLeanProduct,
} from "../models/product.model.js";

type ProductSource = LeanProduct | ProductDocument;

export class ProductMapper {
  /**
   * Maps an unpopulated internal product document or lean object to the public ProductResponse DTO.
   */
  static toResponse(product: ProductSource): ProductResponse {
    return {
      id: product._id.toString(),
      vendorId: product.vendorId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category.toString(),
      brand: product.brand.toString(),
      hsnCode: product.hsnCode,
      gstRate: product.gstRate,
      images: product.images ?? [],
      tags: product.tags ?? [],
      isActive: product.isActive,
      createdAt:
        product.createdAt instanceof Date
          ? product.createdAt.toISOString()
          : String(product.createdAt),
      updatedAt:
        product.updatedAt instanceof Date
          ? product.updatedAt.toISOString()
          : String(product.updatedAt),
    };
  }

  /**
   * Maps a populated product (with brand and category sub-documents) to the ProductDetailResponse DTO.
   */
  static toDetailResponse(product: PopulatedLeanProduct): ProductDetailResponse {
    return {
      id: product._id.toString(),
      vendorId: product.vendorId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: {
        id: product.category._id.toString(),
        name: product.category.name,
        slug: product.category.slug,
      },
      brand: {
        id: product.brand._id.toString(),
        name: product.brand.name,
        slug: product.brand.slug,
        logo: product.brand.logo ?? null,
      },
      hsnCode: product.hsnCode,
      gstRate: product.gstRate,
      images: product.images ?? [],
      tags: product.tags ?? [],
      isActive: product.isActive,
      createdAt:
        product.createdAt instanceof Date
          ? product.createdAt.toISOString()
          : String(product.createdAt),
      updatedAt:
        product.updatedAt instanceof Date
          ? product.updatedAt.toISOString()
          : String(product.updatedAt),
    };
  }
}
