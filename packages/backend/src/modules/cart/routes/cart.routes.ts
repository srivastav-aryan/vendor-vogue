import { Router } from "express";
import { ICartController } from "../interfaces/cart.controller.interface.js";

export const createCartRouter = (
  cartController: ICartController,
  authenticateMiddleware: any,
): Router => {
  const router = Router();

  // All cart operations require authentication
  router.use(authenticateMiddleware);

  router.get("/", cartController.getCart);
  router.post("/", cartController.addItem);
  router.patch("/:variantId", cartController.updateQuantity);
  router.delete("/:variantId", cartController.removeItem);

  return router;
};
