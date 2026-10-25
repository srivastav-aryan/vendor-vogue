"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { BestsellerProduct } from "@/lib/api/products";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: BestsellerProduct;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const [imageError, setImageError] = React.useState(false);

  const hasSecondaryImage =
    Boolean(product.images[1]) && product.images[1] !== product.images[0];

  // Derive Dynamic Badges matching Image 1 specifications
  const tagsLower = (product.tags || []).map((t) => t.toLowerCase());
  const badges: Array<{ text: string; variant: "black" | "blue" }> = [];

  // 1. LIMITED
  if (tagsLower.includes("limited")) {
    badges.push({ text: "LIMITED", variant: "black" });
  }

  // 2. BESTSELLER
  if (tagsLower.includes("bestseller") || tagsLower.length === 0) {
    badges.push({ text: "BESTSELLER", variant: "black" });
  }

  // 3. BACK IN STOCK
  if (
    tagsLower.includes("back in stock") ||
    tagsLower.includes("back-in-stock") ||
    tagsLower.includes("trending")
  ) {
    // Only display back in stock if inventory is available
    if (product.stockQuantity > 0) {
      badges.push({ text: "BACK IN STOCK", variant: "black" });
    }
  }

  // 4. SOLD OUT
  if (
    product.stockQuantity === 0 ||
    tagsLower.includes("sold out") ||
    tagsLower.includes("sold-out")
  ) {
    badges.push({ text: "SOLD OUT", variant: "black" });
  }

  // 5. SAVE X% (if MRP > sellingPrice)
  const isDiscounted =
    Boolean(product.mrp) && product.mrp > product.sellingPrice;
  const discountPercent = isDiscounted
    ? Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100)
    : 0;

  if (isDiscounted && discountPercent > 0) {
    badges.push({ text: `SAVE ${discountPercent}%`, variant: "blue" });
  }

  // Formatted INR Prices (e.g. ₹ 1,798.00)
  const formattedSellingPrice = `₹ ${product.sellingPrice.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedMrp = product.mrp
    ? `₹ ${product.mrp.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null;

  // Formula: Math.round(sellingPrice / 3)
  const emiAmount = Math.round(product.sellingPrice / 3);

  const primaryImageSrc = imageError
    ? "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=85"
    : product.images[0] ||
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=85";

  return (
    <article
      className={cn(
        "group relative flex flex-col w-full text-left font-sans select-none",
        className
      )}
    >
      {/* 4. FUTURE PDP LINKING STRUCTURE: Wraps the entire card */}
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        aria-label={`${product.name} - ${formattedSellingPrice}`}
      >
        {/* Product Image Container (Clean 3:4 Aspect Ratio) */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f6f6f6]">
          {/* Primary Product Image */}
          <Image
            src={primaryImageSrc}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            onError={() => setImageError(true)}
            className={cn(
              "object-cover object-center transition-all duration-300",
              hasSecondaryImage
                ? "group-hover:opacity-0"
                : "group-hover:scale-105"
            )}
          />

          {/* Hover Image Swap: Smoothly reveals secondary image if available */}
          {hasSecondaryImage && (
            <Image
              src={product.images[1]}
              alt={`${product.name} alternate angle`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className="object-cover object-center opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}

          {/* Badges: Lower-Left Overlay on Image */}
          {badges.length > 0 && (
            <div
              className="absolute bottom-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none"
              aria-label="Product badges"
            >
              {badges.map((badge, idx) => (
                <span
                  key={`${badge.text}-${idx}`}
                  className={cn(
                    "px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold tracking-wider uppercase leading-none rounded-none shadow-sm",
                    badge.variant === "blue"
                      ? "bg-[#0055ff] text-white"
                      : "bg-black text-white"
                  )}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Block */}
        <div className="pt-3 flex flex-col gap-1">
          {/* Product Title: Bold, uppercase, clean grotesk typography */}
          <h3 className="text-xs md:text-[13px] font-extrabold uppercase tracking-tight text-neutral-900 line-clamp-1 group-hover:text-neutral-600 transition-colors">
            {product.name}
          </h3>

          {/* Pricing: Formatted in INR. If discounted: blue accent with strikethrough MRP */}
          <div className="flex items-center text-xs md:text-[13px]">
            {isDiscounted ? (
              <p className="flex items-center">
                <span className="font-bold text-[#0055ff]">
                  {formattedSellingPrice}
                </span>
                {formattedMrp && (
                  <span className="ml-2 font-normal text-neutral-400 line-through text-[11px] md:text-xs">
                    {formattedMrp}
                  </span>
                )}
              </p>
            ) : (
              <p className="font-semibold text-neutral-900">
                {formattedSellingPrice}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Installment / EMI Snippet: Minimal pill (formula: Math.round(sellingPrice / 3)) */}
      <div className="mt-1 flex items-center">
        <div className="inline-flex items-stretch border border-neutral-300 rounded-[2px] text-[10px] md:text-[11px] overflow-hidden bg-white select-none">
          <span className="px-1.5 py-0.5 text-neutral-600 font-normal flex items-center">
            or&nbsp;<strong className="font-semibold text-[#008a38]">₹{emiAmount.toLocaleString("en-IN")}</strong>/month
          </span>
          <span className="bg-black text-white px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center">
            Buy On EMI
          </span>
        </div>
      </div>

      {/* Social Proof: Star rating and review count: ★★★★★ (4.7) */}
      <div
        className="mt-1.5 flex items-center gap-1 text-xs"
        aria-label={`Rated ${product.rating.toFixed(1)} out of 5 stars`}
      >
        <span className="text-[#e5a800] tracking-[-1px] text-xs select-none">
          ★★★★★
        </span>
        <span className="text-[11px] md:text-xs font-semibold text-neutral-700">
          ({product.rating.toFixed(1)})
        </span>
      </div>
    </article>
  );
}

/**
 * Clean skeleton placeholder matching exact ProductCard dimensions.
 * Prevents Cumulative Layout Shift (CLS = 0) during data loading.
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col w-full text-left animate-pulse" aria-hidden="true">
      {/* Image Skeleton */}
      <div className="relative aspect-[3/4] w-full bg-neutral-200" />

      {/* Content Skeletons */}
      <div className="pt-3 flex flex-col gap-2">
        <div className="h-3.5 bg-neutral-200 w-4/5 rounded-none" />
        <div className="h-3.5 bg-neutral-200 w-2/5 rounded-none" />
      </div>

      <div className="mt-1.5 h-5 bg-neutral-200 w-36 rounded-none" />
      <div className="mt-1.5 h-3 bg-neutral-200 w-20 rounded-none" />
    </div>
  );
}
