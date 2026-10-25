import "server-only";

import { env } from "@/lib/env";
import type { BrandResponse, PaginationMeta } from "@e-com/shared/types";

export interface BrandsApiResponse {
  success: boolean;
  data: BrandResponse[];
  pagination?: PaginationMeta;
}

export const FALLBACK_BRANDS: BrandResponse[] = [
  {
    id: "brand-vendor-vogue",
    name: "Vendor Vogue Studio",
    slug: "vendor-vogue-studio",
    description: "In-house curated streetwear and architectural tailoring.",
    logo: null,
    isActive: true,
    createdAt: "2026-10-25T10:00:00.000Z",
    updatedAt: "2026-10-25T10:00:00.000Z",
  },
  {
    id: "brand-zara-studio",
    name: "Zara Studio",
    slug: "zara-studio",
    description: "Contemporary European trendsetting apparel and silhouettes.",
    logo: null,
    isActive: true,
    createdAt: "2026-10-25T10:00:00.000Z",
    updatedAt: "2026-10-25T10:00:00.000Z",
  },
  {
    id: "brand-levi-strauss",
    name: "Levi Strauss & Co",
    slug: "levi-strauss",
    description: "Authentic denim jeans, trucker jackets, and timeless heritage.",
    logo: null,
    isActive: true,
    createdAt: "2026-10-25T10:00:00.000Z",
    updatedAt: "2026-10-25T10:00:00.000Z",
  },
  {
    id: "brand-fabindia",
    name: "FabIndia Heritage",
    slug: "fabindia-heritage",
    description: "Handcrafted Indian ethnic wear and handloom weaves.",
    logo: null,
    isActive: true,
    createdAt: "2026-10-25T10:00:00.000Z",
    updatedAt: "2026-10-25T10:00:00.000Z",
  },
  {
    id: "brand-allen-solly",
    name: "Allen Solly",
    slug: "allen-solly",
    description: "Smart casual apparel and modern Friday dressing.",
    logo: null,
    isActive: true,
    createdAt: "2026-10-25T10:00:00.000Z",
    updatedAt: "2026-10-25T10:00:00.000Z",
  },
  {
    id: "brand-raymond",
    name: "Raymond Complete Man",
    slug: "raymond-complete-man",
    description: "Finest worsted suiting and tailored formal blazers.",
    logo: null,
    isActive: true,
    createdAt: "2026-10-25T10:00:00.000Z",
    updatedAt: "2026-10-25T10:00:00.000Z",
  },
];

/**
 * Server-side data fetcher for Brands.
 * Calls backend GET /api/catalog/brands with ISR caching.
 */
export async function getStorefrontBrands(): Promise<BrandResponse[]> {
  try {
    const endpoint = `${env.API_INTERNAL_URL}/api/catalog/brands?limit=30&isActive=true`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: {
        revalidate: 300,
        tags: ["brands"],
      },
    }).finally(() => clearTimeout(timer));

    if (!res.ok) {
      console.warn(
        `[Brands API] Backend endpoint ${endpoint} returned status ${res.status}. Using fallback brands.`
      );
      return FALLBACK_BRANDS;
    }

    const payload: BrandsApiResponse = await res.json();
    if (!payload.success || !Array.isArray(payload.data) || payload.data.length === 0) {
      return FALLBACK_BRANDS;
    }

    return payload.data;
  } catch (error) {
    console.warn(
      "[Brands API] Backend unreachable. Using resilient fallback brands.",
      error instanceof Error ? error.message : error
    );
    return FALLBACK_BRANDS;
  }
}
