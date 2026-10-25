import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { ApiError } from "../../../shared/utils/applevel.utils.js";
import { RequestContext } from "../../../shared/types/request-context.js";

const createCtx = (req: Request, route: string): RequestContext => ({
  logger: req.log?.child({ route }),
  deviceInfo: (req.headers["user-agent"] as string) || "unknown",
  ip: req.ip || "unknown",
  requestId: req.id,
});

export interface UserControllerInterface {
  getProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  updateAddresses: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  addAddress: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  deleteAddress: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

export const userControllerCreator = (): UserControllerInterface => {
  return {
    /**
     * GET /api/users/me
     * Fetches current authenticated user's profile with saved addresses.
     */
    getProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const ctx = createCtx(req, "get_user_profile");
      try {
        const userId = req.user?._id;
        if (!userId) {
          throw new ApiError(401, "Authentication required");
        }

        const user = await User.findById(userId).select("-password");
        if (!user) {
          throw new ApiError(404, "User profile not found");
        }

        ctx.logger?.info({ userId: user._id }, "Fetched authenticated user profile");

        res.status(200).json({
          success: true,
          data: {
            id: user._id.toString(),
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phone ?? null,
            role: user.role,
            permissions: user.permissions,
            addresses: user.addresses ?? [],
            isEmailVerified: user.isEmailVerified ?? false,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * PUT /api/users/me
     * Updates basic profile info (firstname, lastname, phone).
     */
    updateProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const ctx = createCtx(req, "update_user_profile");
      try {
        const userId = req.user?._id;
        if (!userId) {
          throw new ApiError(401, "Authentication required");
        }

        const { firstname, lastname, phone } = req.body;

        const user = await User.findById(userId);
        if (!user) {
          throw new ApiError(404, "User not found");
        }

        if (firstname !== undefined) user.firstname = firstname.trim();
        if (lastname !== undefined) user.lastname = lastname.trim();
        if (phone !== undefined) user.phone = phone.trim();

        await user.save();

        ctx.logger?.info({ userId: user._id }, "Updated user profile info");

        res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          data: {
            id: user._id.toString(),
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            phone: user.phone ?? null,
            role: user.role,
            addresses: user.addresses ?? [],
          },
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * PUT /api/users/me/addresses
     * Replaces or bulk updates shipping addresses.
     */
    updateAddresses: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const ctx = createCtx(req, "update_user_addresses");
      try {
        const userId = req.user?._id;
        if (!userId) {
          throw new ApiError(401, "Authentication required");
        }

        const { addresses } = req.body;
        if (!Array.isArray(addresses)) {
          throw new ApiError(400, "Addresses array is required");
        }

        const user = await User.findById(userId);
        if (!user) {
          throw new ApiError(404, "User not found");
        }

        // Replace complete addresses array
        user.addresses = addresses as any;
        await user.save();

        ctx.logger?.info({ userId: user._id, count: addresses.length }, "Synced user address book");

        res.status(200).json({
          success: true,
          message: "Addresses updated successfully",
          data: user.addresses,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * POST /api/users/me/addresses
     * Adds a single new shipping address.
     */
    addAddress: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const ctx = createCtx(req, "add_user_address");
      try {
        const userId = req.user?._id;
        if (!userId) {
          throw new ApiError(401, "Authentication required");
        }

        const newAddress = req.body;

        const user = await User.findById(userId);
        if (!user) {
          throw new ApiError(404, "User not found");
        }

        if (!user.addresses) {
          user.addresses = [];
        }

        // If new address is marked as default, remove default flag from existing
        if (newAddress.isDefault) {
          user.addresses.forEach((addr: any) => {
            addr.isDefault = false;
          });
        } else if (user.addresses.length === 0) {
          // If first address, automatically make it default
          newAddress.isDefault = true;
        }

        user.addresses.push(newAddress);
        await user.save();

        ctx.logger?.info({ userId: user._id }, "Added new shipping address");

        res.status(201).json({
          success: true,
          message: "Address added successfully",
          data: user.addresses,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * DELETE /api/users/me/addresses/:addressId
     * Deletes an address by its subdocument ID.
     */
    deleteAddress: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const ctx = createCtx(req, "delete_user_address");
      try {
        const userId = req.user?._id;
        if (!userId) {
          throw new ApiError(401, "Authentication required");
        }

        const { addressId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
          throw new ApiError(404, "User not found");
        }

        const initialCount = user.addresses?.length ?? 0;
        user.addresses = (user.addresses || []).filter(
          (addr: any) => addr._id?.toString() !== addressId && addr.id?.toString() !== addressId
        );

        if (user.addresses.length === initialCount) {
          throw new ApiError(404, "Address not found");
        }

        await user.save();

        ctx.logger?.info({ userId: user._id, addressId }, "Removed shipping address");

        res.status(200).json({
          success: true,
          message: "Address removed successfully",
          data: user.addresses,
        });
      } catch (error) {
        next(error);
      }
    },
  };
};
