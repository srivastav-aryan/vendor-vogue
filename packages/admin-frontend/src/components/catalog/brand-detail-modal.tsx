"use client";

import React from "react";
import { BrandResponse } from "@e-com/shared/types";
import { formatDateTime } from "@/lib/utils";
import {
  X,
  Tag,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Power,
  Copy,
  Check,
} from "lucide-react";

interface BrandDetailModalProps {
  isOpen: boolean;
  brand: BrandResponse | null;
  onClose: () => void;
  onEdit: (brand: BrandResponse) => void;
  onToggleStatus: (brand: BrandResponse) => void;
  onDelete: (brand: BrandResponse) => void;
}

export function BrandDetailModal({
  isOpen,
  brand,
  onClose,
  onEdit,
  onToggleStatus,
  onDelete,
}: BrandDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !brand) return null;

  const copySlug = () => {
    navigator.clipboard.writeText(brand.slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Brand Profile</h3>
              <p className="text-xs text-slate-400">ID: {brand.id}</p>
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Brand Identity Header */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-16 h-16 rounded-xl object-contain bg-white border border-slate-200 p-1.5 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {brand.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg font-bold text-slate-900 truncate">{brand.name}</h4>
                {brand.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700 border border-slate-300">
                    <XCircle className="w-3 h-3" />
                    Deactivated
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-xs font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {brand.slug}
                </code>
                <button
                  type="button"
                  onClick={copySlug}
                  title="Copy slug"
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </h5>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {brand.description || "No description provided."}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Created</p>
                <p className="text-xs font-medium text-slate-700 truncate">{formatDateTime(brand.createdAt)}</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Updated</p>
                <p className="text-xs font-medium text-slate-700 truncate">{formatDateTime(brand.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(brand);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Brand
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onToggleStatus(brand);
                  onClose();
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  brand.isActive
                    ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                {brand.isActive ? "Deactivate" : "Activate"}
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(brand);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Brand
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
