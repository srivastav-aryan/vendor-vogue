import { Router } from "express";
import { IOrderController } from "../interfaces/order.controller.interface.js";
import { validateReq } from "../../../shared/middlewares/validation.middleware.js";
import {
  cancelOrderSchema,
  createCheckoutOrderSchema,
  orderIdParamSchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
} from "@e-com/shared/schemas";

export const createOrderRouter = (
  orderController: IOrderController,
  authenticateMiddleware: any,
): Router => {
  const router = Router();

  // All order operations require authentication
  router.use(authenticateMiddleware);

  router.post(
    "/checkout",
    validateReq(createCheckoutOrderSchema),
    orderController.createCheckoutOrder,
  );
  router.get("/", validateReq(orderListQuerySchema), orderController.getUserOrders);
  router.get(
    "/:orderId",
    validateReq(orderIdParamSchema),
    orderController.getOrderById,
  );
  router.post(
    "/:orderId/cancel",
    validateReq(cancelOrderSchema),
    orderController.cancelOrder,
  );
  router.patch(
    "/:orderId/status",
    validateReq(updateOrderStatusSchema),
    orderController.updateOrderStatus,
  );

  return router;
};
