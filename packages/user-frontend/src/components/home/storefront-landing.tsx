"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/home/hero";
import { BestsellerSection } from "@/components/home/bestseller-section";
import type { NavigationItem } from "@e-com/shared/types";
import { DEFAULT_NAV_ITEMS } from "@/lib/constants/navigation";
import type { BestsellerProduct } from "@/lib/api/products";

interface StorefrontLandingProps {
  navItems?: NavigationItem[];
  initialBestsellers?: BestsellerProduct[];
}

export function StorefrontLanding({
  navItems = DEFAULT_NAV_ITEMS,
  initialBestsellers,
}: StorefrontLandingProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Dynamic Header (transparent over hero, turns white on scroll) */}
      <Header isScrolled={isScrolled} navItems={navItems} />

      {/* Main Landmark for accessibility & SEO */}
      <main id="main-content">
        {/* Full Viewport Campaign Hero */}
        <Hero onScrollThresholdChange={setIsScrolled} />

        {/* Bestseller Product Section directly below Hero */}
        <BestsellerSection initialProducts={initialBestsellers} />
      </main>
    </div>
  );
}
