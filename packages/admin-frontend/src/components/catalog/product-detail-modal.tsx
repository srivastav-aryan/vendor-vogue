"use client";

import React, { useState, useEffect } from "react";
import { clientApiFetch } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { getOptimizedImageUrl } from "@e-com/shared/utils";
import {
  X,
  Shirt,
  Tag,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Layers,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Power,
  Plus,
  Loader2,
  PackageCheck,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";

interface ProductDetailModalProps {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  onAddVariant: (productId: string) => void;
  onProductUpdated: (updatedProduct: any) => void;
}

export function ProductDetailModal({
  isOpen,
  productId,
  onClose,
  onEdit,
  onDelete,
  onAddVariant,
  onProductUpdated,
}: ProductDetailModalProps) {
  const [data, setData] = useState<{ product: any; variants: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [togglingVariantId, setTogglingVariantId] = useState<string | null>(null);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await clientApiFetch<{ product: any; variants: any[] }>(
        `/api/catalog/products/${id}/storefront`
      );
      setData(res.data);
      setActiveImageIndex(0);
    } catch (err: any) {
      setError(err.message || "Failed to load product details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && productId) {
      fetchDetail(productId);
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, productId]);

  if (!isOpen || !productId) return null;

  const product = data?.product;
  const variants = data?.variants || [];
  const images: string[] = Array.isArray(product?.images) ? product.images : [];

  const copySlug = () => {
    if (!product?.slug) return;
    navigator.clipboard.writeText(product.slug);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  const handleToggleProductStatus = async () => {
    if (!product) return;
    const targetStatus = !product.isActive;
    try {
      if (targetStatus) {
        const res = await clientApiFetch<any>(`/api/catalog/products/${product.id || product._id}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        });
        setData((prev) => (prev ? { ...prev, product: { ...prev.product, isActive: true } } : null));
        onProductUpdated(res.data);
      } else {
        await clientApiFetch(`/api/catalog/products/${product.id || product._id}/deactivate`, {
          method: "PATCH",
        });
        setData((prev) => (prev ? { ...prev, product: { ...prev.product, isActive: false } } : null));
        onProductUpdated({ ...product, isActive: false });
      }
    } catch (err: any) {
      alert(err.message || "Failed to update product status.");
    }
  };

  const handleToggleVariantStatus = async (variant: any) => {
    setTogglingVariantId(variant.id || variant._id);
    try {
      const variantId = variant.id || variant._id;
      if (variant.isActive) {
        await clientApiFetch(`/api/catalog/variants/${variantId}`, {
          method: "DELETE",
        });
        setData((prev) =>
          prev
            ? {
                ...prev,
                variants: prev.variants.map((v) =>
                  (v.id || v._id) === variantId ? { ...v, isActive: false } : v
                ),
              }
            : null
        );
      } else {
        const res = await clientApiFetch<any>(`/api/catalog/variants/${variantId}`, {
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        });
        setData((prev) =>
          prev
            ? {
                ...prev,
                variants: prev.variants.map((v) =>
                  (v.id || v._id) === variantId ? { ...v, isActive: true } : v
                ),
              }
            : null
        );
      }
    } catch (err: any) {
      alert(err.message || "Failed to update variant status.");
    } finally {
      setTogglingVariantId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Shirt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Apparel Product Inspector</h3>
              <p className="text-xs text-slate-400">ID: {productId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Loading catalog product and SKU matrix...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {!loading && product && (
            <>
              {/* Top Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Media Gallery (Left 5 Cols) */}
                <div className="md:col-span-5 space-y-3">
                  <div className="aspect-[3/4] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                    {images.length > 0 ? (
                      <img
                        src={getOptimizedImageUrl(images[activeImageIndex], {
                          width: 800,
                          quality: "auto:good",
                        })}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Shirt className="w-16 h-16 mb-2" />
                        <span className="text-xs font-medium">No Images Uploaded</span>
                      </div>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-14 h-18 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                            activeImageIndex === idx
                              ? "border-emerald-600 ring-2 ring-emerald-500/20"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={getOptimizedImageUrl(img, { width: 100, height: 130, crop: "fill" })}
                            alt="thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Meta & Specification (Right 7 Cols) */}
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
                      {product.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <code className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {product.slug}
                      </code>
                      <button
                        type="button"
                        onClick={copySlug}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {copiedSlug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Taxonomy Tags */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Brand
                      </span>
                      <span className="font-semibold text-slate-900">
                        {product.brand?.name || "Unbranded"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Category
                      </span>
                      <span className="font-semibold text-slate-900">
                        {product.category?.name || "Uncategorized"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        HSN Chapter
                      </span>
                      <span className="font-mono font-semibold text-slate-800">
                        {product.hsnCode || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                        Tax Surcharge
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {product.gstRate ?? 5}% GST
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1">
                      Description
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {product.description || "No description available."}
                    </p>
                  </div>

                  {/* Tags */}
                  {Array.isArray(product.tags) && product.tags.length > 0 && (
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-1.5">
                        Catalog Tags
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {product.tags.map((tag: string, i: number) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SKU Variants Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      Purchasable SKU Variants ({variants.length})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddVariant(product.id || product._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add SKU Variant
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Variant & SKU</th>
                        <th className="py-3 px-4">Attributes</th>
                        <th className="py-3 px-4">Selling Price</th>
                        <th className="py-3 px-4">MRP</th>
                        <th className="py-3 px-4">Avail / Stock</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {variants.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No SKU variants created yet. Click "Add SKU Variant" to add sizes.
                          </td>
                        </tr>
                      ) : (
                        variants.map((v) => {
                          const discountPercent =
                            v.mrp > v.sellingPrice
                              ? Math.round(((v.mrp - v.sellingPrice) / v.mrp) * 100)
                              : 0;

                          const attrs = Array.isArray(v.attributes)
                            ? v.attributes.map((a: any) => `${a.name}: ${a.value}`).join(", ")
                            : "-";

                          return (
                            <tr key={v.id || v._id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-900 block">{v.name}</span>
                                <span className="font-mono text-[10px] text-slate-500">{v.sku}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-medium">
                                {attrs}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900">
                                ₹{v.sellingPrice?.toLocaleString("en-IN")}
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                <span className="line-through">₹{v.mrp?.toLocaleString("en-IN")}</span>
                                {discountPercent > 0 && (
                                  <span className="ml-1 text-[10px] font-semibold text-emerald-600">
                                    {discountPercent}% OFF
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`font-semibold ${
                                    (v.availableStock ?? v.stockQuantity) > 0
                                      ? "text-emerald-700"
                                      : "text-rose-600"
                                  }`}
                                >
                                  {v.availableStock ?? v.stockQuantity}
                                </span>
                                <span className="text-slate-400 text-[10px] block">
                                  Total: {v.stockQuantity}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {v.isActive !== false ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                    Deactivated
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleToggleVariantStatus(v)}
                                  disabled={togglingVariantId === (v.id || v._id)}
                                  title={v.isActive ? "Deactivate Variant" : "Activate Variant"}
                                  className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                                >
                                  {togglingVariantId === (v.id || v._id) ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Power className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {product && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(product);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Product
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleProductStatus}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  product.isActive !== false
                    ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {product.isActive !== false ? "Deactivate Product" : "Activate Product"}
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(product);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
