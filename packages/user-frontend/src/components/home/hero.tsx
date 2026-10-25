"use client";

import * as React from "react";
import Link from "next/link";
import { HERO_CONFIG, type HeroConfig } from "@/lib/constants/hero";

export interface HeroProps {
  config?: Partial<HeroConfig>;
  onScrollThresholdChange?: (isScrolled: boolean) => void;
  showEditorialOverlay?: boolean;
}

export function Hero({
  config,
  onScrollThresholdChange,
  showEditorialOverlay = true,
}: HeroProps) {
  const mergedConfig: HeroConfig = {
    ...HERO_CONFIG,
    ...config,
  };

  React.useEffect(() => {
    if (!onScrollThresholdChange) return;

    const handleScroll = () => {
      // Trigger white header once scrolled past threshold
      const isPast = window.scrollY > 40;
      onScrollThresholdChange(isPast);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [onScrollThresholdChange]);

  const isVideoMode = mergedConfig.mode === "video" && Boolean(mergedConfig.videoSrc);

  return (
    <section className="relative w-full h-[100dvh] min-h-[640px] overflow-hidden bg-[#070707] select-none">

      {/* Background Campaign Visual */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {isVideoMode ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={mergedConfig.posterSrc || mergedConfig.imageSrc}
            className="w-full h-full object-cover object-[center_30%] scale-100 transition-transform duration-1000 ease-out"
          >
            <source src={mergedConfig.videoSrc} type="video/mp4" />
          </video>
        ) : (
          /* Native Art-Directed Responsive Picture:
             Preserves model's face, clothing, jewelry, and background without awkward cropping */
          <picture className="w-full h-full">
            {mergedConfig.imageSrcMobile && (
              <source
                media="(max-width: 639px)"
                srcSet={mergedConfig.imageSrcMobile}
              />
            )}
            {mergedConfig.imageSrcTablet && (
              <source
                media="(max-width: 1023px)"
                srcSet={mergedConfig.imageSrcTablet}
              />
            )}
            <img
              src={mergedConfig.imageSrc}
              alt="Vendor Vogue Autumn/Winter 2026 Campaign"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-[center_28%] sm:object-[center_25%] md:object-center transition-transform duration-1000 ease-out will-change-transform"
            />
          </picture>
        )}
      </div>

      {/* Cinematic Edge Vignette */}
      <div
        className="cinematic-vignette absolute inset-0 pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Subtle Top Gradient for Floating Navigation Legibility */}
      <div
        className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-black/55 via-black/20 to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Very Subtle Cinematic Black Gradient toward Bottom to anchor typography without dimming model */}
      <div
        className="hero-bottom-gradient absolute inset-x-0 bottom-0 h-3/5 pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Fine Editorial Film Grain Overlay */}
      <div
        className="film-grain absolute inset-0 mix-blend-overlay opacity-60 pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Main Editorial Hero Typography & Elements */}
      {showEditorialOverlay && (
        <div className="relative z-20 h-full w-full flex flex-col justify-end px-6 sm:px-12 md:px-16 pb-12 sm:pb-14 md:pb-16 pointer-events-none">
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
            {/* Lower-Left Campaign Typography */}
            <div className="max-w-2xl pointer-events-auto">
              {/* Eyebrow */}
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.28em] text-white/75 mb-3 sm:mb-4 animate-in fade-in duration-700">
                AUTUMN / WINTER 2026
              </p>

              {/* Oversized Headline */}
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.25rem] font-black uppercase tracking-[-0.04em] leading-[0.85] text-white select-none drop-shadow-sm">
                VENDOR
                <br />
                VOGUE
              </h1>

              {/* Tagline */}
              <p className="mt-4 sm:mt-5 text-xs sm:text-sm tracking-[0.25em] font-light text-white/80 uppercase">
                THE NEW UNIFORM.
              </p>

              {/* Minimal Transparent CTA with Thin White Border */}
              <div className="mt-7 sm:mt-8">
                <Link
                  href={mergedConfig.ctaHref || "/catalog"}
                  className="inline-flex items-center gap-3 border border-white/45 hover:border-white text-white bg-transparent hover:bg-white hover:text-black px-6 sm:px-8 py-3 sm:py-3.5 text-[11px] sm:text-xs uppercase tracking-[0.25em] font-medium transition-all duration-300 group"
                >
                  <span>DISCOVER FW26</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>

            {/* Lower-Right Production Metadata */}
            <div className="pointer-events-auto select-none text-left sm:text-right">
              <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.26em] text-white/55 space-y-1 sm:space-y-1.5 leading-relaxed">
                <p>FW26 — 01</p>
                <p>CAMPAIGN / VENDOR VOGUE</p>
                <p>MUMBAI / 2026</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
