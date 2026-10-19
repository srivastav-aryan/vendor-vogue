import React from "react";
import { serverApiFetch } from "@/lib/server-api-client";
import { BrandResponse, CategoryResponse } from "@e-com/shared/types";
import { ProductForm } from "@/components/catalog/product-form";

export const metadata = {
  title: "New Apparel Product | Vendor Vogue Operations",
};

export const revalidate = 0;

export default async function NewProductPage() {
  // Parallel zero-waterfall server fetch for dropdown dependencies
  const [brandsRes, categoriesRes] = await Promise.all([
    serverApiFetch<BrandResponse[]>("/api/catalog/brands", {
      params: { limit: 100 },
      next: { tags: ["catalog-brands"] },
    }).catch(() => ({ data: [] as BrandResponse[] })),
    serverApiFetch<any>("/api/catalog/categories", {
      params: { limit: 100 },
      next: { tags: ["catalog-categories"] },
    }).catch(() => ({ data: { items: [] } })),
  ]);

  const brands = Array.isArray(brandsRes.data) ? brandsRes.data : [];
  const rawCatData: any = categoriesRes.data;
  const categories: CategoryResponse[] = Array.isArray(rawCatData)
    ? rawCatData
    : Array.isArray(rawCatData?.items)
    ? rawCatData.items
    : [];

  return <ProductForm brands={brands} categories={categories} />;
}
