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

  const lastPastRef = React.useRef(false);

  React.useEffect(() => {
    if (!onScrollThresholdChange) return;

    const handleScroll = () => {
      // Trigger white header once scrolled past threshold
      const isPast = window.scrollY > 40;
      if (lastPastRef.current !== isPast) {
        lastPastRef.current = isPast;
        onScrollThresholdChange(isPast);
      }
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
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-[center_28%] sm:object-[center_25%] md:object-center transition-transform duration-1000 ease-out will-change-transform"
            />
          </picture>
        )}
      </div>

      {/* Subtle Top Gradient strictly for Floating Navigation Legibility */}
      <div
        className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-black/45 via-black/15 to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Low Bottom Gradient strictly behind the bottom typography (leaves 100% of the middle clear) */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 sm:h-52 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Main Editorial Hero Typography & Elements */}
      {showEditorialOverlay && (
        <div className="relative z-20 h-full w-full flex flex-col justify-end px-6 sm:px-10 md:px-14 pb-8 sm:pb-12 md:pb-14 pointer-events-none">
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 sm:gap-8">
            {/* Lower-Left Campaign Typography (Refined, perfectly balanced) */}
            <div className="max-w-xl pointer-events-auto">
              {/* Eyebrow */}
              <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-white/80 mb-2 sm:mb-2.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                AUTUMN / WINTER 2026
              </p>

              {/* Refined Headline: impactful without dominating the frame */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-[-0.03em] leading-[0.88] text-white select-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
                VENDOR
                <br />
                VOGUE
              </h1>

              {/* Tagline */}
              <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm tracking-[0.22em] font-light text-white/90 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                THE NEW UNIFORM.
              </p>

              {/* Clean Luxury CTA Button */}
              <div className="mt-5 sm:mt-6">
                <Link
                  href={mergedConfig.ctaHref || "/catalog"}
                  className="group inline-flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-white text-black hover:bg-neutral-900 hover:text-white border border-white text-[10px] sm:text-[11px] uppercase tracking-[0.22em] font-bold transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.4)] hover:scale-105 active:scale-95"
                >
                  <span>DISCOVER FW26</span>
                  <span className="text-xs font-light transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Lower-Right Production Metadata */}
            <div className="pointer-events-auto select-none text-left sm:text-right">
              <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.24em] text-white/70 space-y-1 sm:space-y-1.5 leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
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
