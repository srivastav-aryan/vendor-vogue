"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandResponse, CategoryResponse } from "@e-com/shared/types";
import { ImageDropzone } from "./image-dropzone";
import { VariantMatrixBuilder, VariantDraft } from "./variant-matrix-builder";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateProductsAction } from "@/app/actions/catalog-actions";
import {
  Shirt,
  Layers,
  Sparkles,
  IndianRupee,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface ProductFormProps {
  brands: BrandResponse[];
  categories: CategoryResponse[];
}

export function ProductForm({ brands, categories }: ProductFormProps) {
  const router = useRouter();

  // Core Product Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [hsnCode, setHSNCode] = useState("620520"); // Standard Indian apparel HSN
  const [gstRate, setGstRate] = useState<5 | 12>(5);
  const [tagsInput, setTagsInput] = useState("apparel, fashion, casual");
  const [images, setImages] = useState<string[]>([]);

  // Variant Matrix State
  const [variants, setVariants] = useState<VariantDraft[]>([
    {
      id: crypto.randomUUID(),
      name: "Default Shirt - S",
      size: "S",
      color: "Navy Blue",
      sku: "VV-SHIRT-NVY-S",
      mrp: 1999,
      sellingPrice: 1499,
      stockQuantity: 25,
      weightInGrams: 250,
    },
    {
      id: crypto.randomUUID(),
      name: "Default Shirt - M",
      size: "M",
      color: "Navy Blue",
      sku: "VV-SHIRT-NVY-M",
      mrp: 1999,
      sellingPrice: 1499,
      stockQuantity: 35,
      weightInGrams: 250,
    },
    {
      id: crypto.randomUUID(),
      name: "Default Shirt - L",
      size: "L",
      color: "Navy Blue",
      sku: "VV-SHIRT-NVY-L",
      mrp: 1999,
      sellingPrice: 1499,
      stockQuantity: 30,
      weightInGrams: 250,
    },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusStep, setStatusStep] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validation checks
    if (!brandId) {
      setError("Please select a brand.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if (description.trim().length < 20) {
      setError("Product description must be at least 20 characters long.");
      return;
    }
    if (variants.length === 0) {
      setError("At least one SKU variant must be created.");
      return;
    }

    // Check Legal Metrology compliance
    for (const v of variants) {
      if (v.sellingPrice > v.mrp) {
        setError(
          `Price violation on SKU ${v.sku}: Selling price (₹${v.sellingPrice}) cannot exceed MRP (₹${v.mrp}).`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setStatusStep("Publishing parent product record...");

    try {
      // 2. Format tags array
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      // 3. Create parent product
      const productPayload = {
        name: name.trim(),
        description: description.trim(),
        brand: brandId,
        category: categoryId,
        hsnCode: hsnCode.trim(),
        gstRate: Number(gstRate),
        images,
        tags,
      };

      const productRes = await clientApiFetch<{ id: string; name: string }>(
        "/api/catalog/products",
        {
          method: "POST",
          body: JSON.stringify(productPayload),
        }
      );

      const productId = productRes.data.id;

      // 4. Create variants under product in parallel
      setStatusStep(`Deploying ${variants.length} variant SKUs to catalog...`);

      const variantPromises = variants.map((v) => {
        const variantPayload = {
          name: v.name,
          sku: v.sku.toUpperCase(),
          mrp: Number(v.mrp),
          sellingPrice: Number(v.sellingPrice),
          stockQuantity: Number(v.stockQuantity),
          weightInGrams: Number(v.weightInGrams),
          attributes: [
            { name: "Size", value: v.size },
            { name: "Color", value: v.color },
          ],
          images: images.slice(0, 3), // share primary product images
        };

        return clientApiFetch(`/api/catalog/products/${productId}/variants`, {
          method: "POST",
          body: JSON.stringify(variantPayload),
        });
      });

      await Promise.all(variantPromises);

      // 5. Invalidate Next.js Server Component Cache
      setStatusStep("Refreshing catalog cache...");
      await revalidateProductsAction();

      // 6. Navigate to products table
      router.push("/catalog/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to publish product and variants.");
      setIsSubmitting(false);
      setStatusStep(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      {/* Top action header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            href="/catalog/products"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Create Apparel Product & Variants
            </h1>
            <p className="text-xs text-slate-500">
              Indian retail specification: HSN chapter codes, GST tax rates, and sizing matrix.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/catalog/products"
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-900/20 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{statusStep || "Publishing..."}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Publish Product & SKUs
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs font-medium">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: General Product Information */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Shirt className="w-4 h-4 text-emerald-600" />
          Apparel Identity & Classification
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Product Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Oxford Button-Down Cotton Shirt"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Brand Label <span className="text-rose-500">*</span>
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Description <span className="text-rose-500">* (min 20 characters)</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide fabric composition, fit details, wash care, and occasion notes for storefront shoppers..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Indian Tax & Regulatory Compliance */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <IndianRupee className="w-4 h-4 text-emerald-600" />
          Indian Taxation & HSN Regulatory Compliance
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                HSN Code <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setHSNCode("620520")}
                  className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  620520 (Woven)
                </button>
                <button
                  type="button"
                  onClick={() => setHSNCode("610910")}
                  className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  610910 (Knit/Tee)
                </button>
              </div>
            </div>
            <input
              type="text"
              required
              value={hsnCode}
              onChange={(e) => setHSNCode(e.target.value)}
              placeholder="e.g. 620520 (Apparel Chapter 61/62/63)"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono transition-all"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Required by GST Council for invoice generation & customs classification.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              GST Rate Tier <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGstRate(5)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  gstRate === 5
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <span className="font-bold text-sm text-slate-900 block">5% GST</span>
                <span className="text-[11px] text-slate-500">
                  Value ≤ ₹1,000 threshold
                </span>
              </button>

              <button
                type="button"
                onClick={() => setGstRate(12)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  gstRate === 12
                    ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <span className="font-bold text-sm text-slate-900 block">12% GST</span>
                <span className="text-[11px] text-slate-500">
                  Value &gt; ₹1,000 premium
                </span>
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Search Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. 100% cotton, formal, slim-fit, office wear"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Direct-to-Cloud Image Dropzone */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Media Gallery (Direct Cloudinary Upload)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Presigned HMAC-SHA1 signature generated on backend; images stream directly to Cloudinary CDN.
          </p>
        </div>

        <ImageDropzone
          value={images}
          onChange={setImages}
          maxImages={10}
          folder="vendor-vogue/catalog/products"
        />
      </div>

      {/* Section 4: Variant Matrix Studio */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <VariantMatrixBuilder
          variants={variants}
          onChange={setVariants}
          productName={name}
        />
      </div>
    </form>
  );
}
