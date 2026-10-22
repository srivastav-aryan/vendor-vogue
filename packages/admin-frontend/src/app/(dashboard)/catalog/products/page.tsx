import React from "react";
import { serverApiFetch } from "@/lib/server-api-client";
import { BrandResponse, CategoryResponse } from "@e-com/shared/types";
import { ProductList } from "@/components/catalog/product-list";

export const metadata = {
  title: "Products & Variants | Vendor Vogue Operations",
};

export default async function ProductsPage() {
  const [productsRes, brandsRes, categoriesRes] = await Promise.all([
    serverApiFetch<any[]>("/api/catalog/products", {
      params: { limit: 100, isActive: "all" },
      next: {
        tags: ["catalog-products"],
        revalidate: 60,
      },
    }).catch(() => ({ data: [] })),

    serverApiFetch<BrandResponse[]>("/api/catalog/brands", {
      params: { limit: 100, isActive: "all" },
      next: { tags: ["catalog-brands"] },
    }).catch(() => ({ data: [] as BrandResponse[] })),

    serverApiFetch<any>("/api/catalog/categories", {
      params: { limit: 100 },
      next: { tags: ["catalog-categories"] },
    }).catch(() => ({ data: { items: [] } })),
  ]);

  const initialProducts = Array.isArray(productsRes.data)
    ? productsRes.data
    : [];

  const brands = Array.isArray(brandsRes.data) ? brandsRes.data : [];

  const rawCatData: any = categoriesRes.data;
  const categories: CategoryResponse[] = Array.isArray(rawCatData)
    ? rawCatData
    : Array.isArray(rawCatData?.items)
    ? rawCatData.items
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Apparel Products & SKUs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Catalog products with HSN chapter codes, GST tax tiers, and multi-size variant matrices.
        </p>
      </div>

      <ProductList
        initialProducts={initialProducts}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
