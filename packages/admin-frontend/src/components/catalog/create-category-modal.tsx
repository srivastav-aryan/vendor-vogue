"use client";

import React, { useState } from "react";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateCategoriesAction } from "@/app/actions/catalog-actions";
import { CategoryResponse } from "@e-com/shared/types";
import { X, Loader2, FolderTree, AlertCircle } from "lucide-react";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryResponse[];
  onCategoryCreated: (newCat: CategoryResponse) => void;
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  categories,
  onCategoryCreated,
}: CreateCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 5) {
      setError("Category description must be at least 5 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await clientApiFetch<CategoryResponse>(
        "/api/catalog/categories",
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            parent: parentId ? parentId : null,
          }),
        }
      );

      // Invalidate Server Component Cache
      await revalidateCategoriesAction();

      const createdCat = response.data;
      onCategoryCreated({
        ...createdCat,
        id: createdCat.id || (createdCat as any)._id,
        ancestors: createdCat.ancestors || [],
      });

      setName("");
      setDescription("");
      setParentId("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create category. Please try again.");
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
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <FolderTree className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Create Taxonomy Category
            </h3>
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Men's Apparel, Festive Kurtas, Denim Jeans"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Parent Hierarchy <span className="text-slate-400 font-normal">(optional nesting)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="">None (Top-Level Root Category)</option>
              {categories.map((cat) => {
                const depth = cat.ancestors?.length || 0;
                const indent = "— ".repeat(depth);
                const isInactive = !cat.isEffectivelyActive;
                return (
                  <option
                    key={cat.id}
                    value={cat.id}
                    disabled={isInactive}
                  >
                    {indent}{cat.name} ({cat.slug}){isInactive ? " — [Inactive / Blocked]" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Apparel category description for catalog indexing and navigation (min 5 chars)..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-900/20 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Category...
                </>
              ) : (
                "Save Category"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
