import dotenv from "dotenv";

import { z } from "zod";

dotenv.config({ quiet: true });

const processEnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "testing"])
    .default("development"),
  MONGODB_CONNECTION_STRING: z.string().min(1, "MongoDB uri is required"),
  ACCESS_TOKEN_SECRET: z.string().min(1, "access token is required"),
  ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z.string().min(1, "refresh token is needed"),
  REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
  LOGIN_WINDOW_MS: z.string().default("10000"),
  LOGIN_MAX_ATTEMPTS: z.string().default("5"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  RAZORPAY_KEY_ID: z.string().default("rzp_test_placeholder"),
  RAZORPAY_KEY_SECRET: z.string().default("rzp_secret_placeholder"),
  RAZORPAY_WEBHOOK_SECRET: z.string().default("rzp_webhook_secret_placeholder"),
  CLOUDINARY_CLOUD_NAME: z
    .string()
    .transform((v) => v.replace(/["']/g, "").trim())
    .default("vendor-vogue-placeholder"),
  CLOUDINARY_API_KEY: z
    .string()
    .transform((v) => v.replace(/["']/g, "").trim())
    .default("placeholder_api_key"),
  CLOUDINARY_API_SECRET: z
    .string()
    .transform((v) => v.replace(/["']/g, "").trim())
    .default("placeholder_api_secret"),
  CLOUDINARY_UPLOAD_FOLDER: z
    .string()
    .transform((v) => v.replace(/["']/g, "").trim())
    .default("vendor-vogue/products"),
});

const result = processEnvSchema.safeParse(process.env);

if (!result.success) {
  const formattedErrors = result.error.flatten();
  console.log(formattedErrors.fieldErrors);
  process.exit(1);
}

export const env = result.data;
