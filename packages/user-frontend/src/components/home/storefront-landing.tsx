import * as React from "react";
import { Header } from "@/components/layout/header";
import { Hero } from "@/components/home/hero";
import { BestsellerSection } from "@/components/home/bestseller-section";
import { InfiniteMarquee } from "@/components/common/infinite-marquee";
import { TrendingSection } from "@/components/home/trending-section";
import { CampaignBannerVideo } from "@/components/home/campaign-banner-video";
import { LimitedSection } from "@/components/home/limited-section";
import { DiscoverCampaignSection } from "@/components/home/discover-campaign-section";
import type { NavigationItem } from "@e-com/shared/types";
import { DEFAULT_NAV_ITEMS } from "@/lib/constants/navigation";
import type { BestsellerProduct } from "@/lib/constants/products";

interface StorefrontLandingProps {
  navItems?: NavigationItem[];
  initialBestsellers?: BestsellerProduct[];
  initialTrending?: BestsellerProduct[];
  initialLimited?: BestsellerProduct[];
}

export function StorefrontLanding({
  navItems = DEFAULT_NAV_ITEMS,
  initialBestsellers,
  initialTrending,
  initialLimited,
}: StorefrontLandingProps) {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Dynamic Header (transparent over hero, turns white on scroll) */}
      <Header navItems={navItems} />

      {/* Main Landmark for accessibility & SEO */}
      <main id="main-content">
        {/* Full Viewport Campaign Hero */}
        <Hero />

        {/* Bestseller Product Section directly below Hero */}
        <BestsellerSection initialProducts={initialBestsellers} />

        {/* Infinite Brand Marquee placed AFTER Bestseller Section */}
        <InfiniteMarquee text="Vendor Vogue™" />

        {/* Trending Product Section placed AFTER Marquee */}
        <TrendingSection initialProducts={initialTrending} />

        {/* Cinematic Campaign Banner Video Strip directly below Trending Section */}
        <CampaignBannerVideo />

        {/* Limited Product Section placed between Video and Discover */}
        <LimitedSection initialProducts={initialLimited} />

        {/* Editorial Discover Campaign Section using discover.webp */}
        <DiscoverCampaignSection />
      </main>
    </div>
  );
}
