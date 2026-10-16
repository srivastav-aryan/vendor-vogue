import { NextFunction, Request, Response } from "express";
import { IVariantService } from "../interfaces/variant.service.interface.js";
import { VariantControllerInterface } from "../interfaces/variant.controller.interface.js";
import { ProductVariantMapper } from "../mappers/productVariant.mapper.js";
import { createCtx } from "../../../shared/utils/ctx.utils.js";

export const variantControllerCreator = (
  variantService: IVariantService,
): VariantControllerInterface => {
  return {
    createVariant: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "create_variant");
      try {
        const variant = await variantService.createVariant(
          req.params.productId,
          req.body,
          ctx,
        );

        res.status(201).json({
          success: true,
          data: ProductVariantMapper.toResponse(variant),
          message: "Product variant created successfully",
        });
      } catch (error) {
        next(error);
      }
    },

    getVariantsByProductId: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "get_variants_by_product_id");
      try {
        const variants = await variantService.getVariantsByProductId(
          req.params.productId,
          ctx,
        );

        res.status(200).json({
          success: true,
          data: ProductVariantMapper.toResponseList(variants),
        });
      } catch (error) {
        next(error);
      }
    },

    getVariantById: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "get_variant_by_id");
      try {
        const variant = await variantService.getVariantById(
          req.params.id,
          ctx,
        );

        res.status(200).json({
          success: true,
          data: ProductVariantMapper.toResponse(variant),
        });
      } catch (error) {
        next(error);
      }
    },

    updateVariant: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "update_variant");
      try {
        const variant = await variantService.updateVariant(
          req.params.id,
          req.body,
          ctx,
        );

        res.status(200).json({
          success: true,
          data: ProductVariantMapper.toResponse(variant),
          message: "Product variant updated successfully",
        });
      } catch (error) {
        next(error);
      }
    },

    deleteVariant: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "delete_variant");
      try {
        await variantService.deleteVariant(req.params.id, ctx);

        res.status(200).json({
          success: true,
          message: "Product variant deleted successfully",
        });
      } catch (error) {
        next(error);
      }
    },
  };
};
