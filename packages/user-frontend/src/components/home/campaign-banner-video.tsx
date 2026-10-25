"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface CampaignBannerVideoProps {
  videoSrc?: string;
  posterSrc?: string;
  tagline?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  className?: string;
}

export function CampaignBannerVideo({
  videoSrc = "/videos/banner.mp4?v=1080p",
  posterSrc = "/videos/banner-poster.jpg?v=1080p",
  tagline = "AUTUMN / WINTER 2026",
  title = "CHAOS IN SILENCE",
  subtitle = "Heavyweight drape and raw architectural silhouettes engineered for the streetwear vanguard.",
  ctaText = "EXPLORE DROP",
  ctaHref = "/catalog?filter=trending",
  className,
}: CampaignBannerVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force load the new video stream to bypass any browser cache of previous iterations
    video.load();

    // Use IntersectionObserver to pause video when scrolled out of view and play when entering viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Autoplay policy or abort; fail silently
              });
            }
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.15, // Trigger when 15% of banner is visible
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, [videoSrc]);

  return (
    <section
      aria-label="Campaign Banner Video"
      className={`relative w-full overflow-hidden select-none bg-black h-[300px] sm:h-[380px] md:h-[460px] lg:h-[540px] xl:h-[600px] flex items-center justify-center ${
        className || ""
      }`}
    >
      {/* Full-width Cinematic Landscape Video with React key to force refresh */}
      <video
        key={videoSrc}
        ref={videoRef}
        poster={posterSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover object-center"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Cinematic Dark Scrim Overlay for Pristine Typography Contrast */}
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
