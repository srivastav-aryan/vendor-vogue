"use client";

import React, { useState, useEffect } from "react";
import { BrandResponse, CategoryResponse } from "@e-com/shared/types";
import { ImageDropzone } from "./image-dropzone";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateProductsAction } from "@/app/actions/catalog-actions";
import { X, Loader2, Edit3, AlertCircle, CheckCircle2, Lock } from "lucide-react";

interface EditProductModalProps {
  isOpen: boolean;
  product: any;
  brands: BrandResponse[];
  categories: CategoryResponse[];
  onClose: () => void;
  onProductUpdated: (updatedProduct: any) => void;
}

export function EditProductModal({
  isOpen,
  product,
  brands,
  categories,
  onClose,
  onProductUpdated,
}: EditProductModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [hsnCode, setHSNCode] = useState("620520");
  const [gstRate, setGstRate] = useState<5 | 12>(5);
  const [tagsInput, setTagsInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setDescription(product.description || "");
      setBrandId(
        typeof product.brand === "object" ? product.brand?._id || product.brand?.id : product.brand || ""
      );
      setCategoryId(
        typeof product.category === "object"
          ? product.category?._id || product.category?.id
          : product.category || ""
      );
      setHSNCode(product.hsnCode || "620520");
      setGstRate(product.gstRate === 12 ? 12 : 5);
      setTagsInput(Array.isArray(product.tags) ? product.tags.join(", ") : "");
      setImages(Array.isArray(product.images) ? product.images : []);
      setIsActive(product.isActive !== false);
      setError(null);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 20) {
      setError("Product description must be at least 20 characters long.");
      return;
    }

    if (!brandId) {
      setError("Please select a brand.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        brand: brandId,
        category: categoryId,
        hsnCode: hsnCode.trim(),
        gstRate: Number(gstRate),
        tags,
        images,
        isActive,
      };

      const res = await clientApiFetch<any>(`/api/catalog/products/${product.id || product._id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      await revalidateProductsAction();
      onProductUpdated(res.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Product</h3>
              <p className="text-xs text-slate-400">Update apparel specifications and media</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Immutable Slug */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Product Slug
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-xs">
              <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{product.slug}</span>
              <span className="ml-auto text-[10px] text-slate-400 font-sans">Immutable</span>
            </div>
          </div>

          {/* Product Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Product Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Brand & Category Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Brand Label <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">Select Brand...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Category Taxonomy <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
              >
                <option value="">Select Category...</option>
                {categories.map((c: any) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* HSN & GST Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                HSN Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={hsnCode}
                onChange={(e) => setHSNCode(e.target.value)}
                placeholder="620520"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                GST Tax Surcharge <span className="text-rose-500">*</span>
              </label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value) as 5 | 12)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
              >
                <option value={5}>5% (Apparel ≤ ₹1,000)</option>
                <option value={12}>12% (Apparel &gt; ₹1,000 / Luxury)</option>
              </select>
            </div>
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
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Search Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="casual, linen, summer, slim-fit"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Media Dropzone (Cloudinary direct) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Product Images Gallery
            </label>
            <ImageDropzone
              value={images}
              onChange={setImages}
              maxImages={6}
              folder="vendor-vogue/products"
            />
          </div>

          {/* Active Status */}
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
                    Product Active in Storefront
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isActive
                      ? "Visible in product listings and searchable by customers."
                      : "Deactivated: Hidden from storefront catalog."}
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
                  Saving Product...
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
