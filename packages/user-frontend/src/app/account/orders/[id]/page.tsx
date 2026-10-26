"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { getOrderById } from "@/lib/api/orders";
import { OrderDetailView } from "@/components/account/order-detail-view";
import { Button } from "@/components/ui/button";
import type { OrderDto } from "@e-com/shared/types";

export default function AccountOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "";

  const [order, setOrder] = React.useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOrder = React.useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      setError("Invalid order identifier");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getOrderById(orderId);
      if (data) {
        setOrder(data);
      } else {
        setError(
          "Order record could not be found in your account archive. It may belong to another account or have expired."
        );
      }
    } catch (err: any) {
      console.error("[Order Detail] Error loading order:", err);
      setError(err?.message || "Failed to load order details from backend");
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-7 h-7 animate-spin mx-auto text-neutral-400" />
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-neutral-500">
          RETRIEVING ORDER MANIFEST & INVOICE...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 sm:p-12 text-center border border-neutral-200/90 bg-white shadow-xs max-w-xl mx-auto space-y-5">
        <div className="w-12 h-12 mx-auto bg-neutral-100 flex items-center justify-center text-neutral-500">
          <AlertCircle className="w-6 h-6 text-neutral-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-black">
            ORDER NOT FOUND
          </h2>
          <p className="text-xs text-neutral-500 font-light leading-relaxed">
            {error || "Unable to retrieve order details from the server."}
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => fetchOrder()}
            variant="outline"
            className="rounded-none text-xs font-mono uppercase tracking-wider h-10 px-5 border-neutral-300 w-full sm:w-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            <span>RETRY</span>
          </Button>
          <Button
            asChild
            className="rounded-none bg-black text-white hover:bg-neutral-800 text-xs font-mono uppercase tracking-wider h-10 px-5 w-full sm:w-auto"
          >
            <Link href="/account/orders">
              <ArrowLeft className="w-3.5 h-3.5 mr-2" />
              <span>RETURN TO ORDERS</span>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <OrderDetailView order={order} />;
}
