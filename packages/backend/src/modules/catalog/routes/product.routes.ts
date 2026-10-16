import express, { RequestHandler } from "express";
import { validateReq } from "../../../shared/middlewares/validation.middleware.js";
import { authorize } from "../../../shared/middlewares/authorization.middleware.js";
import { PERMISSIONS } from "@e-com/shared/authorization";
import {
  createProductSchema,
  updateProductSchema,
  productListQuerySchema,
  productIdParamSchema,
  productSlugParamSchema,
} from "@e-com/shared/schemas";
import { ProductControllerInterface } from "../interfaces/product.controller.interface.js";

export const createProductRouter = (
  productController: ProductControllerInterface,
  authenticate: RequestHandler,
) => {
  const productRouter = express.Router();

  // ---- Public routes (no auth required) ----

  // GET /api/catalog/products — List products (paginated, filterable)
  productRouter.get(
    "/",
    validateReq(productListQuerySchema),
    productController.listProducts,
  );

  // GET /api/catalog/products/slug/:slug — Get product by slug (storefront detail)
  productRouter.get(
    "/slug/:slug",
    validateReq(productSlugParamSchema),
    productController.getProductBySlug,
  );

  // GET /api/catalog/products/:id — Get product by ID
  productRouter.get(
    "/:id",
    validateReq(productIdParamSchema),
    productController.getProductById,
  );

  // ---- Protected routes (auth + permission required) ----

  // POST /api/catalog/products — Create a new product
  productRouter.post(
    "/",
    authenticate,
    authorize(PERMISSIONS.PRODUCTS_CREATE),
    validateReq(createProductSchema),
    productController.createProduct,
  );

  // PATCH /api/catalog/products/:id — Partial update
  productRouter.patch(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.PRODUCTS_UPDATE),
    validateReq(updateProductSchema),
    productController.updateProduct,
  );

  // PATCH /api/catalog/products/:id/deactivate — Soft delete
  productRouter.patch(
    "/:id/deactivate",
    authenticate,
    authorize(PERMISSIONS.PRODUCTS_DELETE),
    validateReq(productIdParamSchema),
    productController.softDeleteProduct,
  );

  // DELETE /api/catalog/products/:id — Hard delete (only if no variants reference it)
  productRouter.delete(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.PRODUCTS_DELETE),
    validateReq(productIdParamSchema),
    productController.hardDeleteProduct,
  );

  return productRouter;
};
