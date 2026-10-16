import {
  CreateProductInput,
  UpdateProductInput,
  ProductListQuery,
} from "@e-com/shared/schemas";
import { RequestContext } from "../../../shared/types/request-context.js";
import { PaginatedResult } from "../../../shared/utils/pagination.utils.js";
import { LeanProduct, PopulatedLeanProduct } from "../models/product.model.js";

export interface IProductService {
  createProduct(
    input: CreateProductInput,
    ctx?: RequestContext,
  ): Promise<LeanProduct>;

  getProductById(
    id: string,
    ctx?: RequestContext,
  ): Promise<PopulatedLeanProduct>;

  getProductBySlug(
    slug: string,
    ctx?: RequestContext,
  ): Promise<PopulatedLeanProduct>;

  listProducts(
    query: ProductListQuery,
    ctx?: RequestContext,
  ): Promise<PaginatedResult<PopulatedLeanProduct>>;

  updateProduct(
    id: string,
    input: UpdateProductInput,
    ctx?: RequestContext,
  ): Promise<LeanProduct>;

  softDeleteProduct(id: string, ctx?: RequestContext): Promise<void>;

  hardDeleteProduct(id: string, ctx?: RequestContext): Promise<void>;
}
