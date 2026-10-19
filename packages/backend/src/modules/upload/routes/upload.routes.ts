import express, { RequestHandler } from "express";
import { authorize } from "../../../shared/middlewares/authorization.middleware.js";
import { PERMISSIONS } from "@e-com/shared/authorization";

export const createUploadRouter = (
  uploadController: any,
  authenticate: RequestHandler,
): express.Router => {
  const router = express.Router();

  // All upload signing requests require authentication and products:create permission (Admin)
  router.use(authenticate);
  router.use(authorize(PERMISSIONS.PRODUCTS_CREATE));

  // Both POST and GET are supported for convenience
  router.post("/sign", uploadController.getUploadSignature);
  router.get("/sign", uploadController.getUploadSignature);

  return router;
};
