import {
  CreateProductVariantInput,
  UpdateProductVariantInput,
} from "@e-com/shared/schemas";
import { RequestContext } from "../../../shared/types/request-context.js";
import { LeanProductVariant } from "../models/productVariant.model.js";

export interface IVariantService {
  createVariant(
    productId: string,
    input: CreateProductVariantInput,
    ctx?: RequestContext,
  ): Promise<LeanProductVariant>;

  getVariantsByProductId(
    productId: string,
    ctx?: RequestContext,
  ): Promise<LeanProductVariant[]>;

  getVariantById(
    id: string,
    ctx?: RequestContext,
  ): Promise<LeanProductVariant>;

  updateVariant(
    id: string,
    input: UpdateProductVariantInput,
    ctx?: RequestContext,
  ): Promise<LeanProductVariant>;

  deleteVariant(
    id: string,
    ctx?: RequestContext,
  ): Promise<void>;
}
