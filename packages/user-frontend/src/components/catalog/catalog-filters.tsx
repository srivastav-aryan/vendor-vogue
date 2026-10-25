"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { NavigationItem, BrandResponse } from "@e-com/shared/types";
import { cn } from "@/lib/utils";

interface CatalogFiltersProps {
  navItems?: NavigationItem[];
  brands?: BrandResponse[];
  activeCategory?: string;
  activeBrandId?: string;
  activeTags?: string;
  activeMinPrice?: number;
  activeMaxPrice?: number;
  searchQuery?: string;
  mode?: "mobile" | "desktop" | "both";
}

const TAG_OPTIONS = [
  { label: "All Items", value: "" },
  { label: "Bestsellers", value: "bestseller" },
  { label: "Trending", value: "trending" },
  { label: "Limited Edition", value: "limited" },
  { label: "New Arrivals", value: "new-arrival" },
];

const PRICE_TIERS = [
  { label: "All Prices", min: undefined, max: undefined },
  { label: "Under ₹2,000", min: 0, max: 2000 },
  { label: "₹2,000 – ₹3,500", min: 2000, max: 3500 },
  { label: "Above ₹3,500", min: 3500, max: undefined },
];

export function CatalogFilters({
  navItems = [],
  brands = [],
  activeCategory,
  activeBrandId,
  activeTags = "",
  activeMinPrice,
  activeMaxPrice,
  searchQuery,
  mode = "both",
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const hasActiveFilters = Boolean(
    activeCategory ||
      activeBrandId ||
      activeTags ||
      activeMinPrice !== undefined ||
      activeMaxPrice !== undefined ||
      searchQuery
  );

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`/catalog?${params.toString()}`);
    setMobileOpen(false);
  };

  const updatePriceTier = (min?: number, max?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (min !== undefined) {
      params.set("minPrice", String(min));
    } else {
      params.delete("minPrice");
    }

    if (max !== undefined) {
      params.set("maxPrice", String(max));
    } else {
      params.delete("maxPrice");
    }

    params.set("page", "1");
    router.push(`/catalog?${params.toString()}`);
    setMobileOpen(false);
  };

  const clearAllFilters = () => {
    router.push("/catalog");
    setMobileOpen(false);
  };

  const filterContent = (
    <div className="space-y-8 select-none">
      {/* Active Filter Clear CTA */}
      {hasActiveFilters && (
        <div className="pb-4 border-b border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={clearAllFilters}
            className="w-full h-8 text-[11px] font-bold uppercase tracking-wider text-neutral-800 hover:text-black border-neutral-300 rounded-none flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Clear All Filters
          </Button>
        </div>
      )}

      {/* 1. COLLECTIONS / TAGS */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-900">
          Collections
        </h3>
        <div className="flex flex-col space-y-1.5">
          {TAG_OPTIONS.map((tag) => {
            const isSelected = activeTags === tag.value;
            return (
              <button
                key={tag.label}
                type="button"
                onClick={() => updateParam("tags", tag.value)}
                className={cn(
                  "text-left text-xs uppercase tracking-wider py-1.5 transition-colors font-medium flex items-center justify-between",
                  isSelected
                    ? "text-black font-extrabold"
                    : "text-neutral-500 hover:text-black"
                )}
              >
                <span>{tag.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PRICE RANGE */}
      <div className="space-y-3 pt-2 border-t border-neutral-200">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-900">
          Price Range
        </h3>
        <div className="flex flex-col space-y-1.5">
          {PRICE_TIERS.map((tier) => {
            const isSelected =
              activeMinPrice === tier.min && activeMaxPrice === tier.max;
            return (
              <button
                key={tier.label}
                type="button"
                onClick={() => updatePriceTier(tier.min, tier.max)}
                className={cn(
                  "text-left text-xs uppercase tracking-wider py-1.5 transition-colors font-medium flex items-center justify-between",
                  isSelected
                    ? "text-black font-extrabold"
                    : "text-neutral-500 hover:text-black"
                )}
              >
                <span>{tier.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. BRANDS */}
      {brands && brands.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-neutral-200">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-900">
            Brands
          </h3>
          <div className="flex flex-col space-y-1.5">
            <button
              type="button"
              onClick={() => updateParam("brandId", undefined)}
              className={cn(
                "text-left text-xs uppercase tracking-wider py-1.5 transition-colors font-medium flex items-center justify-between",
                !activeBrandId
                  ? "text-black font-extrabold"
                  : "text-neutral-500 hover:text-black"
              )}
            >
              <span>All Brands</span>
              {!activeBrandId && (
                <span className="w-1.5 h-1.5 rounded-full bg-black" />
              )}
            </button>
            {brands.map((brand) => {
              const isSelected =
                activeBrandId === brand.id ||
                activeBrandId === brand.slug ||
                activeBrandId?.toLowerCase() === brand.name.toLowerCase();
              return (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() =>
                    updateParam(
                      "brandId",
                      isSelected ? undefined : brand.id || brand.slug
                    )
                  }
                  className={cn(
                    "text-left text-xs uppercase tracking-wider py-1.5 transition-colors font-medium flex items-center justify-between",
                    isSelected
                      ? "text-black font-extrabold"
                      : "text-neutral-500 hover:text-black"
                  )}
                >
                  <span className="truncate pr-2">{brand.name}</span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderMobile = (
    <div className={cn("lg:hidden", mode === "desktop" && "hidden")}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setMobileOpen(true)}
        className="h-9 px-4 text-xs font-bold uppercase tracking-wider rounded-none border-neutral-300 flex items-center gap-2"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-black" />
        )}
      </Button>

      {/* Mobile Slide-Out Filter Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[85vw] sm:max-w-xs p-6 bg-white text-neutral-900 border-r border-neutral-200 overflow-y-auto"
        >
          <SheetHeader className="pb-4 mb-4 border-b border-neutral-200 text-left">
            <SheetTitle className="text-sm font-extrabold uppercase tracking-[0.2em] text-neutral-900 flex items-center justify-between">
              <span>Filter Catalog</span>
            </SheetTitle>
          </SheetHeader>
          {filterContent}
        </SheetContent>
      </Sheet>
    </div>
  );

  const renderDesktop = (
    <aside className={cn("hidden lg:block w-full sticky top-28 self-start pr-6", mode === "mobile" && "hidden")}>
      {filterContent}
    </aside>
  );

  if (mode === "mobile") return renderMobile;
  if (mode === "desktop") return renderDesktop;

  return (
    <>
      {renderMobile}
      {renderDesktop}
    </>
  );
}
