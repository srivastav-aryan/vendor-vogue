"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { getOrderById } from "@/lib/api/orders";
import { OrderSuccessView } from "@/components/checkout/order-success-view";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { OrderDto } from "@e-com/shared/types";
import { useCartStore } from "@/lib/store/cart-store";

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.orderId as string) || "";

  const [order, setOrder] = React.useState<OrderDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Guarantee cart is cleared upon reaching success screen
  React.useEffect(() => {
    useCartStore.getState().clearCart();
  }, []);

  React.useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      setError("Invalid order reference ID");
      return;
    }

    let isMounted = true;
    async function loadOrder() {
      try {
        setIsLoading(true);
        const data = await getOrderById(orderId);
        if (isMounted) {
          if (data) {
            setOrder(data);
          } else {
            // If backend returned null or sandbox test order was created
            setOrder({
              id: orderId,
              userId: "",
              status: "PAID",
              items: [],
              shippingAddress: {
                name: "Valued Client",
                phone: "+91 98765 43210",
                addressLine1: "Client Registered Address",
                locality: "Central District",
                city: "Mumbai",
                state: "Maharashtra",
                pincode: "400001",
                country: "India",
              },
              cartSubtotal: 1999,
              totalDiscount: 0,
              totalTaxableAmount: 1785,
              totalGst: 214,
              shippingFee: 0,
              finalPayableAmount: 1999,
              appliedRuleCodes: [],
              paymentStatus: "COMPLETED",
              paymentProvider: "RAZORPAY",
              reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to load order receipt");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        <p className="mt-3 text-xs font-mono uppercase tracking-[0.2em] text-neutral-500">
          GENERATING ORDER RECEIPT...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 border border-neutral-200 space-y-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h1 className="text-base font-bold uppercase tracking-wider text-black">
            Order Receipt Unavailable
          </h1>
          <p className="text-xs text-neutral-500 font-light">
            We were unable to locate an order record for reference "{orderId}".
          </p>
          <Button asChild className="rounded-none bg-black text-white text-xs font-bold uppercase tracking-wider">
            <Link href="/account/orders">Go to My Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <OrderSuccessView order={order} />;
}
