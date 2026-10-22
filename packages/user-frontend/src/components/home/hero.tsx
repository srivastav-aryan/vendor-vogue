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

  const topSentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!topSentinelRef.current || !onScrollThresholdChange) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the top sentinel scrolls out of view, the user has scrolled down
        onScrollThresholdChange(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        rootMargin: "0px",
      }
    );

    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [onScrollThresholdChange]);

  const isVideoMode = mergedConfig.mode === "video" && Boolean(mergedConfig.videoSrc);

  return (
    <section className="relative w-full h-[100dvh] overflow-hidden bg-black select-none">
      {/* Top Sentinel for instant, natural scroll transition */}
      <div
        ref={topSentinelRef}
        className="absolute top-20 left-0 w-full h-1 pointer-events-none"
        aria-hidden="true"
      />

      {/* Background Media */}
      {isVideoMode ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={mergedConfig.posterSrc || mergedConfig.imageSrc}
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src={mergedConfig.videoSrc} type="video/mp4" />
        </video>
      ) : (
        /* Native Art-Directed Responsive Picture:
           Browser evaluates media queries natively to download ONLY the exact viewport asset,
           preventing dual-downloads on mobile and eliminating layout shifts. */
        <picture className="absolute inset-0 w-full h-full">
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
            alt={mergedConfig.title || "Hero campaign visual"}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
        </picture>
      )}

      {/* Subtle top gradient vignette to guarantee header legibility over bright photography */}
      <div
        className="absolute top-0 left-0 w-full h-44 bg-gradient-to-b from-black/75 via-black/35 to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Editorial Content Overlay */}
      {showEditorialOverlay && (
        <div className="absolute inset-x-0 bottom-0 z-20 px-6 sm:px-12 md:px-16 pb-10 sm:pb-14 pt-32 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col items-center sm:items-start text-center sm:text-left text-white">
          {mergedConfig.subtitle && (
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/80 mb-2 sm:mb-3">
              {mergedConfig.subtitle}
            </p>
          )}

          {mergedConfig.title && (
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-display tracking-tight uppercase mb-4 sm:mb-6 drop-shadow-md">
              {mergedConfig.title}
            </h1>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
            {mergedConfig.ctaText && mergedConfig.ctaHref && (
              <Link
                href={mergedConfig.ctaHref}
                className="inline-flex items-center justify-center px-7 sm:px-9 py-3 sm:py-3.5 text-xs sm:text-sm font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-200 transition-colors shadow-lg rounded-xs"
              >
                {mergedConfig.ctaText}
              </Link>
            )}

            {mergedConfig.quickLinks && mergedConfig.quickLinks.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-white/90">
                <span className="opacity-50">Quick links:</span>
                {mergedConfig.quickLinks.map((ql, idx) => (
                  <React.Fragment key={ql.label}>
                    {idx > 0 && <span className="opacity-40">/</span>}
                    <Link
                      href={ql.href}
                      className="hover:text-white hover:underline underline-offset-4 transition-colors"
                    >
                      {ql.label}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
