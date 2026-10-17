import { Router } from "express";
import { IOrderController } from "../interfaces/order.controller.interface.js";
import { validateReq } from "../../../shared/middlewares/validation.middleware.js";
import {
  cancelOrderSchema,
  createCheckoutOrderSchema,
  orderIdParamSchema,
  orderListQuerySchema,
  updateOrderStatusSchema,
  verifyPaymentSchema,
} from "@e-com/shared/schemas";

export const createOrderRouter = (
  orderController: IOrderController,
  authenticateMiddleware: any,
): Router => {
  const router = Router();

  // 1. Webhook endpoint (unauthenticated for users; authenticated cryptographically via Razorpay HMAC signature)
  router.post("/webhook/razorpay", orderController.handleRazorpayWebhook);

  // 2. All user operations require authentication
  router.use(authenticateMiddleware);

  router.post(
    "/checkout",
    validateReq(createCheckoutOrderSchema),
    orderController.createCheckoutOrder,
  );
  router.post(
    "/payment/verify",
    validateReq(verifyPaymentSchema),
    orderController.verifyPayment,
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
