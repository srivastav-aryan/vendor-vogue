"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  MapPin,
  CreditCard,
  FileText,
  ShieldCheck,
  Building2,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderDto } from "@e-com/shared/types";
import cloudinaryLoader from "@/lib/cloudinary-loader";

interface OrderDetailViewProps {
  order: OrderDto;
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const orderId = order.id || (order as any)._id || "";
  const displayId = orderId.slice(-8).toUpperCase();
  const orderDate = new Date(order.createdAt || Date.now());
  const formattedDate = orderDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const invoiceNumber =
    order.invoiceNumber ||
    `INV-${orderDate.getFullYear()}-${displayId.slice(-6)}`;

  const isCod = order.paymentProvider === "COD";
  const isCancelled = order.status === "CANCELLED";

  // Determine active step index: 0 = PLACED, 1 = PROCESSING, 2 = SHIPPED, 3 = DELIVERED
  const statusIndexMap: Record<string, number> = {
    PENDING_PAYMENT: 0,
    PAID: 1,
    PROCESSING: 1,
    SHIPPED: 2,
    DELIVERED: 3,
  };

  const currentStep = isCancelled ? -1 : (statusIndexMap[order.status] ?? 1);

  const steps = [
    { label: "ORDER PLACED", icon: Clock },
    { label: isCod ? "CONFIRMED (COD)" : "PROCESSING", icon: CheckCircle2 },
    { label: "SHIPPED", icon: Truck },
    { label: "DELIVERED", icon: PackageCheck },
  ];

  const handlePrintInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:p-0 print:space-y-6">
      {/* Print-Only Tax Invoice Header */}
      <div className="hidden print:block border-b-2 border-black pb-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">
              VENDOR VOGUE
            </h1>
            <p className="text-xs uppercase tracking-widest text-neutral-600">
              High Fashion & Atelier
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Vendor Vogue Luxury Retail Pvt. Ltd. | GSTIN: 27AABCV1234F1Z5
            </p>
            <p className="text-[11px] text-neutral-500">
              Regd. Office: 42 Fashion Boulevard, Bandra West, Mumbai 400050, India
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-black text-white text-xs font-mono font-bold uppercase tracking-wider">
              TAX INVOICE
            </span>
            <p className="text-xs font-mono mt-2">
              <strong>Invoice No:</strong> {invoiceNumber}
            </p>
            <p className="text-xs font-mono">
              <strong>Order Ref:</strong> VV-{displayId}
            </p>
            <p className="text-xs font-mono">
              <strong>Date:</strong> {orderDate.toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Screen Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/90 print:hidden">
        <div className="space-y-1">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.16em] text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO ORDER ARCHIVE</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-[0.06em] text-neutral-900 uppercase">
              ORDER VV-{displayId}
            </h1>
            <span
              className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 border ${
                order.status === "PAID" || order.status === "DELIVERED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                  : order.status === "CANCELLED"
                  ? "bg-red-50 text-red-800 border-red-300"
                  : "bg-neutral-100 text-neutral-800 border-neutral-300"
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs font-mono text-neutral-500">
            PLACED ON {formattedDate} • INVOICE: {invoiceNumber}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handlePrintInvoice}
            variant="outline"
            className="rounded-none h-11 px-5 border-neutral-300 hover:bg-neutral-100 text-xs font-mono uppercase tracking-[0.14em] cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-neutral-700" />
            <span>PRINT TAX INVOICE</span>
          </Button>
        </div>
      </div>

