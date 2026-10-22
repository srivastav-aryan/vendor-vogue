"use client";

import React, { useState, useEffect } from "react";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateBrandsAction } from "@/app/actions/catalog-actions";
import { BrandResponse } from "@e-com/shared/types";
import { X, Loader2, Edit3, AlertCircle, Lock, Trash2, CheckCircle2 } from "lucide-react";

interface EditBrandModalProps {
  isOpen: boolean;
  brand: BrandResponse | null;
  onClose: () => void;
  onBrandUpdated: (updatedBrand: BrandResponse) => void;
}

export function EditBrandModal({
  isOpen,
  brand,
  onClose,
  onBrandUpdated,
}: EditBrandModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (brand) {
      setName(brand.name || "");
      setDescription(brand.description || "");
      setLogo(brand.logo || "");
      setIsActive(brand.isActive ?? true);
      setError(null);
    }
  }, [brand]);

  if (!isOpen || !brand) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 10) {
      setError("Brand description must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await clientApiFetch<BrandResponse>(
        `/api/catalog/brands/${brand.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            logo: logo.trim() ? logo.trim() : null,
            isActive,
          }),
        }
      );

      await revalidateBrandsAction();
      onBrandUpdated(response.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update brand. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Brand</h3>
              <p className="text-xs text-slate-400">Update apparel brand profile and active status</p>
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Immutable Slug Notice */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Brand Slug
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-xs">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{brand.slug}</span>
              <span className="ml-auto text-[10px] text-slate-400 font-sans">Immutable</span>
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Brand Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FabIndia, Allen Solly"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of brand identity (min 10 characters)..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Logo URL with Live Preview & Clear Option */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Logo URL <span className="text-slate-400 font-normal">(optional HTTPS URL)</span>
              </label>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo("")}
                  className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove Logo
                </button>
              )}
            </div>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://res.cloudinary.com/.../brand-logo.png"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {logo && (
              <div className="mt-2 flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <img
                  src={logo}
                  alt="Logo preview"
                  className="w-9 h-9 rounded-lg object-contain bg-white border border-slate-200 p-1 shrink-0"
                  onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                />
                <div className="overflow-hidden">
                  <p className="text-xs font-medium text-slate-700 truncate">Logo Preview</p>
                  <p className="text-[10px] text-slate-400 truncate">{logo}</p>
                </div>
              </div>
            )}
          </div>

          {/* Active Status Switch */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isActive ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Active in Storefront Catalog
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isActive
                      ? "Products under this brand are visible to shoppers."
                      : "Deactivated: Hidden from storefront search and collections."}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-slate-300"
              />
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-900/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
