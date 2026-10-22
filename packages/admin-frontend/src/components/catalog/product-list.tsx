"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BrandResponse, CategoryResponse } from "@e-com/shared/types";
import { getOptimizedImageUrl } from "@e-com/shared/utils";
import { formatDateTime } from "@/lib/utils";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateProductsAction } from "@/app/actions/catalog-actions";
import { ProductDetailModal } from "./product-detail-modal";
import { EditProductModal } from "./edit-product-modal";
import { DeleteProductModal } from "./delete-product-modal";
import { AddVariantModal } from "./add-variant-modal";
import {
  Search,
  Plus,
  Shirt,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  Power,
  Loader2,
  RefreshCw,
  Layers,
} from "lucide-react";

interface ProductListProps {
  initialProducts: any[];
  brands?: BrandResponse[];
  categories?: CategoryResponse[];
}

export function ProductList({
  initialProducts,
  brands = [],
  categories = [],
}: ProductListProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  // Modals state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<any | null>(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<any | null>(null);
  const [selectedProductForDelete, setSelectedProductForDelete] = useState<any | null>(null);
  const [selectedProductIdForVariant, setSelectedProductIdForVariant] = useState<string | null>(null);
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);

  const fetchProducts = async () => {
    setIsRefreshing(true);
    try {
      const res = await clientApiFetch<any>("/api/catalog/products", {
        params: { limit: 100, isActive: "all" },
      });
      const items = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];
      setProducts(items);
    } catch (err) {
      console.error("Failed to refresh products:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductUpdated = (updatedProduct: any) => {
    setProducts((prev) =>
      prev.map((p) =>
        (p.id || p._id) === (updatedProduct.id || updatedProduct._id)
          ? { ...p, ...updatedProduct }
          : p
      )
    );
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => (p.id || p._id) !== deletedId));
  };

  const handleToggleStatus = async (product: any) => {
    const pId = product.id || product._id;
    setTogglingProductId(pId);
    const targetStatus = product.isActive === false;

    try {
      if (targetStatus) {
        const res = await clientApiFetch<any>(`/api/catalog/products/${pId}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        });
        handleProductUpdated(res.data);
      } else {
        await clientApiFetch(`/api/catalog/products/${pId}/deactivate`, {
          method: "PATCH",
        });
        handleProductUpdated({ ...product, isActive: false });
      }
      await revalidateProductsAction();
    } catch (err: any) {
      alert(err.message || "Failed to update product status.");
    } finally {
      setTogglingProductId(null);
    }
  };

  const activeCount = products.filter((p) => p.isActive !== false).length;
  const inactiveCount = products.filter((p) => p.isActive === false).length;

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const name = (p.name || "").toLowerCase();
    const slug = (p.slug || "").toLowerCase();
    const hsn = (p.hsnCode || "").toLowerCase();
    const brandName = (p.brand?.name || "").toLowerCase();
    const catName = (p.category?.name || "").toLowerCase();

    const matchesSearch =
      name.includes(q) ||
      slug.includes(q) ||
      hsn.includes(q) ||
      brandName.includes(q) ||
      catName.includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === "active") return p.isActive !== false;
    if (statusFilter === "inactive") return p.isActive === false;
    return true;
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
            placeholder="Search by title, slug, brand, or HSN code..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchProducts}
            disabled={isRefreshing}
            title="Refresh product list"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl shadow-sm transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`}
            />
          </button>

          <Link
            href="/catalog/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Apparel Product
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Products ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === "active"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("inactive")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            statusFilter === "inactive"
              ? "bg-slate-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Inactive ({inactiveCount})
        </button>
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
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Shirt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No products found. Click "Create Apparel Product" to add one.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const pId = p.id || p._id;
                  const primaryImage =
                    Array.isArray(p.images) && p.images.length > 0
                      ? p.images[0]
                      : null;

                  return (
                    <tr key={pId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Title & Thumbnail */}
                      <td className="py-4 px-6">
                        <div
                          onClick={() => setSelectedProductForDetail(pId)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          {primaryImage ? (
                            <img
                              src={getOptimizedImageUrl(primaryImage, {
                                width: 100,
                                height: 100,
                                crop: "fill",
                              })}
                              alt={p.name}
                              className="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200 group-hover:border-slate-300 transition-colors shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0 group-hover:border-emerald-300 transition-colors">
                              <Shirt className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block truncate group-hover:text-emerald-700 transition-colors">
                              {p.name}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 block truncate">
                              {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Brand & Category */}
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <div>
                          <span className="font-medium text-slate-900 block">
                            {p.brand?.name || (typeof p.brand === "string" ? p.brand : "Brand")}
                          </span>
                          <span className="text-slate-400 block">
                            {p.category?.name ||
                              (typeof p.category === "string" ? p.category : "Category")}
                          </span>
                        </div>
                      </td>

                      {/* HSN Code */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.hsnCode || "620520"}
                        </span>
                      </td>

                      {/* GST Tier */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {p.gstRate || 5}% GST
                        </span>
                      </td>

                      {/* Status */}
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

                      {/* Created */}
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {formatDateTime(p.createdAt)}
                      </td>

                      {/* Row Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect / View */}
                          <button
                            type="button"
                            onClick={() => setSelectedProductForDetail(pId)}
                            title="Inspect Details & SKUs"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => setSelectedProductForEdit(p)}
                            title="Edit Product"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Quick Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p)}
                            disabled={togglingProductId === pId}
                            title={p.isActive !== false ? "Deactivate Product" : "Activate Product"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              p.isActive !== false
                                ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {togglingProductId === pId ? (
                              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setSelectedProductForDelete(p)}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail & Variant Inspector Modal */}
      <ProductDetailModal
        key={selectedProductForDetail ? `${selectedProductForDetail}-${detailRefreshKey}` : "none"}
        isOpen={Boolean(selectedProductForDetail)}
        productId={selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        onEdit={(prod) => setSelectedProductForEdit(prod)}
        onDelete={(prod) => setSelectedProductForDelete(prod)}
        onAddVariant={(id) => setSelectedProductIdForVariant(id)}
        onProductUpdated={handleProductUpdated}
      />

      {/* Product Edit Modal */}
      <EditProductModal
        isOpen={Boolean(selectedProductForEdit)}
        product={selectedProductForEdit}
        brands={brands}
        categories={categories}
        onClose={() => setSelectedProductForEdit(null)}
        onProductUpdated={handleProductUpdated}
      />

      {/* Product Delete Modal */}
      <DeleteProductModal
        isOpen={Boolean(selectedProductForDelete)}
        product={selectedProductForDelete}
        onClose={() => setSelectedProductForDelete(null)}
        onProductDeleted={handleProductDeleted}
        onProductUpdated={handleProductUpdated}
      />

      {/* Add Variant Modal */}
      <AddVariantModal
        isOpen={Boolean(selectedProductIdForVariant)}
        productId={selectedProductIdForVariant}
        onClose={() => setSelectedProductIdForVariant(null)}
        onVariantAdded={() => {
          setDetailRefreshKey((k) => k + 1);
          fetchProducts();
        }}
      />
    </div>
  );
}
