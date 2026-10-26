import z from "zod";

export const userAddressSchema = z.object({
  id: z.string().optional(),
  _id: z.string().optional(),
  addressType: z.enum(["HOME", "OFFICE", "OTHER"]).default("HOME"),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9][0-9]{5}$/, "PIN code must be exactly 6 digits and cannot start with 0"),
  state: z.string().min(1, "State is required"),
  locality: z.string().min(1, "Locality is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required").default("India"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional().default(""),
  landmark: z.string().optional().default(""),
  phone: z
    .string()
    .trim()
    .regex(
      /^(?:(?:\+|0{0,2})91(\s*[- ]\s*)?)?[6789]\d{9}$/,
      "Phone must be a valid 10-digit Indian phone number (optionally with +91)"
    ),
  name: z.string().min(1, "Name is required"),
  isDefault: z.boolean().optional().default(false),
});

export type UserAddress = z.infer<typeof userAddressSchema>;

export const updateAddressesSchema = z.object({
  body: z.object({
    addresses: z.array(userAddressSchema),
  }),
});

export const addAddressSchema = z.object({
  body: userAddressSchema,
});

export const addressIdParamSchema = z.object({
  params: z.object({
    addressId: z.string().min(1, "Address ID is required"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstname: z.string().min(1, "Firstname must not be empty").optional(),
    lastname: z.string().min(1, "Lastname must not be empty").optional(),
    phone: z
      .string()
      .regex(/^[0-9]{10,15}$/, "Invalid phone number format (10-15 digits expected)")
      .optional(),
  }),
});

export type UpdateAddressesInput = z.infer<typeof updateAddressesSchema>["body"];
export type AddAddressInput = z.infer<typeof addAddressSchema>["body"];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
