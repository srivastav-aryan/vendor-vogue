import { RequestHandler } from "express";

export interface VariantControllerInterface {
  createVariant: RequestHandler;
  getVariantsByProductId: RequestHandler;
  getVariantById: RequestHandler;
  updateVariant: RequestHandler;
  deleteVariant: RequestHandler;
}
