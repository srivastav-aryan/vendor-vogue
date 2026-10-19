import React from "react";
import { serverApiFetch } from "@/lib/server-api-client";
import { ProductList } from "@/components/catalog/product-list";

export const metadata = {
  title: "Products & Variants | Vendor Vogue Operations",
};

export default async function ProductsPage() {
  const productsRes = await serverApiFetch<any[]>("/api/catalog/products", {
    params: { limit: 100 },
    next: {
      tags: ["catalog-products"],
      revalidate: 60,
    },
  }).catch(() => ({ data: [] }));

  const initialProducts = Array.isArray(productsRes.data)
    ? productsRes.data
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

      <ProductList initialProducts={initialProducts} />
    </div>
  );
}
