"use client";

import React, { useState } from "react";
import { OrderDto, OrderStatusDto } from "@e-com/shared/types";
import { OrderDetailModal } from "./order-detail-modal";
import { formatDateTime, formatINR } from "@/lib/utils";
import {
  Search,
  ShoppingBag,
  Eye,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Filter,
} from "lucide-react";

interface OrderListProps {
  initialOrders: OrderDto[];
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All Orders", value: "ALL" },
  { label: "Paid & Ready", value: "PAID" },
  { label: "In Warehouse", value: "PROCESSING" },
  { label: "In-Transit", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export function OrderList({ initialOrders }: OrderListProps) {
  const [orders, setOrders] = useState<OrderDto[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);

  const filteredOrders = orders.filter((order) => {
    // Status filter check
    if (activeFilter !== "ALL" && order.status !== activeFilter) {
      return false;
    }

    // Search query check
    const q = searchQuery.toLowerCase();
    const idMatch = (order.id || "").toLowerCase().includes(q);
    const nameMatch = (order.shippingAddress?.name || "").toLowerCase().includes(q);
    const phoneMatch = (order.shippingAddress?.phone || "").toLowerCase().includes(q);
    const cityMatch = (order.shippingAddress?.city || "").toLowerCase().includes(q);

    return idMatch || nameMatch || phoneMatch || cityMatch;
  });

  const handleStatusUpdated = (updatedOrder: OrderDto) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    setSelectedOrder(updatedOrder);
  };

  const getStatusBadge = (status: OrderStatusDto) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Processing
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3 h-3" /> Shipped
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs & Search Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === f.value
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ID, customer, city, or phone..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Order ID & Date</th>
                <th className="py-3.5 px-6">Customer & Destination</th>
                <th className="py-3.5 px-6">Items & SKUs</th>
                <th className="py-3.5 px-6 text-right">Payable (INR)</th>
                <th className="py-3.5 px-6">Fulfillment Status</th>
                <th className="py-3.5 px-6 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No orders match the selected status or query.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemCount = order.items?.length || 0;
                  const firstItem = order.items?.[0];

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-xs text-slate-900 block">
                          #{order.id}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(order.createdAt)}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-900 block text-xs">
                          {order.shippingAddress?.name || "Customer"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600">
                        <span className="font-medium text-slate-900">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
                        {firstItem && (
                          <span className="block text-slate-400 text-[11px] truncate max-w-xs">
                            {firstItem.productName} ({firstItem.variantName})
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right font-bold text-slate-900 text-sm">
                        {formatINR(order.finalPayableAmount)}
                      </td>

                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Fulfill
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
}
