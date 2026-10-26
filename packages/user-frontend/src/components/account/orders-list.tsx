"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  ArrowUpRight,
  ArrowRight,
  Loader2,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { getUserOrders } from "@/lib/api/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderDto } from "@e-com/shared/types";
import cloudinaryLoader from "@/lib/cloudinary-loader";

export function OrdersList() {
  const [orders, setOrders] = React.useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function fetchOrders() {
      try {
        setIsLoading(true);
        const { items } = await getUserOrders({ limit: 20 });
        if (isMounted) {
          setOrders(items || []);
        }
      } catch (err) {
        console.warn("[Orders List] Error fetching orders:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-7 h-7 animate-spin mx-auto text-neutral-400" />
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-500">
          LOADING ORDER ARCHIVE...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-400">
              PURCHASE ARCHIVE
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-neutral-200/70 text-neutral-800 font-semibold">
              {orders.length} {orders.length === 1 ? "ORDER" : "ORDERS"}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-[0.1em] text-neutral-900 mt-1">
            ORDER HISTORY
          </h2>
        </div>

        <Link
          href="/catalog"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer shadow-xs active:scale-[0.99] self-start sm:self-auto group"
        >
          <span>EXPLORE NEW ARRIVALS</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>

      {/* Orders List / Empty State */}
      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => {
            const orderIdStr = order.id || (order as any)._id || "";
            const displayId = orderIdStr.slice(-8).toUpperCase();
            const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            const statusVariant =
              order.status === "PAID" || order.status === "DELIVERED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : order.status === "CANCELLED"
                ? "bg-red-50 text-red-700 border-red-300"
                : "bg-neutral-100 text-neutral-800 border-neutral-300";

            return (
              <article
                key={orderIdStr}
                className="bg-white border border-neutral-200/90 shadow-xs p-6 sm:p-7 space-y-5"
              >
                {/* Order Top Meta */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-black">
                        VV-{displayId}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${statusVariant}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-neutral-400">
                      PLACED ON {orderDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase">
                        TOTAL AMOUNT
                      </span>
                      <p className="text-sm font-bold font-mono text-black">
                        ₹ {order.finalPayableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="rounded-none text-xs font-mono uppercase tracking-wider h-9 px-3.5 border-neutral-300 hover:bg-neutral-100"
                    >
                      <Link href={`/account/orders/${orderIdStr}`}>
                        <span>DETAILS & INVOICE</span>
                        <ArrowRight className="w-3 h-3 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="relative w-12 aspect-[3/4] bg-neutral-100 shrink-0 overflow-hidden">
                        <Image
                          loader={cloudinaryLoader}
                          src={item.image || "/images/hero/hero.jpg"}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover object-center"
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-left space-y-0.5">
                        <p className="text-xs font-bold uppercase tracking-tight text-neutral-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-500">
                          QTY: {item.quantity} × ₹ {item.discountedUnitPrice.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping Destination Snippet */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">
                      Ship to: {order.shippingAddress?.name}, {order.shippingAddress?.city} ({order.shippingAddress?.pincode})
                    </span>
                  </div>
                  <span className="shrink-0 uppercase text-neutral-400">
                    {order.paymentProvider || "RAZORPAY"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-12 sm:p-16 text-center border border-neutral-200/90 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
          <div className="w-12 h-12 mx-auto bg-neutral-100 flex items-center justify-center text-neutral-500 rounded-none">
            <Package className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-black">
              NO CLIENT ORDERS RECORDED
            </h3>
            <p className="text-xs text-neutral-500 font-light max-w-sm mx-auto leading-relaxed">
              Your personal archive is currently empty. Orders placed with your client credentials will be automatically tracked here with dispatch statuses and receipts.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-7 py-3 bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-[0.22em] transition-all cursor-pointer group shadow-xs active:scale-[0.99]"
            >
              <span>DISCOVER ARCHIVE</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
