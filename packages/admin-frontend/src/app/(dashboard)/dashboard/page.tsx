import React from "react";
import Link from "next/link";
import { serverApiFetch } from "@/lib/server-api-client";
import { formatINR } from "@/lib/utils";
import {
  Tag,
  FolderTree,
  Shirt,
  ShoppingBag,
  TrendingUp,
  Package,
  Plus,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export const revalidate = 0; // Fresh real-time data for operations dashboard

export default async function DashboardPage() {
  // Fetch platform metrics in parallel with Zero Waterfalls
  const [brandsRes, categoriesRes, productsRes, ordersRes] = await Promise.all([
    serverApiFetch<any[]>("/api/catalog/brands", { params: { limit: 100 } }).catch(() => ({ data: [] })),
    serverApiFetch<any[]>("/api/catalog/categories", { params: { limit: 100 } }).catch(() => ({ data: [] })),
    serverApiFetch<any[]>("/api/catalog/products", { params: { limit: 100 } }).catch(() => ({ data: [] })),
    serverApiFetch<any>("/api/orders", { params: { limit: 50 } }).catch(() => ({
      data: { orders: [], total: 0 },
    })),
  ]);

  const brandsCount = Array.isArray(brandsRes.data) ? brandsRes.data.length : 0;
  const rawCatData: any = categoriesRes.data;
  const categoriesCount = Array.isArray(rawCatData)
    ? rawCatData.length
    : Array.isArray(rawCatData?.items)
    ? rawCatData.items.length
    : 0;
  const productsCount = Array.isArray(productsRes.data) ? productsRes.data.length : 0;

  const orders = Array.isArray(ordersRes.data?.orders)
    ? ordersRes.data.orders
    : Array.isArray(ordersRes.data)
    ? ordersRes.data
    : [];

  const totalRevenue = orders.reduce(
    (sum: number, o: any) => sum + (o.finalPayableAmount || 0),
    0
  );

  const pendingFulfillmentCount = orders.filter(
    (o: any) => o.status === "PAID" || o.status === "PROCESSING"
  ).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Operations Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status of Vendor Vogue catalog, inventory, and order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/catalog/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Product
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            View Orders
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Platform Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {formatINR(totalRevenue)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Total completed GMV</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Orders Queue
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {ordersRes.pagination?.totalCount ?? orders.length}
            </div>
            <p className="text-xs text-blue-600 font-medium mt-1">
              {pendingFulfillmentCount} pending dispatch
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Products
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Shirt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {productsCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">Fashion & apparel catalog</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Taxonomy Assets
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900">
              {brandsCount + categoriesCount}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {brandsCount} Brands • {categoriesCount} Categories
            </p>
          </div>
        </div>
      </div>

      {/* Quick Launchpad & Indian Compliance Notice */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">
            Quick Launchpad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/catalog/products/new"
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Shirt className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">
                    Product & Variant Studio
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Draft apparel items, HSN code, GST rate, & size matrix.
                </p>
              </div>
            </Link>

            <Link
              href="/orders"
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">
                    Order Fulfillment Queue
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage shipping transitions: PROCESSING → SHIPPED → DELIVERED.
                </p>
              </div>
            </Link>

            <Link
              href="/catalog/brands"
              className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Tag className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">
                    Brand Registry
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Register fashion labels, logos, and descriptions.
                </p>
              </div>
            </Link>

            <Link
              href="/catalog/categories"
              className="p-4 rounded-xl border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all group flex items-start gap-4"
            >
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FolderTree className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900">
                    Taxonomy Categories
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Maintain nested category hierarchy and active toggles.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Indian Compliance & Retail Architecture Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm border border-slate-700 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Indian Retail Compliance
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              GST & Legal Metrology
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every variant strictly enforces <span className="text-emerald-400 font-semibold">Selling Price ≤ MRP</span> under the Legal Metrology Act. Products enforce mandatory fashion HSN codes (Chapter 61, 62, 63) and GST tax tier calculation (5% / 12%).
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Direct Cloudinary CDN active</span>
            <span className="text-emerald-400 font-mono">HMAC-SHA1 Signed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
