import { Request, Response, NextFunction } from "express";
import { IOrderService } from "../interfaces/order.service.interface.js";
import { IOrderController } from "../interfaces/order.controller.interface.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import { ApiError } from "../../../shared/utils/applevel.utils.js";
import { OrderStatus } from "../models/order.model.js";

export const orderControllerCreator = (
  orderService: IOrderService,
): IOrderController => {
  const getContext = (req: Request): RequestContext => ({
    logger: req.log?.child({ controller: "OrderController" }),
    deviceInfo: req.headers["user-agent"] || "unknown",
    ip: req.ip || "unknown",
    requestId: req.id,
  });

  return {
    async createCheckoutOrder(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required to checkout");
        }

        const { shippingAddress, couponCode, shippingFee, paymentMethod, items } = req.body;

        const order = await orderService.createCheckoutOrder(
          {
            userId: req.user._id.toString(),
            shippingAddress,
            couponCode,
            shippingFee: shippingFee ? Number(shippingFee) : 0,
            paymentMethod: paymentMethod === "COD" ? "COD" : "RAZORPAY",
            items: Array.isArray(items) ? items : undefined,
          },
          getContext(req),
        );

        res.status(201).json({
          success: true,
          data: order,
        });
      } catch (error) {
        next(error);
      }
    },

    async getOrderById(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required");
        }

        const { orderId } = req.params;
        const isAdmin = req.user.role === "ADMIN";

        const order = await orderService.getOrderById(
          orderId,
          isAdmin ? undefined : req.user._id.toString(),
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: order,
        });
      } catch (error) {
        next(error);
      }
    },

    async getUserOrders(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required");
        }

        const isAdmin = req.user.role === "ADMIN";
        const queryParams = req.query as any;

        const targetUserId = isAdmin
          ? (queryParams?.userId as string | undefined)
          : req.user._id.toString();

        const result = await orderService.getUserOrders(
          {
            userId: targetUserId,
            status: queryParams?.status,
            page: queryParams?.page,
            limit: queryParams?.limit,
          },
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: result.items,
          pagination: result.pagination,
        });
      } catch (error) {
        next(error);
      }
    },

    async cancelOrder(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required");
        }

        const { orderId } = req.params;
        const { reason = "Customer requested cancellation" } = req.body;
        const isAdmin = req.user.role === "ADMIN";

        const order = await orderService.cancelOrder(
          {
            orderId,
            reason,
            userId: isAdmin ? undefined : req.user._id.toString(),
          },
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: order,
        });
      } catch (error) {
        next(error);
      }
    },

    async updateOrderStatus(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required");
        }

        const { orderId } = req.params;
        const { status, reason } = req.body;

        if (!status) {
          throw new ApiError(400, "Target status is required");
        }

        const order = await orderService.transitionOrderStatus(
          {
            orderId,
            targetStatus: status as OrderStatus,
            reason,
          },
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: order,
        });
      } catch (error) {
        next(error);
      }
    },

    async verifyPayment(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required");
        }

        const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
          req.body;

        const order = await orderService.verifyPayment(
          {
            orderId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            userId: req.user._id.toString(),
          },
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: order,
        });
      } catch (error) {
        next(error);
      }
    },

    async handleRazorpayWebhook(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        const signature = req.headers["x-razorpay-signature"] as string;
        if (!signature) {
          throw new ApiError(400, "Missing x-razorpay-signature header");
        }

        const rawBody = req.rawBody || JSON.stringify(req.body);

        const result = await orderService.handleRazorpayWebhook(
          {
            rawBody,
            signature,
          },
          getContext(req),
        );

        res.status(200).json({
          status: "ok",
          ...result,
        });
      } catch (error) {
        next(error);
      }
    },
  };
};
