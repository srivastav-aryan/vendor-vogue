"use client";

import React, { useEffect, useState } from "react";
import { clientApiFetch } from "@/lib/api-client";
import { CategoryDetailResponse } from "@e-com/shared/types";
import { formatDateTime } from "@/lib/utils";
import {
  X,
  Loader2,
  FolderTree,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Calendar,
  CornerDownRight,
  GitBranch,
} from "lucide-react";

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string | null;
}

export function CategoryDetailModal({
  isOpen,
  onClose,
  categoryId,
}: CategoryDetailModalProps) {
  const [detail, setDetail] = useState<CategoryDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && categoryId) {
      setLoading(true);
      setError(null);
      clientApiFetch<CategoryDetailResponse>(`/api/catalog/categories/${categoryId}`)
        .then((res) => {
          setDetail(res.data);
        })
        .catch((err) => {
          setError(err.message || "Failed to load category details");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setDetail(null);
    }
  }, [isOpen, categoryId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <FolderTree className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Category Inspector
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs font-medium">Fetching category level info...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          ) : detail ? (
            <>
              {/* Top Overview Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{detail.name}</h4>
                  <p className="font-mono text-xs text-slate-500 mt-0.5">slug: {detail.slug}</p>
                </div>
                <div>
                  {detail.isEffectivelyActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </span>
                  ) : !detail.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Inactive
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Blocked by Ancestor
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Description
                </label>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {detail.description || "No description provided."}
                </p>
              </div>

              {/* Hierarchy & Tree Position */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hierarchy Level</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {detail.ancestors.length === 0
                      ? "Root (Level 0)"
                      : `Level ${detail.ancestors.length} Subcategory`}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                    <span>Subcategories</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {detail.childrenCount} direct children
                  </p>
                </div>
              </div>

              {/* Parent & Ancestor Breadcrumb */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Ancestry Trail
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-slate-500">Root</span>
                  {detail.ancestorDetails && detail.ancestorDetails.length > 0 ? (
                    detail.ancestorDetails.map((anc) => (
                      <React.Fragment key={anc.id}>
                        <CornerDownRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium text-slate-800">
                          {anc.name}
                        </span>
                      </React.Fragment>
                    ))
                  ) : null}
                  <CornerDownRight className="w-3 h-3 text-emerald-600" />
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                    {detail.name}
                  </span>
                </div>
              </div>

              {/* Metadata Timestamps */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">ID: {detail.id}</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Created {formatDateTime(detail.createdAt)}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-sm"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
