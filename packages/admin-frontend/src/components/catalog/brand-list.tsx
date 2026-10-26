"use client";

import React, { useState, useEffect } from "react";
import { BrandResponse } from "@e-com/shared/types";
import { CreateBrandModal } from "./create-brand-modal";
import { EditBrandModal } from "./edit-brand-modal";
import { BrandDetailModal } from "./brand-detail-modal";
import { DeleteBrandModal } from "./delete-brand-modal";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateBrandsAction } from "@/app/actions/catalog-actions";
import { formatDateTime } from "@/lib/utils";
import {
  Search,
  Plus,
  Tag,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Trash2,
  Power,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface BrandListProps {
  initialBrands: BrandResponse[];
}

export function BrandList({ initialBrands }: BrandListProps) {
  const [brands, setBrands] = useState<BrandResponse[]>(initialBrands);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingBrandId, setTogglingBrandId] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBrandForDetail, setSelectedBrandForDetail] = useState<BrandResponse | null>(null);
  const [selectedBrandForEdit, setSelectedBrandForEdit] = useState<BrandResponse | null>(null);
  const [selectedBrandForDelete, setSelectedBrandForDelete] = useState<BrandResponse | null>(null);

  // Refresh data from backend with isActive=all
  const fetchBrands = async () => {
    setIsRefreshing(true);
    try {
      const res = await clientApiFetch<BrandResponse[]>("/api/catalog/brands", {
        params: { limit: 100, isActive: "all" },
      });
      if (Array.isArray(res.data)) {
        setBrands(res.data);
      }
    } catch (err) {
      console.error("Failed to refresh brands:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Handlers for mutations
  const handleBrandCreated = (newBrand: BrandResponse) => {
    setBrands((prev) => [newBrand, ...prev]);
  };

  const handleBrandUpdated = (updatedBrand: BrandResponse) => {
    setBrands((prev) =>
      prev.map((b) => (b.id === updatedBrand.id ? updatedBrand : b))
    );
  };

  const handleBrandDeleted = (deletedId: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== deletedId));
  };

  // Quick toggle active / inactive status
  const handleToggleStatus = async (brand: BrandResponse) => {
    setTogglingBrandId(brand.id);
    try {
      if (brand.isActive) {
        // Soft deactivate
        await clientApiFetch(`/api/catalog/brands/${brand.id}/deactivate`, {
          method: "PATCH",
        });
        handleBrandUpdated({ ...brand, isActive: false });
      } else {
        // Re-activate
        const res = await clientApiFetch<BrandResponse>(
          `/api/catalog/brands/${brand.id}`,
          {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
          }
        );
        handleBrandUpdated(res.data);
      }
      await revalidateBrandsAction();
    } catch (err: any) {
      alert(err.message || "Failed to update brand status.");
    } finally {
      setTogglingBrandId(null);
    }
  };

  // Counts for tabs
  const activeCount = brands.filter((b) => b.isActive).length;
  const inactiveCount = brands.filter((b) => !b.isActive).length;

  // Filtered list
  const filteredBrands = brands.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "active") return b.isActive;
    if (statusFilter === "inactive") return !b.isActive;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands by name or slug..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBrands}
            disabled={isRefreshing}
            title="Refresh brand list"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Brand
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
            statusFilter === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Brands ({brands.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("active")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
            statusFilter === "active"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("inactive")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
            statusFilter === "inactive"
              ? "bg-slate-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Brand</th>
                <th className="py-3.5 px-6">Slug</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Created</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No brands found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Brand Name & Logo */}
                    <td className="py-4 px-6">
                      <div
                        onClick={() => setSelectedBrandForDetail(brand)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        {brand.logo ? (
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 group-hover:border-slate-300 transition-colors"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs group-hover:border-emerald-300 transition-colors">
                            {brand.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {brand.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">
                      {brand.slug}
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {brand.description || "-"}
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-6">
                      {brand.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {formatDateTime(brand.createdAt)}
                    </td>

                    {/* Row Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Inspect */}
                        <button
                          type="button"
                          onClick={() => setSelectedBrandForDetail(brand)}
                          title="Inspect Brand"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => setSelectedBrandForEdit(brand)}
                          title="Edit Brand"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Quick Toggle Status */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(brand)}
                          disabled={togglingBrandId === brand.id}
                          title={brand.isActive ? "Deactivate Brand" : "Activate Brand"}
                          className={`p-1.5 rounded-lg transition-colors ${
                            brand.isActive
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {togglingBrandId === brand.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setSelectedBrandForDelete(brand)}
                          title="Delete Brand"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      <CreateBrandModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onBrandCreated={handleBrandCreated}
      />

      {/* Edit Modal */}
      <EditBrandModal
        isOpen={Boolean(selectedBrandForEdit)}
        brand={selectedBrandForEdit}
        onClose={() => setSelectedBrandForEdit(null)}
        onBrandUpdated={handleBrandUpdated}
      />

      {/* Detail / Inspector Modal */}
      <BrandDetailModal
        isOpen={Boolean(selectedBrandForDetail)}
        brand={selectedBrandForDetail}
        onClose={() => setSelectedBrandForDetail(null)}
        onEdit={(brand) => setSelectedBrandForEdit(brand)}
        onToggleStatus={handleToggleStatus}
        onDelete={(brand) => setSelectedBrandForDelete(brand)}
      />

      {/* Delete / Deactivate Modal */}
      <DeleteBrandModal
        isOpen={Boolean(selectedBrandForDelete)}
        brand={selectedBrandForDelete}
        onClose={() => setSelectedBrandForDelete(null)}
        onBrandDeleted={handleBrandDeleted}
        onBrandUpdated={handleBrandUpdated}
      />
    </div>
  );
}
