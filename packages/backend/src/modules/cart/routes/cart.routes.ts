import { Router } from "express";
import { ICartController } from "../interfaces/cart.controller.interface.js";
import { validateReq } from "../../../shared/middlewares/validation.middleware.js";
import {
  addToCartSchema,
  cartVariantParamSchema,
  getCartQuerySchema,
  updateCartItemSchema,
} from "@e-com/shared/schemas";

export const createCartRouter = (
  cartController: ICartController,
  authenticateMiddleware: any,
): Router => {
  const router = Router();

  // All cart operations require authentication
  router.use(authenticateMiddleware);

  router.get("/", validateReq(getCartQuerySchema), cartController.getCart);
  router.post("/", validateReq(addToCartSchema), cartController.addItem);
  router.patch(
    "/:variantId",
    validateReq(updateCartItemSchema),
    cartController.updateQuantity,
  );
  router.delete(
    "/:variantId",
    validateReq(cartVariantParamSchema),
    cartController.removeItem,
  );

  return router;
};
