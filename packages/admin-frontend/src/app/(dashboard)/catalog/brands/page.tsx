import React from "react";
import { serverApiFetch } from "@/lib/server-api-client";
import { BrandResponse } from "@e-com/shared/types";
import { BrandList } from "@/components/catalog/brand-list";

export const metadata = {
  title: "Brand Registry | Vendor Vogue Operations",
};

export default async function BrandsPage() {
  // Server-side data fetching with Next.js Tag-based caching
  const brandsRes = await serverApiFetch<BrandResponse[]>("/api/catalog/brands", {
    params: { limit: 100, isActive: "all" },
    next: {
      tags: ["catalog-brands"],
      revalidate: 60, // revalidate in background every 60s or on-demand via revalidateTag
    },
  }).catch(() => ({ data: [] as BrandResponse[] }));

  const initialBrands = Array.isArray(brandsRes.data) ? brandsRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Brand Registry
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage apparel labels, logos, and manufacturer profiles for Vendor Vogue.
        </p>
      </div>

      <BrandList initialBrands={initialBrands} />
    </div>
  );
}