      {/* Status Progress Timeline / Cancelled Notice */}
      {isCancelled ? (
        <section className="bg-red-50 border border-red-200 p-6 space-y-2 print:hidden">
          <div className="flex items-center gap-2.5 text-red-800 font-bold uppercase tracking-wider text-xs font-mono">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>ORDER CANCELLED</span>
          </div>
          <p className="text-xs text-red-700">
            {order.cancellationReason || "This order was cancelled and any held stock reservations have been released back to active inventory."}
          </p>
          {order.paymentStatus === "REFUNDED" && (
            <p className="text-[11px] font-mono text-red-800 pt-1">
              PAYMENT REFUND: Initiated back to original payment source.
            </p>
          )}
        </section>
      ) : (
        <section className="bg-white border border-neutral-200/90 p-6 sm:p-7 space-y-4 print:hidden">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              LIFECYCLE STATUS TRACKING
            </span>
            <span className="text-xs font-mono text-neutral-600">
              CURRENT STAGE: <strong className="text-black uppercase">{order.status}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {steps.map((step, idx) => {
              const isPast = currentStep > idx;
              const isCurrent = currentStep === idx;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.label}
                  className={`p-3.5 border transition-all ${
                    isCurrent
                      ? "border-black bg-neutral-50 shadow-xs"
                      : isPast
                      ? "border-neutral-300 bg-white"
                      : "border-neutral-100 bg-neutral-50/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-neutral-400">
                      STAGE 0{idx + 1}
                    </span>
                    <StepIcon
                      className={`w-4 h-4 ${
                        isCurrent
                          ? "text-black"
                          : isPast
                          ? "text-emerald-600"
                          : "text-neutral-300"
                      }`}
                    />
                  </div>
                  <p
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isCurrent
                        ? "text-black"
                        : isPast
                        ? "text-neutral-800"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  <span className="text-[10px] font-mono text-neutral-500 mt-1 block">
                    {isCurrent ? "In Progress" : isPast ? "Completed" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Line Items Table */}
      <section className="bg-white border border-neutral-200/90 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-neutral-200/90 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400">
              MANIFEST
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
              PURCHASED ITEMS ({order.items.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            All prices inclusive of applicable GST
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200/90 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="py-3 px-4 sm:px-6">ITEM DESCRIPTION</th>
                <th className="py-3 px-4">HSN CODE</th>
                <th className="py-3 px-4 text-center">GST %</th>
                <th className="py-3 px-4 text-right">UNIT PRICE</th>
                <th className="py-3 px-4 text-center">QTY</th>
                <th className="py-3 px-4 sm:px-6 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50">
                  <td className="py-4 px-4 sm:px-6">
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-12 h-16 bg-neutral-100 shrink-0 overflow-hidden print:hidden border border-neutral-200/50">
                        <Image
                          loader={cloudinaryLoader}
                          src={item.image || "/images/hero/hero.jpg"}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover object-center"
                        />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold uppercase tracking-tight text-neutral-900">
                          {item.productName}
                        </p>
                        <p className="text-[10px] font-mono text-neutral-500">
                          VARIANT: {item.variantName || "Standard"} • SKU: {item.sku}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono text-neutral-600">
                    {item.hsnCode || "6203"}
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-neutral-600">
                    {item.gstRate}%
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-neutral-900">
                    ₹ {item.discountedUnitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-neutral-900 font-bold">
                    {item.quantity}
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right font-mono font-bold text-neutral-900">
                    ₹ {item.lineSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two-Column Financial Summary & Destination Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shipping Destination */}
        <section className="bg-white border border-neutral-200/90 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <MapPin className="w-4 h-4 text-neutral-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              SHIPPING RECIPIENT
            </h3>
          </div>
          <div className="text-xs space-y-1.5 font-sans text-neutral-700">
            <p className="font-bold text-black uppercase">
              {order.shippingAddress?.name}
            </p>
            <p>{order.shippingAddress?.addressLine1}</p>
            {order.shippingAddress?.addressLine2 && (
              <p>{order.shippingAddress?.addressLine2}</p>
            )}
            <p>
              {order.shippingAddress?.locality}, {order.shippingAddress?.city}
            </p>
            <p>
              {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
            <p className="text-[11px] font-mono text-neutral-500 pt-1">
              MOBILE: {order.shippingAddress?.phone}
            </p>
          </div>
        </section>

        {/* Payment & Gateway Ledger */}
        <section className="bg-white border border-neutral-200/90 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <CreditCard className="w-4 h-4 text-neutral-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              PAYMENT TRANSACTION
            </h3>
          </div>
          <div className="space-y-2 text-xs font-mono text-neutral-700">
            <div className="flex justify-between">
              <span className="text-neutral-400">METHOD:</span>
              <strong className="text-black uppercase">
                {isCod ? "CASH ON DELIVERY (COD)" : order.paymentProvider || "RAZORPAY GATEWAY"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">PAYMENT STATUS:</span>
              <span
                className={`font-bold ${
                  order.paymentStatus === "COMPLETED"
                    ? "text-emerald-700"
                    : order.paymentStatus === "REFUNDED"
                    ? "text-red-700"
                    : "text-neutral-800"
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>
            {order.paymentTransactionId && (
              <div className="flex justify-between">
                <span className="text-neutral-400">TXN REF:</span>
                <span className="text-neutral-900 truncate max-w-[150px]">
                  {order.paymentTransactionId}
                </span>
              </div>
            )}
            {order.paidAt && (
              <div className="flex justify-between">
                <span className="text-neutral-400">PAID AT:</span>
                <span>
                  {new Date(order.paidAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="pt-2 text-[10px] text-neutral-400 font-sans flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Cryptographically secured 256-bit payment verification</span>
            </div>
          </div>
        </section>

        {/* Tax & Financial Breakdown */}
        <section className="bg-neutral-50/70 border border-neutral-200/90 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200/80">
            <FileText className="w-4 h-4 text-neutral-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              LEGAL TAX BREAKDOWN
            </h3>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-neutral-600">
              <span>GROSS SUBTOTAL:</span>
              <span>₹ {order.cartSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {order.totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>TOTAL SAVINGS:</span>
                <span>- ₹ {order.totalDiscount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-600">
              <span>TAXABLE VALUE:</span>
              <span>₹ {order.totalTaxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>GST TOTAL (CGST + SGST):</span>
              <span>₹ {order.totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between text-neutral-600">
              <span>COURIER SHIPPING:</span>
              <span>
                {order.shippingFee === 0 ? "COMPLIMENTARY" : `₹ ${order.shippingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </span>
            </div>

            <div className="pt-3 border-t border-neutral-300 flex justify-between items-baseline text-sm font-bold text-neutral-900">
              <span className="tracking-wider uppercase">FINAL PAYABLE:</span>
              <span className="text-base text-black">
                ₹ {order.finalPayableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Print-Only Signature & Terms Footer */}
      <div className="hidden print:block pt-10 border-t border-neutral-300 text-xs text-neutral-500 space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p>1. This is a computer-generated tax invoice and requires no physical seal.</p>
            <p>2. Goods once sold can be exchanged within 7 days in original condition.</p>
            <p>3. Subject to Mumbai jurisdiction only.</p>
          </div>
          <div className="text-right space-y-8">
            <p className="font-mono uppercase font-bold text-black">
              FOR VENDOR VOGUE ATELIER
            </p>
            <p className="text-[10px] font-mono uppercase text-neutral-400">
              [ AUTHORIZED SIGNATORY ]
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
