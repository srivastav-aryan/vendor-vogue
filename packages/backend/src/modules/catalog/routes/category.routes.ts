import { PERMISSIONS } from "@e-com/shared/authorization";
import { authorize } from "../../../shared/middlewares/authorization.middleware.js";
import { ICategoryControllerInterface } from "../interfaces/category.controller.interface.js";

import {
  categoryListNodeQuerySchema,
  categoryListQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from "@e-com/shared/schemas";
import express, { RequestHandler } from "express";
import { validateReq } from "../../../shared/middlewares/validation.middleware.js";

export const createCategoryRouter = (
  categoryController: ICategoryControllerInterface,
  authenticate: RequestHandler,
) => {
  const categoryRouter = express.Router();

  // POST /api/catalog/categories - Create category
  categoryRouter.post(
    "/",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_CREATE),
    validateReq(createCategorySchema),
    categoryController.createCategory,
  );

  // GET /api/catalog/categories/storefront - Storefront / Navigation tree
  categoryRouter.get("/storefront", categoryController.getAllCategoryTree);

  // GET /api/catalog/categories - Admin Tabular List View (paginated, filtered)
  categoryRouter.get(
    "/",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_READ),
    validateReq(categoryListQuerySchema),
    categoryController.getCategoryTable,
  );

  // GET /api/catalog/categories/tree - Admin Hierarchical Tree View
  categoryRouter.get(
    "/tree",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_READ),
    validateReq(categoryListQuerySchema),
    categoryController.getCategoryTree,
  );

  // GET /api/catalog/categories/treenode/:id - Admin single tree node detailed View
  categoryRouter.get(
    "/treenode/:id",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_READ),
    validateReq(categoryListNodeQuerySchema),
    categoryController.getCategoryDetail,
  );

  // GET /api/catalog/categories/:id - Get category by ID
  categoryRouter.get(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_READ),
    validateReq(categoryListNodeQuerySchema),
    categoryController.getCategoryDetail,
  );

  // PATCH /api/catalog/categories/:id - Update category
  categoryRouter.patch(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_UPDATE),
    validateReq(updateCategorySchema),
    categoryController.updateCategory,
  );

  // DELETE /api/catalog/categories/:id - Delete category
  categoryRouter.delete(
    "/:id",
    authenticate,
    authorize(PERMISSIONS.CATEGORIES_DELETE),
    validateReq(categoryListNodeQuerySchema),
    categoryController.deleteCategory,
  );

  return categoryRouter;
};
