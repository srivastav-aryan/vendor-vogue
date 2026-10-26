"use client";

import React, { useState, useEffect } from "react";
import { CategoryResponse, CategoryTreeNode } from "@e-com/shared/types";
import { CreateCategoryModal } from "./create-category-modal";
import { EditCategoryModal } from "./edit-category-modal";
import { CategoryDetailModal } from "./category-detail-modal";
import { formatDateTime } from "@/lib/utils";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateCategoriesAction } from "@/app/actions/catalog-actions";
import {
  Search,
  Plus,
  FolderTree,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CornerDownRight,
  Edit2,
  Trash2,
  Power,
  Loader2,
  AlertCircle,
  Eye,
  RefreshCw,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
} from "lucide-react";

interface CategoryListProps {
  initialCategories: CategoryResponse[];
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState<CategoryResponse[]>(initialCategories);
  const [treeData, setTreeData] = useState<CategoryTreeNode[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [depthFilter, setDepthFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isTreeLoading, setIsTreeLoading] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [inspectingCategoryId, setInspectingCategoryId] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Expanded nodes for tree view
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Client-side fetch function to guarantee data is loaded if SSR was empty
  const loadCategoriesFromApi = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await clientApiFetch<any>("/api/catalog/categories", {
        params: { limit: 100 },
      });
      const rawData = res.data;
      const items: CategoryResponse[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.items)
        ? rawData.items
        : [];
      setCategories(items);
    } catch (err: any) {
      console.warn("Client categories fetch:", err);
      setActionError(err.message || "Failed to load categories from database.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Tree view endpoint (/api/catalog/categories/tree)
  const loadTreeFromApi = async () => {
    setIsTreeLoading(true);
    try {
      const res = await clientApiFetch<CategoryTreeNode[]>("/api/catalog/categories/tree");
      setTreeData(res.data || []);
      // Auto expand all root nodes
      if (res.data && Array.isArray(res.data)) {
        const rootIds = new Set(res.data.map((n) => n.id));
        setExpandedNodes(rootIds);
      }
    } catch (err: any) {
      console.warn("Failed to load category tree endpoint:", err);
      setActionError(err.message || "Failed to load category tree from database.");
    } finally {
      setIsTreeLoading(false);
    }
  };

  // Run on mount if initialCategories was empty or to sync
  useEffect(() => {
    if (initialCategories.length === 0) {
      loadCategoriesFromApi();
    }
  }, []);

  // Synchronize state when initialCategories updates
  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
    }
  }, [initialCategories]);

  // When switching to tree mode, fetch the hierarchical tree endpoint
  useEffect(() => {
    if (viewMode === "tree") {
      loadTreeFromApi();
    }
  }, [viewMode]);

  const toggleNodeExpanded = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Compute table filtering
  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "active" && !c.isEffectivelyActive) return false;
    if (statusFilter === "inactive" && c.isActive) return false;
    if (statusFilter === "blocked" && (!c.isActive || c.isEffectivelyActive)) return false;

    const depth = (c.ancestors || []).length;
    if (depthFilter === "root" && depth !== 0) return false;
    if (depthFilter === "level1" && depth !== 1) return false;
    if (depthFilter === "level2" && depth !== 2) return false;

    return true;
  });

  const getParentName = (parentId: string | null) => {
    if (!parentId) return "None (Root)";
    const parent = categories.find((c) => (c.id || (c as any)._id) === parentId);
    return parent ? parent.name : parentId;
  };

  const handleCategoryCreated = (newCat: CategoryResponse) => {
    const formatted = {
      ...newCat,
      id: newCat.id || (newCat as any)._id,
      ancestors: newCat.ancestors || [],
    };
    setCategories((prev) => [formatted, ...prev]);
    setActionSuccess(`Category "${formatted.name}" created successfully!`);
    // Clear search and filters so new category is visible
    setSearchQuery("");
    setStatusFilter("all");
    setDepthFilter("all");
    if (viewMode === "tree") loadTreeFromApi();
  };

  const handleCategoryUpdated = (updatedCat: CategoryResponse) => {
    const formatted = {
      ...updatedCat,
      id: updatedCat.id || (updatedCat as any)._id,
      ancestors: updatedCat.ancestors || [],
    };
    setCategories((prev) =>
      prev.map((c) => ((c.id || (c as any)._id) === formatted.id ? { ...c, ...formatted } : c))
    );
    setActionSuccess(`Category "${formatted.name}" updated successfully!`);
    if (viewMode === "tree") loadTreeFromApi();
  };

  const handleToggleStatus = async (category: CategoryResponse) => {
    const catId = category.id || (category as any)._id;
    setTogglingId(catId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const nextActive = !category.isActive;
      const res = await clientApiFetch<CategoryResponse>(
        `/api/catalog/categories/${catId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive: nextActive }),
        }
      );

      await revalidateCategoriesAction();
      handleCategoryUpdated(res.data);
    } catch (err: any) {
      setActionError(err.message || "Failed to update category status.");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    const catId = deletingCategory.id || (deletingCategory as any)._id;
    setIsDeleting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await clientApiFetch(`/api/catalog/categories/${catId}`, {
        method: "DELETE",
      });

      await revalidateCategoriesAction();
      setCategories((prev) => prev.filter((c) => (c.id || (c as any)._id) !== catId));
      setActionSuccess(`Category "${deletingCategory.name}" deleted.`);
      setDeletingCategory(null);
      if (viewMode === "tree") loadTreeFromApi();
    } catch (err: any) {
      setActionError(err.message || "Failed to delete category.");
      setDeletingCategory(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: CategoryTreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const catId = node.id || (node as any)._id;

    return (
      <div key={catId} className="select-none">
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-slate-50/80 ${
            level > 0 ? "ml-6 border-l-2 border-slate-200 pl-3 my-1" : "my-1.5 bg-white border border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNodeExpanded(node.id)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-6 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              </div>
            )}

            <div className="flex items-center gap-2 min-w-0">
              {hasChildren && isExpanded ? (
                <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-slate-400 shrink-0" />
              )}
              <span className="font-semibold text-slate-900 text-sm truncate">
                {node.name}
              </span>
              <span className="font-mono text-[11px] text-slate-400">({node.slug})</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-500">
                {level === 0 ? "Root" : `Level ${level}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status */}
            <div>
              {node.isEffectivelyActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
              ) : !node.isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <XCircle className="w-3 h-3" />
                  Inactive
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Blocked
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setInspectingCategoryId(catId)}
                title="Inspect Category Info"
                className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(node)}
                disabled={togglingId === catId}
                title={node.isActive ? "Deactivate" : "Activate"}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                {togglingId === catId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className={`w-3.5 h-3.5 ${node.isActive ? "text-emerald-600" : "text-slate-400"}`} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditingCategory(node)}
                title="Edit Category & Tree Position"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeletingCategory(node)}
                title="Delete Category"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3 text-rose-700 text-xs font-medium animate-in fade-in">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Action Encountered an Issue</p>
              <p className="text-rose-600 mt-0.5">{actionError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-400 hover:text-rose-600 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Controls & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search taxonomy categories..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
            />
          </div>

          {/* Depth Filter (Table view) */}
          {viewMode === "table" && (
            <div className="relative min-w-[130px]">
              <select
                value={depthFilter}
                onChange={(e) => setDepthFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
              >
                <option value="all">All Depths</option>
                <option value="root">Root Categories</option>
                <option value="level1">Level 1 Subcategories</option>
                <option value="level2">Level 2 Subcategories</option>
              </select>
            </div>
          )}

          {/* Status Filter (Table view) */}
          {viewMode === "table" && (
            <div className="relative min-w-[130px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          )}
        </div>

        {/* View Mode Switcher + Add Category Button */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={viewMode === "tree" ? loadTreeFromApi : loadCategoriesFromApi}
            disabled={isLoading || isTreeLoading}
            title="Refresh Categories"
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isTreeLoading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          {/* View Mode Toggle: Tabular vs Tree */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabular View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === "tree"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              Hierarchy Tree
            </button>
          </div>

          {/* Add Category Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "tree" ? (
        /* HIERARCHY TREE VIEW (GET /api/catalog/categories/tree) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[300px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hierarchy Tree Explorer</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full taxonomy structure with branch expanders, effective active cascade, and nesting levels.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (expandedNodes.size > 0) {
                  setExpandedNodes(new Set());
                } else {
                  setExpandedNodes(new Set(treeData.map((n) => n.id)));
                }
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              {expandedNodes.size > 0 ? "Collapse All" : "Expand All"}
            </button>
          </div>

          {isTreeLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Building category hierarchy tree...</span>
            </div>
          ) : treeData.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FolderTree className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No categories found in the taxonomy tree.
            </div>
          ) : (
            <div className="space-y-1">
              {treeData.map((rootNode) => renderTreeNode(rootNode, 0))}
            </div>
          )}
        </div>
      ) : (
        /* TABULAR LIST VIEW (GET /api/catalog/categories) */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Slug</th>
                  <th className="py-3.5 px-6">Hierarchy & Parent</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Storefront Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                      Loading categories from database...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <FolderTree className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-700">No categories found</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4">
                        Click "Add Category" or "Refresh" to load categories from the catalog.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create Category
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => {
                    const catId = category.id || (category as any)._id;
                    const depth = (category.ancestors || []).length;
                    return (
                      <tr key={catId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                depth === 0
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : depth === 1
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-purple-50 text-purple-700 border border-purple-200"
                              }`}
                            >
                              <FolderTree className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {category.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatDateTime(category.createdAt)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-500">
                          {category.slug}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                depth === 0
                                  ? "bg-slate-100 text-slate-600"
                                  : depth === 1
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-purple-50 text-purple-700"
                              }`}
                            >
                              {depth === 0 ? "Root" : `Level ${depth}`}
                            </span>
                            {category.parent ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                <CornerDownRight className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[130px]">
                                  {getParentName(category.parent)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Top-Level</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                          {category.description || "-"}
                        </td>
                        <td className="py-4 px-6">
                          {category.isEffectivelyActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Active
                            </span>
                          ) : !category.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                              title="Active itself, but blocked by an inactive parent/ancestor."
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Blocked by Ancestor
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-1">
                            {/* Inspect Info Button (GET /api/catalog/categories/:id) */}
                            <button
                              type="button"
                              onClick={() => setInspectingCategoryId(catId)}
                              title="Inspect Individual Category Info"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {/* Quick Toggle Status */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(category)}
                              disabled={togglingId === catId}
                              title={category.isActive ? "Deactivate" : "Activate"}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                              {togglingId === catId ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Power
                                  className={`w-4 h-4 ${
                                    category.isActive ? "text-emerald-600" : "text-slate-400"
                                  }`}
                                />
                              )}
                            </button>
                            {/* Edit & Tree Reposition */}
                            <button
                              type="button"
                              onClick={() => setEditingCategory(category)}
                              title="Edit Category & Tree Position"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(category)}
                              title="Delete Category"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      <CreateCategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={categories}
        onCategoryCreated={handleCategoryCreated}
      />

      {/* Edit Modal (with Tree Repositioning) */}
      <EditCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        categories={categories}
        onCategoryUpdated={handleCategoryUpdated}
      />

      {/* Individual Category Level Info Modal (Inspector) */}
      <CategoryDetailModal
        isOpen={!!inspectingCategoryId}
        onClose={() => setInspectingCategoryId(null)}
        categoryId={inspectingCategoryId}
      />

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Delete Category
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">{deletingCategory.name}</strong>?
            </p>
            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
              Note: Categories with active subcategories or linked products cannot be deleted.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
