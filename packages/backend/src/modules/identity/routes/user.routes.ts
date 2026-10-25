import { Router } from "express";
import { UserControllerInterface } from "../controllers/user.controller.js";
import { validateReq } from "../../../shared/middlewares/validation.middleware.js";
import {
  updateProfileSchema,
  updateAddressesSchema,
  addAddressSchema,
  addressIdParamSchema,
} from "@e-com/shared/schemas";

export const createUserRouter = (
  userController: UserControllerInterface,
  authenticateMiddleware: any,
): Router => {
  const router = Router();

  // All user profile and address operations require authentication
  router.use(authenticateMiddleware);

  // Profile endpoints
  router.get("/me", userController.getProfile);
  router.put("/me", validateReq(updateProfileSchema), userController.updateProfile);

  // Address endpoints
  router.put(
    "/me/addresses",
    validateReq(updateAddressesSchema),
    userController.updateAddresses,
  );
  router.post(
    "/me/addresses",
    validateReq(addAddressSchema),
    userController.addAddress,
  );
  router.delete(
    "/me/addresses/:addressId",
    validateReq(addressIdParamSchema),
    userController.deleteAddress,
  );

  return router;
};
