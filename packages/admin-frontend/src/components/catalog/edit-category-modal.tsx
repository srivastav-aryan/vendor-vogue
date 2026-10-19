"use client";

import React, { useState, useEffect } from "react";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateCategoriesAction } from "@/app/actions/catalog-actions";
import { CategoryResponse } from "@e-com/shared/types";
import { X, Loader2, FolderEdit, AlertCircle } from "lucide-react";

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryResponse | null;
  categories: CategoryResponse[];
  onCategoryUpdated: (updatedCat: CategoryResponse) => void;
}

export function EditCategoryModal({
  isOpen,
  onClose,
  category,
  categories,
  onCategoryUpdated,
}: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setParentId(category.parent || "");
      setIsActive(category.isActive);
      setError(null);
    }
  }, [category, isOpen]);

  if (!isOpen || !category) return null;

  // Find descendant IDs of this category to prevent cycles in parent selector
  const isDescendantOrSelf = (cat: CategoryResponse): boolean => {
    const catId = cat.id || (cat as any)._id;
    if (catId === category.id) return true;
    return (cat.ancestors || []).includes(category.id);
  };

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
        `/api/catalog/categories/${category.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            isActive,
            parent: parentId ? parentId : null,
          }),
        }
      );

      // Invalidate Server Component Cache
      await revalidateCategoriesAction();

      onCategoryUpdated(response.data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update category. Please try again.");
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
              <FolderEdit className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Edit Taxonomy Category
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
              placeholder="e.g. Men's Apparel"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Slug <span className="text-slate-400 font-normal">(canonical identifier)</span>
            </label>
            <input
              type="text"
              disabled
              value={category.slug}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Tree Position (Parent Category)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="">None (Top-Level Root Category)</option>
              {categories.map((cat) => {
                const catId = cat.id || (cat as any)._id;
                const isCycle = isDescendantOrSelf(cat);
                const depth = cat.ancestors?.length || 0;
                const indent = "— ".repeat(depth);
                return (
                  <option
                    key={catId}
                    value={catId}
                    disabled={isCycle}
                  >
                    {indent}{cat.name} ({cat.slug}){isCycle ? " [Cannot nest within self/descendant]" : ""}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Changing parent moves this category and automatically updates the ancestry tree for all its subcategories.
            </p>
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

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  Active in Storefront
                </span>
                <p className="text-[11px] text-slate-500">
                  Deactivating this category will cascade effective deactivation to all its subcategories.
                </p>
              </div>
            </label>
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
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
