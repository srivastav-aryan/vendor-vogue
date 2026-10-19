import React from "react";
import { serverApiFetch } from "@/lib/server-api-client";
import { CategoryResponse } from "@e-com/shared/types";
import { CategoryList } from "@/components/catalog/category-list";

export const metadata = {
  title: "Category Registry | Vendor Vogue Operations",
};

export const revalidate = 0;

export default async function CategoriesPage() {
  const categoriesRes = await serverApiFetch<any>(
    "/api/catalog/categories",
    {
      params: { limit: 100 },
      next: {
        tags: ["catalog-categories"],
      },
    }
  ).catch(() => ({ data: { items: [] } }));

  const rawData: any = categoriesRes.data;
  const initialCategories: CategoryResponse[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.items)
    ? rawData.items
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Taxonomy Categories
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Organize apparel hierarchies, parent-child relationships, and active storefront visibility.
        </p>
      </div>

      <CategoryList initialCategories={initialCategories} />
    </div>
  );
}
