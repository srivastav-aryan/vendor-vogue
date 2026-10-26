"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  PackageCheck,
  Truck,
  MapPin,
  Calendar,
  ArrowRight,
  Printer,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OrderDto } from "@e-com/shared/types";
import cloudinaryLoader from "@/lib/cloudinary-loader";

interface OrderSuccessViewProps {
  order: OrderDto;
}

export function OrderSuccessView({ order }: OrderSuccessViewProps) {
  const searchParams = useSearchParams();
  const method = searchParams.get("method");
  const isCod = method === "cod" || order.paymentProvider === "COD";

  // Calculate delivery date (4 business days from order creation)
  const orderDate = new Date(order.createdAt || Date.now());
  const deliveryDate = new Date(orderDate);
  deliveryDate.setDate(deliveryDate.getDate() + 4);

  const formattedOrderDate = orderDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const displayOrderId = (order.id || (order as any)._id || "").slice(-8).toUpperCase();
  const trackingNumber = `VV-TRK-${displayOrderId}`;

  const formatInr = (amount: number) =>
    `₹ ${(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 pb-24 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Top Header */}
      <header className="bg-white border-b border-neutral-200/80 sticky top-0 z-30 print:hidden">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm sm:text-base font-bold uppercase tracking-[0.24em] text-black"
          >
            VENDOR VOGUE
          </Link>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-black transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PRINT RECEIPT</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 sm:px-8 pt-8 sm:pt-12 space-y-8">
        {/* Editorial Success Hero */}
        <section className="bg-white border border-neutral-200/90 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8 stroke-[1.8]" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-neutral-400">
              ACQUISITION CONFIRMED
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              THANK YOU FOR YOUR ORDER
            </h1>
            <p className="text-xs text-neutral-500 font-light leading-relaxed">
              Your garments have been committed in our inventory and are being prepared for bespoke boxing and courier dispatch.
            </p>
          </div>

          {/* Key Reference Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <div className="px-3.5 py-1.5 bg-neutral-100 border border-neutral-200/80 text-xs font-mono">
              <span className="text-neutral-400">ORDER NO: </span>
              <strong className="text-black font-bold">VV-{displayOrderId}</strong>
            </div>

            <div className="px-3.5 py-1.5 bg-neutral-100 border border-neutral-200/80 text-xs font-mono">
              <span className="text-neutral-400">STATUS: </span>
              <strong className="text-emerald-700 font-bold uppercase">
                {isCod ? "CONFIRMED (COD)" : order.status || "PAID"}
              </strong>
            </div>

            <div className="px-3.5 py-1.5 bg-neutral-100 border border-neutral-200/80 text-xs font-mono">
              <span className="text-neutral-400">DATE: </span>
              <strong className="text-black font-semibold">{formattedOrderDate}</strong>
            </div>
          </div>
        </section>

        {/* Tracking & Delivery Estimate Banner */}
        <section className="bg-white border border-neutral-200/90 p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-neutral-100 rounded-none text-black">
                <Truck className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  ESTIMATED ARRIVAL
                </span>
                <p className="text-sm sm:text-base font-bold text-black uppercase tracking-wide">
                  {formattedDeliveryDate}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                COURIER TRACKING ID
              </span>
              <p className="text-xs font-mono font-bold text-black">
                {trackingNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500 font-light">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>Tracking updates will be dispatched via SMS & Email as the parcel moves through BlueDart Express.</span>
          </div>
        </section>

        {/* Order Items & Financial Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Items Receipt (7 Cols) */}
          <section className="md:col-span-7 bg-white border border-neutral-200/90 p-6 sm:p-8 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-black pb-3 border-b border-neutral-100">
              GARMENTS ORDERED ({order.items?.length || 0})
            </h2>

            <div className="divide-y divide-neutral-100 space-y-4">
              {order.items?.map((item, idx) => (
                <div key={idx} className="pt-4 first:pt-0 flex gap-4 items-start">
                  <div className="relative w-16 aspect-[3/4] bg-neutral-100 shrink-0 overflow-hidden">
                    <Image
                      loader={cloudinaryLoader}
                      src={item.image || "/images/hero/hero.jpg"}
                      alt={item.productName}
                      fill
                      sizes="64px"
                      className="object-cover object-center"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-tight text-neutral-900 line-clamp-1">
                      {item.productName}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase">
                      SKU: {item.sku} | QTY: {item.quantity}
                    </p>
                    <p className="text-xs font-bold text-neutral-900">
                      ₹ {(item.discountedUnitPrice * item.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Destination & Financials (5 Cols) */}
          <div className="md:col-span-5 space-y-6">
            {/* Shipping Destination Card */}
            <section className="bg-white border border-neutral-200/90 p-6 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                  DISPATCH ADDRESS
                </h3>
              </div>

              <div className="space-y-0.5 text-xs text-neutral-600 font-light leading-relaxed">
                <p className="font-bold uppercase text-black">
                  {order.shippingAddress?.name}
                </p>
                <p className="font-mono text-[11px] text-neutral-500">
                  {order.shippingAddress?.phone}
                </p>
                <p className="pt-1">
                  {order.shippingAddress?.addressLine1}
                  {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ""}
                  , {order.shippingAddress?.locality}
                </p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                </p>
                <p className="text-neutral-400 font-mono text-[10px] uppercase">
                  {order.shippingAddress?.country || "India"}
                </p>
              </div>
            </section>

            {/* Financial Ledger Receipt */}
            <section className="bg-white border border-neutral-200/90 p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black pb-2 border-b border-neutral-100">
                PAYMENT LEDGER
              </h3>

              <div className="space-y-2 text-xs text-neutral-600 font-medium">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-mono text-neutral-900">
                    {formatInr(order.cartSubtotal)}
                  </span>
                </div>

                {order.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promotion Discount</span>
                    <span className="font-mono">- {formatInr(order.totalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Express Shipping</span>
                  <span className="font-mono text-neutral-900">
                    {order.shippingFee === 0 ? "FREE" : formatInr(order.shippingFee)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Inclusive GST</span>
                  <span className="font-mono">Incl. {formatInr(order.totalGst)}</span>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex items-baseline justify-between text-neutral-900">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    TOTAL SETTLED
                  </span>
                  <span className="text-lg font-extrabold font-mono text-black">
                    {formatInr(order.finalPayableAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-[10px] font-mono text-neutral-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>GST Tax Invoice will be emailed to your account.</span>
              </div>
            </section>
          </div>
        </div>

        {/* Post-order Action Buttons */}
        <section className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
          <Button
            asChild
            className="w-full sm:w-auto h-12 px-8 rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-[0.2em] shadow-sm"
          >
            <Link href="/account/orders">
              <span>VIEW IN ORDER ARCHIVE</span>
              <ArrowRight className="w-3.5 h-3.5 ml-2" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto h-12 px-8 rounded-none border-neutral-300 text-xs font-bold uppercase tracking-[0.2em]"
          >
            <Link href="/catalog">
              <span>EXPLORE NEW ARRIVALS</span>
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
