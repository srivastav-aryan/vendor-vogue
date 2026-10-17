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

        const { shippingAddress, couponCode, shippingFee } = req.body;

        const order = await orderService.createCheckoutOrder(
          {
            userId: req.user._id.toString(),
            shippingAddress,
            couponCode,
            shippingFee: shippingFee ? Number(shippingFee) : 0,
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

        const orders = await orderService.getUserOrders(
          req.user._id.toString(),
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: orders,
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
  };
};
