"use client";

import * as React from "react";
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/home/hero";
import type { NavigationItem } from "@e-com/shared/types";
import { DEFAULT_NAV_ITEMS } from "@/lib/constants/navigation";

interface StorefrontLandingProps {
  navItems?: NavigationItem[];
}

export function StorefrontLanding({
  navItems = DEFAULT_NAV_ITEMS,
}: StorefrontLandingProps) {
  const [isScrolled, setIsScrolled] = React.useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Dynamic Header */}
      <Header isScrolled={isScrolled} navItems={navItems} />

      {/* Hero Section */}
      <Hero onScrollThresholdChange={setIsScrolled} />

      {/* Clean Scroll Area (To test header turning white on scroll) */}
      <div
        id="storefront-content"
        className="min-h-screen bg-white"
        aria-hidden="true"
      />
    </div>
  );
}
