import React from "react";
import { serverApiFetch } from "@/lib/server-api-client";
import { OrderDto } from "@e-com/shared/types";
import { OrderList } from "@/components/orders/order-list";

export const metadata = {
  title: "Platform Orders & Fulfillment | Vendor Vogue Operations",
};

export const revalidate = 0; // Fresh real-time data for order fulfillment

export default async function OrdersPage() {
  const ordersRes = await serverApiFetch<any>("/api/orders", {
    params: { limit: 50 },
  }).catch(() => ({ data: { orders: [] } }));

  const initialOrders: OrderDto[] = Array.isArray(ordersRes.data?.orders)
    ? ordersRes.data.orders
    : Array.isArray(ordersRes.data)
    ? ordersRes.data
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Order Operations & Fulfillment
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor platform purchases, inspect immutable legal snapshots, and dispatch shipments.
        </p>
      </div>

      <OrderList initialOrders={initialOrders} />
    </div>
  );
}
