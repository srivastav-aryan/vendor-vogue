"use client";

import React, { useState } from "react";
import { OrderDto, OrderStatusDto } from "@e-com/shared/types";
import { clientApiFetch } from "@/lib/api-client";
import { revalidateOrdersAction } from "@/app/actions/order-actions";
import { formatDateTime, formatINR } from "@/lib/utils";
import {
  X,
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface OrderDetailModalProps {
  order: OrderDto | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: (updatedOrder: OrderDto) => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdated,
}: OrderDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusTransition = async (nextStatus: OrderStatusDto, reason?: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await clientApiFetch<OrderDto>(
        `/api/orders/${order.id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            reason: reason || `Updated via admin operations portal to ${nextStatus}`,
          }),
        }
      );

      await revalidateOrdersAction();
      onStatusUpdated(response.data);
      setShowCancelPrompt(false);
    } catch (err: any) {
      setError(err.message || "Failed to update order status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatusDto) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3.5 h-3.5" /> Paid & Ready
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Processing in Warehouse
          </span>
        );
      case "SHIPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3.5 h-3.5" /> Shipped & In-Transit
          </span>
        );
      case "DELIVERED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Order #{order.id}
                </h3>
                {getStatusBadge(order.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Placed on {formatDateTime(order.createdAt)} • Razorpay Verified
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Shipping Details Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Shipping Destination Snapshot
              </span>
              <div className="text-sm font-semibold text-slate-900">
                {order.shippingAddress.name}
              </div>
              <div className="text-xs text-slate-600 leading-relaxed">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                <br />
                {order.shippingAddress.locality}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </div>
              <div className="text-xs text-slate-500 font-mono pt-1">
                Phone: {order.shippingAddress.phone}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                Payment & Legal Snapshot
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-semibold text-emerald-600 uppercase">
                  {order.paymentStatus || "COMPLETED"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Provider:</span>
                <span className="font-mono text-slate-800">
                  {order.paymentProvider || "Razorpay Payment Gateway"}
                </span>
              </div>
              {order.paymentTransactionId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Txn Reference:</span>
                  <span className="font-mono text-slate-800 text-[11px]">
                    {order.paymentTransactionId}
                  </span>
                </div>
              )}
              {order.paidAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Paid Timestamp:</span>
                  <span className="text-slate-700">
                    {formatDateTime(order.paidAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Immutable Line Items Breakdown ({order.items.length})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Item & Variant</th>
                    <th className="py-2.5 px-4">HSN Code</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">GST Rate</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">
                          {item.productName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          SKU: {item.sku} • {item.variantName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {item.hsnCode}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatINR(item.discountedUnitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {item.gstRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatINR(item.lineSubtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-medium text-slate-900">
                  {formatINR(order.cartSubtotal)}
                </span>
              </div>
              {order.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discounts Applied:</span>
                  <span className="font-medium">
                    -{formatINR(order.totalDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Taxable Amount:</span>
                <span className="font-medium text-slate-900">
                  {formatINR(order.totalTaxableAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST (CGST + SGST):</span>
                <span className="font-medium text-slate-900">
                  {formatINR(order.totalGst)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Fee:</span>
                <span className="font-medium text-slate-900">
                  {order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Final Payable Amount:</span>
                <span className="text-emerald-700">
                  {formatINR(order.finalPayableAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Transition Action Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Fulfillment Workflow: <code className="text-slate-800 font-semibold">{order.status}</code>
          </div>

          <div className="flex items-center gap-2">
            {order.status === "PAID" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusTransition("PROCESSING")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                Move to PROCESSING
              </button>
            )}

            {order.status === "PROCESSING" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusTransition("SHIPPED")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                Dispatch & Mark SHIPPED
              </button>
            )}

            {order.status === "SHIPPED" && (
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusTransition("DELIVERED")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
              >
                {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Confirm Delivery (DELIVERED)
              </button>
            )}

            {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
              <>
                {showCancelPrompt ? (
                  <div className="flex items-center gap-2 animate-in fade-in">
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Cancellation reason..."
                      className="px-2.5 py-1.5 bg-white border border-rose-300 text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStatusTransition("CANCELLED", cancelReason)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
                    >
                      Confirm Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelPrompt(false)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setShowCancelPrompt(true)}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
