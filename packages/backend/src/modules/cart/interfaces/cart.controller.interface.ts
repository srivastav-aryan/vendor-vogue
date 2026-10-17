import { Request, Response, NextFunction } from "express";

export interface ICartController {
  getCart(req: Request, res: Response, next: NextFunction): Promise<void>;
  addItem(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateQuantity(req: Request, res: Response, next: NextFunction): Promise<void>;
  removeItem(req: Request, res: Response, next: NextFunction): Promise<void>;
}
