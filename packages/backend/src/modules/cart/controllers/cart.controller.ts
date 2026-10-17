import { Request, Response, NextFunction } from "express";
import { ICartService } from "../interfaces/cart.service.interface.js";
import { ICartController } from "../interfaces/cart.controller.interface.js";
import { RequestContext } from "../../../shared/types/request-context.js";
import { ApiError } from "../../../shared/utils/applevel.utils.js";

export const cartControllerCreator = (
  cartService: ICartService,
): ICartController => {
  const getContext = (req: Request): RequestContext => ({
    logger: req.log?.child({ controller: "CartController" }),
    deviceInfo: req.headers["user-agent"] || "unknown",
    ip: req.ip || "unknown",
    requestId: req.id,
  });

  return {
    async getCart(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required to access cart");
        }

        const couponCode = req.query.coupon as string | undefined;
        const summary = await cartService.getCartSummary(
          req.user._id.toString(),
          couponCode,
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: summary,
        });
      } catch (error) {
        next(error);
      }
    },

    async addItem(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required to update cart");
        }

        const { variantId, quantity } = req.body;
        const couponCode = req.query.coupon as string | undefined;

        if (!variantId) {
          throw new ApiError(400, "variantId is required");
        }

        const parsedQuantity = Number(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
          throw new ApiError(400, "quantity must be a positive integer");
        }

        const summary = await cartService.addItem(
          {
            userId: req.user._id.toString(),
            variantId,
            quantity: parsedQuantity,
          },
          couponCode,
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: summary,
        });
      } catch (error) {
        next(error);
      }
    },

    async updateQuantity(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required to update cart");
        }

        const { variantId } = req.params;
        const { quantity } = req.body;
        const couponCode = req.query.coupon as string | undefined;

        if (!variantId) {
          throw new ApiError(400, "variantId parameter is required");
        }

        const parsedQuantity = Number(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity < 0) {
          throw new ApiError(400, "quantity must be non-negative");
        }

        const summary = await cartService.updateItemQuantity(
          {
            userId: req.user._id.toString(),
            variantId,
            quantity: parsedQuantity,
          },
          couponCode,
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: summary,
        });
      } catch (error) {
        next(error);
      }
    },

    async removeItem(
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> {
      try {
        if (!req.user?._id) {
          throw new ApiError(401, "Authentication required to update cart");
        }

        const { variantId } = req.params;
        const couponCode = req.query.coupon as string | undefined;

        if (!variantId) {
          throw new ApiError(400, "variantId parameter is required");
        }

        const summary = await cartService.removeItem(
          req.user._id.toString(),
          variantId,
          couponCode,
          getContext(req),
        );

        res.status(200).json({
          success: true,
          data: summary,
        });
      } catch (error) {
        next(error);
      }
    },
  };
};
