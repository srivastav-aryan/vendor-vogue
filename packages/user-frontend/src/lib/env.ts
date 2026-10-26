import { z } from "zod";

/**
 * Type-safe environment variable schema for Vendor Vogue user storefront.
 * Validates at runtime so misconfigurations fail fast with clear errors.
 */
const envSchema = z.object({
  // Browser-facing API endpoint
  NEXT_PUBLIC_API_URL: z
    .string()
    .url()
    .default("http://localhost:5000"),

  // Internal server-facing API endpoint (for Docker / internal network routing in SSR)
  API_INTERNAL_URL: z
    .string()
    .url()
    .default(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"),

  // Storefront origin URL
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

  // Razorpay Key ID for client checkout modal
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z
    .string()
    .default("rzp_test_placeholder"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_INTERNAL_URL: process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  NODE_ENV: process.env.NODE_ENV,
});
