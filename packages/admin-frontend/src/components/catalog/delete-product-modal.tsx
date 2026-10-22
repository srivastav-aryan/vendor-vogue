"use client";

import React, { useState } from "react";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateProductsAction } from "@/app/actions/catalog-actions";
import {
  X,
  AlertTriangle,
  Loader2,
  Trash2,
  PowerOff,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

interface DeleteProductModalProps {
  isOpen: boolean;
  product: any;
  onClose: () => void;
  onProductDeleted: (deletedProductId: string) => void;
  onProductUpdated: (updatedProduct: any) => void;
}

export function DeleteProductModal({
  isOpen,
  product,
  onClose,
  onProductDeleted,
  onProductUpdated,
}: DeleteProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasVariantConflict, setHasVariantConflict] = useState(false);

  if (!isOpen || !product) return null;

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    setError(null);
    setHasVariantConflict(false);

    try {
      await clientApiFetch(`/api/catalog/products/${product.id || product._id}/deactivate`, {
        method: "PATCH",
      });

      await revalidateProductsAction();
      onProductUpdated({ ...product, isActive: false });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to deactivate product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHardDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    setHasVariantConflict(false);

    try {
      await clientApiFetch(`/api/catalog/products/${product.id || product._id}`, {
        method: "DELETE",
      });

      await revalidateProductsAction();
      onProductDeleted(product.id || product._id);
      onClose();
    } catch (err: any) {
      const msg = err.message || "";
      if (
        msg.includes("variants") ||
        msg.includes("PRODUCT_HAS_VARIANTS") ||
        msg.includes("referenced")
      ) {
        setHasVariantConflict(true);
        setError(
          "Cannot permanently delete this product because SKU variants exist for it. You can deactivate it instead to hide it from shoppers."
        );
      } else {
        setError(msg || "Failed to delete product.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="p-1.5 rounded-lg bg-rose-50">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Product</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
              Selected Product
            </p>
            <p className="text-sm font-bold text-slate-900">{product.name}</p>
            <p className="text-xs font-mono text-slate-500 mt-0.5">slug: {product.slug}</p>
          </div>

          {hasVariantConflict ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">SKU Variants Attached</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  This product has registered inventory variants. Deactivating it will hide it from the storefront without corrupting inventory records.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Choose an action for <strong>{product.name}</strong>:
              </p>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-start gap-2">
                  <PowerOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Soft Deactivate (Recommended):</span>{" "}
                    Hides the product and its SKUs from shoppers while keeping order histories and inventory audit logs safe.
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Permanent Hard Delete:</span>{" "}
                    Completely removes the product from the catalog. Only permitted if no variants exist.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {hasVariantConflict ? (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PowerOff className="w-3.5 h-3.5" />
                )}
                Deactivate Instead
              </button>
            ) : (
              <>
                {product.isActive !== false && (
                  <button
                    type="button"
                    onClick={handleDeactivate}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-xl transition-all"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <PowerOff className="w-3.5 h-3.5" />
                    )}
                    Deactivate
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleHardDelete}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Permanent Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
