import { NextFunction, Request, Response } from "express";
import { IProductService } from "../interfaces/product.service.interface.js";
import { ProductControllerInterface } from "../interfaces/product.controller.interface.js";
import { ProductMapper } from "../mappers/product.mapper.js";
import { createCtx } from "../../../shared/utils/ctx.utils.js";

export const productControllerCreator = (
  productService: IProductService,
): ProductControllerInterface => {
  return {
    createProduct: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "create_product");
      try {
        const product = await productService.createProduct(req.body, ctx);

        res.status(201).json({
          success: true,
          data: ProductMapper.toResponse(product),
          message: "Product created successfully",
        });
      } catch (error) {
        next(error);
      }
    },

    getProductById: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "get_product_by_id");
      try {
        const product = await productService.getProductById(req.params.id, ctx);

        res.status(200).json({
          success: true,
          data: ProductMapper.toDetailResponse(product),
        });
      } catch (error) {
        next(error);
      }
    },

    getProductBySlug: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "get_product_by_slug");
      try {
        const product = await productService.getProductBySlug(
          req.params.slug,
          ctx,
        );

        res.status(200).json({
          success: true,
          data: ProductMapper.toDetailResponse(product),
        });
      } catch (error) {
        next(error);
      }
    },

    listProducts: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "list_products");
      try {
        const result = await productService.listProducts(req.query as any, ctx);

        res.status(200).json({
          success: true,
          data: result.items.map(ProductMapper.toDetailResponse),
          pagination: result.pagination,
        });
      } catch (error) {
        next(error);
      }
    },

    updateProduct: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "update_product");
      try {
        const product = await productService.updateProduct(
          req.params.id,
          req.body,
          ctx,
        );

        res.status(200).json({
          success: true,
          data: ProductMapper.toResponse(product),
          message: "Product updated successfully",
        });
      } catch (error) {
        next(error);
      }
    },

    softDeleteProduct: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "soft_delete_product");
      try {
        await productService.softDeleteProduct(req.params.id, ctx);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    hardDeleteProduct: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const ctx = createCtx(req, "hard_delete_product");
      try {
        await productService.hardDeleteProduct(req.params.id, ctx);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
};
