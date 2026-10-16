import type { Request, Response, NextFunction } from "express";

export interface ProductControllerInterface {
  createProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
  listProducts(req: Request, res: Response, next: NextFunction): Promise<void>;
  getProductById(req: Request, res: Response, next: NextFunction): Promise<void>;
  getProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void>;
  getProductWithVariantsBySlug(req: Request, res: Response, next: NextFunction): Promise<void>;
  getProductWithVariantsById(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
  softDeleteProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
  hardDeleteProduct(req: Request, res: Response, next: NextFunction): Promise<void>;
}
