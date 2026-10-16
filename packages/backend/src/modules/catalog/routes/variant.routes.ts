import express, { RequestHandler } from "express";
import { validateReq } from "../../../shared/middlewares/validation.middleware.js";
import { authorize } from "../../../shared/middlewares/authorization.middleware.js";
import { PERMISSIONS } from "@e-com/shared/authorization";
import {
  updateProductVariantSchema,
  variantIdParamSchema,
} from "@e-com/shared/schemas";
import { VariantControllerInterface } from "../interfaces/variant.controller.interface.js";

export const createVariantRouter = (
  variantController: VariantControllerInterface,
  authenticate: RequestHandler,
) => {
  const variantRouter = express.Router();

  // GET /api/catalog/variants/:id — Get variant by ID
  variantRouter.get(
    "/:id",
    validateReq(variantIdParamSchema),
    variantController.getVariantById,
  );

  // PATCH /api/catalog/variants/:id — Update variant prices, attributes, images, etc.
  variantRouter.patch(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.PRODUCTS_UPDATE),
    validateReq(updateProductVariantSchema),
    variantController.updateVariant,
  );

  // DELETE /api/catalog/variants/:id — Soft delete variant
  variantRouter.delete(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.PRODUCTS_DELETE),
    validateReq(variantIdParamSchema),
    variantController.deleteVariant,
  );

  return variantRouter;
};
