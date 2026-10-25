"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface CampaignBannerVideoProps {
  desktopVideoSrc?: string;
  mobileVideoSrc?: string;
  posterSrc?: string;
  mobilePosterSrc?: string;
  tagline?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
}

export function CampaignBannerVideo({
  desktopVideoSrc = "/videos/banner.mp4?v=faststart",
  mobileVideoSrc = "/videos/banner-mobile.mp4?v=faststart",
  posterSrc = "/videos/banner-poster.jpg?v=1",
  mobilePosterSrc = "/videos/banner-poster-mobile.jpg?v=1",
  tagline = "AUTUMN / WINTER 2026",
  title = "CHAOS IN SILENCE",
  subtitle = "Heavyweight drape and raw architectural silhouettes engineered for the streetwear vanguard.",
  ctaText = "EXPLORE DROP",
  ctaHref = "/catalog?filter=trending",
  className,
}: CampaignBannerVideoProps) {
  const containerRef = React.useRef<HTMLElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [activePoster, setActivePoster] = React.useState(posterSrc);
  const hasLoadedSrcRef = React.useRef(false);

  // Set lightweight mobile poster on small screens
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches) {
      setActivePoster(mobilePosterSrc);
    }
  }, [mobilePosterSrc]);

  // Robust Proximity & Playback Observer:
  // - Starts with preload="none" and NO video source, so initial Lighthouse/FCP download is 0 KB.
  // - Once the user scrolls within 250px of the banner, assigns the appropriate stream (1.9MB on mobile, 7.4MB faststart on desktop).
  // - Automatically pauses when scrolled away to completely eliminate background CPU/GPU lag.
  React.useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          // 1. Lazy load stream on first near-viewport scroll
          if (!hasLoadedSrcRef.current) {
            hasLoadedSrcRef.current = true;
            const isMobile = window.matchMedia("(max-width: 768px)").matches;
            video.src = isMobile ? mobileVideoSrc : desktopVideoSrc;
            video.load();
          }

          // 2. Play safely
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Autoplay policy or abort; fail silently without console noise
            });
          }
        } else {
          // Pause when scrolled out of view to avoid Chrome frame drops
          if (hasLoadedSrcRef.current && !video.paused) {
            video.pause();
          }
        }
      },
      {
        rootMargin: "250px 0px",
        threshold: 0.05,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [desktopVideoSrc, mobileVideoSrc]);

  return (
    <section
      ref={containerRef}
      aria-label="Campaign Banner Video"
      className={`relative w-full overflow-hidden select-none bg-black h-[300px] sm:h-[380px] md:h-[460px] lg:h-[540px] xl:h-[600px] flex items-center justify-center transform-gpu ${
        className || ""
      }`}
    >
      {/* 
        High-Performance Hardware-Accelerated Video:
        - preload="none" guarantees ZERO network payload during initial page load
        - poster image displays immediately with zero layout shift
      */}
      <video
        ref={videoRef}
        poster={activePoster}
        autoPlay
        muted
        loop
        playsInline
        preload="none"
        className="w-full h-full object-cover object-center will-change-transform"
      />

      {/* Cinematic Dark Scrim Overlay for Typography Contrast */}
      <div
        className="absolute inset-0 bg-black/45 pointer-events-none"
        aria-hidden="true"
      />

      {/* Editorial Streetwear Fashion Typography Centered in the Middle */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 z-10 select-none">
        {tagline && (
          <span className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.3em] uppercase text-neutral-300 drop-shadow-md mb-2 sm:mb-3">
            [ {tagline} ]
          </span>
        )}

        {title && (
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white drop-shadow-lg leading-none">
            {title}
          </h2>
        )}

        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base font-medium tracking-wide text-neutral-200/90 max-w-lg mt-3 sm:mt-4 drop-shadow-md leading-relaxed">
            {subtitle}
          </p>
        )}

        {ctaText && ctaHref && (
          <Link
            href={ctaHref}
            className="mt-5 sm:mt-7 inline-flex items-center gap-1.5 px-6 sm:px-7 py-2.5 sm:py-3 rounded-full bg-white text-black text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all duration-200 shadow-2xl hover:scale-105 active:scale-95"
          >
            <span>{ctaText}</span>
            <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
          </Link>
        )}
      </div>
    </section>
  );
}
