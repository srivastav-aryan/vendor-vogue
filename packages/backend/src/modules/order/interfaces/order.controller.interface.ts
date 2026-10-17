import { Request, Response, NextFunction } from "express";

export interface IOrderController {
  createCheckoutOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  getOrderById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  getUserOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  cancelOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  verifyPayment(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
  handleRazorpayWebhook(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void>;
}
