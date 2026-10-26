"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Minus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";
import { useHydratedStore } from "@/lib/store/use-store";
import cloudinaryLoader from "@/lib/cloudinary-loader";

export function CartDrawer() {
  const router = useRouter();
  const isDrawerOpen = useCartStore((s) => s.isDrawerOpen);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const items = useHydratedStore(useCartStore, (s) => s.items) || [];
  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const formattedSubtotal = `₹ ${subtotal.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className="w-[90vw] sm:max-w-md p-0 flex flex-col bg-white text-neutral-900 border-l border-neutral-200 select-none"
      >
        {/* Drawer Header */}
        <SheetHeader className="p-5 sm:p-6 pb-4 border-b border-neutral-200 text-left">
          <SheetTitle className="text-sm font-extrabold uppercase tracking-[0.2em] text-neutral-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 stroke-[2.2]" />
            <span>Shopping Bag ({totalCount})</span>
          </SheetTitle>
        </SheetHeader>

        {/* Drawer Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Your Bag is Empty
              </p>
              <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                Explore the latest streetwear drops, oversized essentials, and curated footwear.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-2 text-xs uppercase tracking-widest font-bold h-10 px-6 rounded-none bg-black text-white hover:bg-neutral-800"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 divide-y divide-neutral-100 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="pt-4 first:pt-0 flex gap-4 items-start"
                >
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={() => setDrawerOpen(false)}
                    className="relative w-20 aspect-[3/4] bg-neutral-100 shrink-0 overflow-hidden"
                  >
                    <Image
                      loader={cloudinaryLoader}
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover object-center"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="block text-xs font-bold uppercase tracking-tight text-neutral-900 hover:text-neutral-600 line-clamp-1 transition-colors"
                    >
                      {item.name}
                    </Link>

                    <p className="text-[11px] font-mono text-neutral-500 uppercase">
                      Size: <strong className="text-neutral-800">{item.size}</strong>
                    </p>

                    <p className="text-xs font-bold text-neutral-900 pt-0.5">
                      ₹ {item.price.toLocaleString("en-IN")}
                    </p>

                    {/* Quantity Selector & Remove */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="inline-flex items-center border border-neutral-300 rounded-none bg-white">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-mono text-xs font-semibold text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() => removeItem(item.id)}
                        className="text-neutral-400 hover:text-neutral-700 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer with Subtotal & Checkout */}
            <div className="p-5 sm:p-6 border-t border-neutral-200 bg-neutral-50/60 space-y-3">
              <div className="flex items-baseline justify-between text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-900">
                <span>Subtotal</span>
                <span className="text-base font-bold font-mono">
                  {formattedSubtotal}
                </span>
              </div>

              <p className="text-[11px] text-neutral-500 leading-tight">
                Taxes & standard express shipping calculated at checkout.
              </p>

              <Button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  router.push("/checkout");
                }}
                className="w-full h-12 bg-black hover:bg-neutral-900 text-white text-xs sm:text-sm font-bold uppercase tracking-[0.2em] rounded-none shadow-md flex items-center justify-center gap-2 group transition-all cursor-pointer"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
