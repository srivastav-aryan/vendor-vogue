"use client";

import * as React from "react";
import Image from "next/image";
import { Plus, Check, ShieldCheck, Ruler, ArrowRight } from "lucide-react";
import type { ProductWithVariantsResponse, VariantResponse } from "@e-com/shared/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface ProductInfoPanelProps {
  product: ProductWithVariantsResponse;
}

export function ProductInfoPanel({ product }: ProductInfoPanelProps) {
  const variants = product.variants || [];

  // Default to first in-stock variant, or first variant
  const initialVariant =
    variants.find((v) => (v.availableStock ?? v.stockQuantity) > 0) ||
    variants[0];

  const [selectedVariant, setSelectedVariant] = React.useState<VariantResponse>(
    initialVariant || ({} as VariantResponse)
  );
  const [sizeChartOpen, setSizeChartOpen] = React.useState(false);
  const [emiModalOpen, setEmiModalOpen] = React.useState(false);
  const [sizeUnit, setSizeUnit] = React.useState<"in" | "cm">("in");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [crossSellAdded, setCrossSellAdded] = React.useState(false);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Derive active size attribute
  const getVariantSize = (v: VariantResponse): string => {
    const sizeAttr = v.attributes?.find(
      (a) => a.name.toLowerCase() === "size"
    );
    return sizeAttr ? sizeAttr.value : v.name.split("-").pop()?.trim() || "OS";
  };

  const selectedSize = getVariantSize(selectedVariant);

  // Compute specs line: "unisex | S-XL | 240 gsm | 7.1 oz"
  const sizeList = variants.map(getVariantSize);
  const sizeRangeStr =
    sizeList.length > 1
      ? `${sizeList[0]}-${sizeList[sizeList.length - 1]}`
      : sizeList[0] || "S-XL";

  const weightGsm = selectedVariant.weightInGrams || 240;
  const weightOz = (weightGsm / 33.906).toFixed(1);
  const specsLine = `unisex | ${sizeRangeStr} | ${weightGsm} gsm | ${weightOz} oz`;

  // Pricing formatting in INR
  const sellingPrice = selectedVariant.sellingPrice || 1999;
  const mrp = selectedVariant.mrp || 0;
  const isDiscounted = mrp > sellingPrice;

  const formattedPrice = `₹ ${sellingPrice.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedMrp = isDiscounted
    ? `₹ ${mrp.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;

  // Formula: Math.round(selectedVariant.sellingPrice / 3)
  const emiMonthly = Math.round(sellingPrice / 3);

  // Tags & Badges
  const tagsLower = (product.tags || []).map((t) => t.toLowerCase());
  const isNewArrival =
    tagsLower.includes("new-arrival") ||
    tagsLower.includes("new") ||
    tagsLower.includes("trending");
  const isBestseller = tagsLower.includes("bestseller");

  const handleAddToCart = () => {
    setToastMessage(`Added "${product.name}" (Size ${selectedSize.toUpperCase()}) to cart`);
  };

  const handleBuyNow = () => {
    setToastMessage(`Proceeding to checkout with Size ${selectedSize.toUpperCase()}...`);
  };

  const handleAddCrossSell = () => {
    setCrossSellAdded(true);
    setToastMessage(`Added "Heather Grey Sweatpants" to your bag!`);
  };

  return (
    <div className="w-full space-y-5 text-left font-sans select-none">
      {/* Toast Notification Pill */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xs bg-black px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <Check className="h-4 w-4 text-emerald-400 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. PRODUCT TITLE (Large, bold, clean uppercase sans-serif) */}
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-neutral-900 leading-[1.08]">
          {product.name}
        </h1>

        {/* 2. SPECS METADATA: Minimalist specs line directly below title */}
        <p className="mt-1.5 text-xs font-medium tracking-wide text-neutral-500 lowercase">
          {specsLine}
        </p>
      </div>

      {/* 3. PRICE (Formatted in INR with strikethrough MRP if discounted) */}
      <div className="flex items-baseline gap-3">
        <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">
          {formattedPrice}
        </span>
        {formattedMrp && (
          <span className="text-sm font-normal text-neutral-400 line-through">
            {formattedMrp}
          </span>
        )}
      </div>

      {/* 4. BADGES & FINTECH EMI BOX (Matching Reference Image) */}
      <div className="rounded-xl border border-neutral-200/80 bg-neutral-100/60 p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          {isNewArrival && (
            <Badge variant="emerald" className="text-[10px] px-1.5 py-0.5 rounded-[2px] leading-none">
              NEW
            </Badge>
          )}
          {isBestseller && !isNewArrival && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0.5 rounded-[2px] leading-none">
              BESTSELLER
            </Badge>
          )}
          <span className="text-neutral-700 font-medium">
            or <strong className="font-bold text-[#008a38]">₹{emiMonthly.toLocaleString("en-IN")}</strong> /month (3 months)
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-1.5 border-t border-neutral-200">
          <div className="flex items-center gap-1.5 font-medium">
            <span>No Cost EMI on</span>
            <span className="font-bold text-neutral-800">UPI</span>
            <span className="text-neutral-400">|</span>
            <span className="font-semibold text-neutral-800">snapmint</span>
          </div>

          <button
            type="button"
            onClick={() => setEmiModalOpen(true)}
            className="rounded-xs bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-neutral-800 transition-colors"
          >
            Buy On EMI
          </button>
        </div>
      </div>

      {/* 5. SOCIAL PROOF: Star rating with review count: ★★★★★ 9 reviews */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-[#e5a800] text-sm tracking-[-1px] select-none">
          ★★★★★
        </span>
        <button
          type="button"
          onClick={() => {
            const reviewsEl = document.getElementById("reviews-section");
            if (reviewsEl) reviewsEl.scrollIntoView({ behavior: "smooth" });
          }}
          className="text-xs font-semibold text-neutral-700 hover:text-black underline cursor-pointer"
        >
          9 reviews
        </button>
      </div>

      {/* 6. SIZE SELECTOR WITH STOCK CHECKS */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-900 uppercase tracking-wider">
            size: <strong className="font-bold">{selectedSize.toLowerCase()}</strong>
          </span>

          {/* Opens Size Chart Dialog */}
          <button
            type="button"
            onClick={() => setSizeChartOpen(true)}
            className="flex items-center gap-1 font-semibold uppercase tracking-wider text-neutral-900 underline hover:text-neutral-600 transition-colors"
          >
            <Ruler className="h-3 w-3" />
            SIZE CHART
          </button>
        </div>

        {/* Size Pill Buttons */}
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Product sizes">
          {variants.map((v) => {
            const sizeLabel = getVariantSize(v);
            const isSelected = v.id === selectedVariant.id;
            const stock = v.availableStock ?? v.stockQuantity ?? 0;
            const isOutOfStock = stock <= 0;

            return (
              <button
                key={v.id}
                type="button"
                disabled={isOutOfStock}
                onClick={() => setSelectedVariant(v)}
                aria-checked={isSelected}
                role="radio"
                className={cn(
                  "relative min-w-[50px] h-9 px-3.5 flex items-center justify-center text-xs font-semibold uppercase tracking-wider transition-all rounded-xs select-none",
                  isSelected
                    ? "bg-black text-white border-black shadow-xs"
                    : isOutOfStock
                    ? "border border-neutral-200 bg-neutral-100/60 text-neutral-400 cursor-not-allowed line-through"
                    : "border border-neutral-300 bg-white text-neutral-900 hover:border-black hover:bg-neutral-50"
                )}
              >
                {sizeLabel.toLowerCase()}
                {isOutOfStock && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 m-auto h-[1px] w-full rotate-[-25deg] bg-neutral-400"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Stock warning if low */}
        {(selectedVariant.availableStock ?? selectedVariant.stockQuantity ?? 0) <= 4 &&
          (selectedVariant.availableStock ?? selectedVariant.stockQuantity ?? 0) > 0 && (
            <p className="text-[11px] font-medium text-amber-600">
              Only {selectedVariant.availableStock ?? selectedVariant.stockQuantity} left in stock - order soon.
            </p>
          )}
      </div>

      {/* 7. ACTION BUTTONS (Using shadcn Button primitives) */}
      <div className="space-y-2.5 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddToCart}
          className="h-12 w-full rounded-xs border-neutral-300 bg-neutral-100/80 text-xs sm:text-sm font-semibold uppercase tracking-wider text-neutral-900 hover:bg-neutral-200 hover:text-black active:scale-[0.99] transition-all"
        >
          add to cart
        </Button>

        <Button
          type="button"
          onClick={handleBuyNow}
          className="h-12 w-full rounded-xs bg-black text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:bg-neutral-900 active:scale-[0.99] transition-all"
        >
          buy it now
        </Button>
      </div>

      {/* 8. ACCESSORIES & CROSS-SELL ("pair it with" card) */}
      <div className="pt-2">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Cross-sell Thumbnail */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xs bg-neutral-200 border border-neutral-200">
              <Image
                src="https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=200&auto=format&fit=crop&q=80"
                alt="Heather grey sweatpants"
                fill
                sizes="48px"
                className="object-cover object-center"
              />
            </div>

            <div className="text-left">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                pair it with
              </p>
              <p className="text-xs font-semibold text-neutral-900 leading-tight">
                heather grey sweatpants
              </p>
              <p className="text-xs font-medium text-neutral-600">
                ₹ 2,298.00
              </p>
            </div>
          </div>

          {/* Quick [+] Add Button */}
          <button
            type="button"
            onClick={handleAddCrossSell}
            aria-label="Add heather grey sweatpants to bag"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xs border transition-all duration-200",
              crossSellAdded
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-neutral-300 bg-white text-neutral-900 hover:bg-black hover:border-black hover:text-white"
            )}
          >
            {crossSellAdded ? (
              <Check className="h-4 w-4 stroke-[2.5]" />
            ) : (
              <Plus className="h-4 w-4 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>

      {/* 9. PROMO BANNER: Coral/rose alert box matching reference image */}
      <div className="w-full rounded-xs bg-[#e68a8a] px-4 py-2.5 text-center text-xs font-medium text-neutral-950">
        use code <strong className="font-bold underline">welcom3</strong> for 5% off your first order.
      </div>

      {/* 10. SHIPPING & POLICY FOOTNOTE */}
      <div className="pt-1 text-left text-[11px] text-neutral-500 leading-tight">
        <p className="font-semibold text-neutral-700 uppercase tracking-wider">easy returns</p>
        <p>within 7 days of delivery*</p>
      </div>

      {/* 11. STREETWEAR DETAILS ACCORDION (shadcn Accordion primitive) */}
      <div className="pt-3 border-t border-neutral-200">
        <Accordion type="single" collapsible defaultValue="details" className="w-full">
          <AccordionItem value="details" className="border-b border-neutral-200">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-neutral-900 py-3.5 hover:no-underline">
              Description & Silhouette
            </AccordionTrigger>
            <AccordionContent className="text-xs text-neutral-600 leading-relaxed space-y-2">
              <p>{product.description}</p>
              <ul className="list-disc pl-4 space-y-1 pt-1 text-[11px]">
                <li>Dropped shoulder cut with layered contrast sleeves</li>
                <li>High-density silk-screened vintage artwork</li>
                <li>Pre-shrunk, enzyme washed for authentic vintage handfeel</li>
                <li>Ribbed crew collar and reinforced double-needle hems</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fabric" className="border-b border-neutral-200">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-neutral-900 py-3.5 hover:no-underline">
              Fabric, Weight & Care
            </AccordionTrigger>
            <AccordionContent className="text-xs text-neutral-600 leading-relaxed space-y-1.5 text-[11px]">
              <p>• 100% combed heavyweight cotton (240 GSM / 7.1 oz/yd²)</p>
              <p>• Machine wash cold inside out with like colors</p>
              <p>• Hang dry in shade or tumble dry on low heat</p>
              <p>• Do not iron directly over screenprinted graphic</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="delivery" className="border-none">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-neutral-900 py-3.5 hover:no-underline">
              Free Shipping & Returns
            </AccordionTrigger>
            <AccordionContent className="text-xs text-neutral-600 leading-relaxed space-y-1.5 text-[11px]">
              <p>• All orders dispatch within 24-48 hours from our fulfillment center.</p>
              <p>• Standard courier delivery takes 3-5 business days across India.</p>
              <p>• Cash on Delivery (COD) available at checkout.</p>
              <p>• Hassle-free reverse pickups for size exchanges and returns within 7 days.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* SIZE CHART DIALOG (shadcn Dialog primitive) */}
      <Dialog open={sizeChartOpen} onOpenChange={setSizeChartOpen}>
        <DialogContent className="max-w-xl bg-white text-neutral-900 p-6 rounded-none sm:rounded-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-neutral-900">
              Streetwear Size Guide
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Measurements taken with garment laid flat. Designed for an intentional relaxed boxy streetwear drape.
            </DialogDescription>
          </DialogHeader>

          {/* Inches / CM Unit Switcher */}
          <div className="flex items-center justify-end gap-2 pt-2 pb-1">
            <span className="text-xs font-medium text-neutral-500">Unit:</span>
            <div className="inline-flex rounded-xs border border-neutral-300 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSizeUnit("in")}
                className={cn(
                  "px-2.5 py-0.5 rounded-xs transition-colors",
                  sizeUnit === "in" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
                )}
              >
                Inches
              </button>
              <button
                type="button"
                onClick={() => setSizeUnit("cm")}
                className={cn(
                  "px-2.5 py-0.5 rounded-xs transition-colors",
                  sizeUnit === "cm" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
                )}
              >
                CM
              </button>
            </div>
          </div>

          {/* Size Chart Table */}
          <div className="overflow-x-auto border border-neutral-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-100 text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                <tr>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Chest</th>
                  <th className="py-2.5 px-3">Length</th>
                  <th className="py-2.5 px-3">Shoulder</th>
                  <th className="py-2.5 px-3">Sleeve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
                {[
                  { size: "S", chest: [42, 107], length: [28, 71], shoulder: [21, 53], sleeve: [24, 61] },
                  { size: "M", chest: [44, 112], length: [29, 74], shoulder: [22, 56], sleeve: [24.5, 62] },
                  { size: "L", chest: [46, 117], length: [30, 76], shoulder: [23, 58], sleeve: [25, 63.5] },
                  { size: "XL", chest: [48, 122], length: [31, 79], shoulder: [24, 61], sleeve: [25.5, 65] },
                  { size: "XXL", chest: [50, 127], length: [32, 81], shoulder: [25, 63.5], sleeve: [26, 66] },
                ].map((row) => (
                  <tr
                    key={row.size}
                    className={cn(
                      "hover:bg-neutral-50 transition-colors",
                      row.size.toLowerCase() === selectedSize.toLowerCase() && "bg-neutral-100/70 font-bold"
                    )}
                  >
                    <td className="py-2 px-3 font-sans font-bold">{row.size}</td>
                    <td className="py-2 px-3">
                      {sizeUnit === "in" ? `${row.chest[0]}"` : `${row.chest[1]} cm`}
                    </td>
                    <td className="py-2 px-3">
                      {sizeUnit === "in" ? `${row.length[0]}"` : `${row.length[1]} cm`}
                    </td>
                    <td className="py-2 px-3">
                      {sizeUnit === "in" ? `${row.shoulder[0]}"` : `${row.shoulder[1]} cm`}
                    </td>
                    <td className="py-2 px-3">
                      {sizeUnit === "in" ? `${row.sleeve[0]}"` : `${row.sleeve[1]} cm`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-neutral-500 pt-2">
            Tip: Model is 6&apos;1&quot; (185 cm) wearing size L for a boxy streetwear fit.
          </p>
        </DialogContent>
      </Dialog>

      {/* FINTECH EMI DETAILS DIALOG */}
      <Dialog open={emiModalOpen} onOpenChange={setEmiModalOpen}>
        <DialogContent className="max-w-md bg-white text-neutral-900 p-6 rounded-none sm:rounded-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-neutral-900">
              No Cost EMI Breakdown
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Pay over time in monthly installments with 0% interest on debit/credit cards or UPI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {[
              { months: 3, amount: emiMonthly, interest: "0% Interest", note: "Recommended" },
              { months: 6, amount: Math.round(sellingPrice / 6), interest: "0% Interest", note: "No extra charges" },
              { months: 9, amount: Math.round(sellingPrice / 9), interest: "0% Interest", note: "Standard terms" },
            ].map((plan) => (
              <div
                key={plan.months}
                className="flex items-center justify-between p-3 rounded-xs border border-neutral-200 bg-neutral-50/60"
              >
                <div>
                  <p className="text-xs font-bold text-neutral-900">
                    {plan.months} Months Plan
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    ₹{plan.amount.toLocaleString("en-IN")}/month ({plan.interest})
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50">
                  {plan.note}
                </Badge>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-neutral-500">
            Powered by Snapmint & Razorpay UPI Autopay. Instant paperless approval at checkout.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
