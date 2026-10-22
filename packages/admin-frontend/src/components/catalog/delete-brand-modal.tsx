"use client";

import React, { useState } from "react";
import { BrandResponse } from "@e-com/shared/types";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateBrandsAction } from "@/app/actions/catalog-actions";
import {
  X,
  AlertTriangle,
  Loader2,
  Trash2,
  PowerOff,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

interface DeleteBrandModalProps {
  isOpen: boolean;
  brand: BrandResponse | null;
  onClose: () => void;
  onBrandDeleted: (deletedBrandId: string) => void;
  onBrandUpdated: (updatedBrand: BrandResponse) => void;
}

export function DeleteBrandModal({
  isOpen,
  brand,
  onClose,
  onBrandDeleted,
  onBrandUpdated,
}: DeleteBrandModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProductConflict, setHasProductConflict] = useState(false);

  if (!isOpen || !brand) return null;

  // Soft Deactivate
  const handleDeactivate = async () => {
    setIsSubmitting(true);
    setError(null);
    setHasProductConflict(false);

    try {
      await clientApiFetch(`/api/catalog/brands/${brand.id}/deactivate`, {
        method: "PATCH",
      });

      await revalidateBrandsAction();
      onBrandUpdated({ ...brand, isActive: false });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to deactivate brand.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Permanent Hard Delete
  const handleHardDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    setHasProductConflict(false);

    try {
      await clientApiFetch(`/api/catalog/brands/${brand.id}`, {
        method: "DELETE",
      });

      await revalidateBrandsAction();
      onBrandDeleted(brand.id);
      onClose();
    } catch (err: any) {
      const msg = err.message || "";
      if (
        msg.includes("products") ||
        msg.includes("BRAND_HAS_PRODUCTS") ||
        msg.includes("linked")
      ) {
        setHasProductConflict(true);
        setError(
          "Cannot permanently delete this brand because products are associated with it. You can deactivate it instead to hide it from shoppers."
        );
      } else {
        setError(msg || "Failed to delete brand.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="p-1.5 rounded-lg bg-rose-50">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Delete Brand</h3>
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
              Selected Brand
            </p>
            <p className="text-sm font-bold text-slate-900">{brand.name}</p>
            <p className="text-xs font-mono text-slate-500 mt-0.5">slug: {brand.slug}</p>
          </div>

          {hasProductConflict ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Protected Catalog Entity</p>
                <p className="mt-1 text-amber-800 leading-relaxed">
                  Products in your catalog currently depend on this brand. Deactivating it will prevent new products from selecting it and hide it from storefront filters without corrupting catalog integrity.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Choose an action for <strong>{brand.name}</strong>:
              </p>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-start gap-2">
                  <PowerOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Soft Deactivate (Recommended):</span>{" "}
                    Hides the brand from the storefront catalog while keeping all existing products and historical data intact.
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-2 border-t border-slate-200/60">
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Permanent Hard Delete:</span>{" "}
                    Completely deletes the record from the database. Only succeeds if no products reference this brand.
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

            {hasProductConflict ? (
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
                {brand.isActive && (
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
