import { Router } from "express";
import { IOrderController } from "../interfaces/order.controller.interface.js";

export const createOrderRouter = (
  orderController: IOrderController,
  authenticateMiddleware: any,
): Router => {
  const router = Router();

  // All order operations require authentication
  router.use(authenticateMiddleware);

  router.post("/checkout", orderController.createCheckoutOrder);
  router.get("/", orderController.getUserOrders);
  router.get("/:orderId", orderController.getOrderById);
  router.post("/:orderId/cancel", orderController.cancelOrder);
  router.patch("/:orderId/status", orderController.updateOrderStatus);

  return router;
};
