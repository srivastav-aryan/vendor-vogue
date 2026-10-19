"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProductResponse } from "@e-com/shared/types";
import { formatDateTime } from "@/lib/utils";
import { Search, Plus, Shirt, CheckCircle2, XCircle, IndianRupee } from "lucide-react";

interface ProductListProps {
  initialProducts: any[];
}

export function ProductList({ initialProducts }: ProductListProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const name = (p.name || "").toLowerCase();
    const slug = (p.slug || "").toLowerCase();
    const hsn = (p.hsnCode || "").toLowerCase();
    return name.includes(q) || slug.includes(q) || hsn.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, slug, or HSN code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
          />
        </div>

        <Link
          href="/catalog/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Apparel Product
        </Link>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Product</th>
                <th className="py-3.5 px-6">Classification</th>
                <th className="py-3.5 px-6">HSN Code</th>
                <th className="py-3.5 px-6">GST Tier</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Shirt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No products found. Click "Create Apparel Product" to add one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImage =
                    Array.isArray(p.images) && p.images.length > 0
                      ? p.images[0]
                      : null;

                  return (
                    <tr key={p.id || p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {primaryImage ? (
                            <img
                              src={primaryImage}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
                              <Shirt className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate">
                              {p.name}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 block truncate">
                              {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600">
                        <div>
                          <span className="font-medium text-slate-900">
                            {p.brand?.name || (typeof p.brand === "string" ? p.brand : "Brand")}
                          </span>
                          <span className="text-slate-400 block">
                            {p.category?.name || (typeof p.category === "string" ? p.category : "Category")}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.hsnCode || "620520"}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.gstRate || 5}% GST
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {p.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-400">
                        {formatDateTime(p.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
