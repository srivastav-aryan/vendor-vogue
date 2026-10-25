"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

interface DiscoverCampaignSectionProps {
  imageSrc?: string;
  brandTitle?: string;
  tagline?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

export function DiscoverCampaignSection({
  imageSrc = "/images/discover.jpg",
  brandTitle = "VENDOR VOGUE",
  tagline = "An Eternal Perspective.",
  buttonText = "DISCOVER",
  buttonHref = "/catalog",
  className,
}: DiscoverCampaignSectionProps) {
  return (
    <section
      aria-label="Discover Campaign"
      className={`relative w-full overflow-hidden select-none bg-black h-[420px] sm:h-[520px] md:h-[640px] lg:h-[760px] xl:h-[840px] ${
        className || ""
      }`}
    >
      {/* Background Campaign Visual using discover.jpg */}
      <Image
        src={imageSrc}
        alt={`${brandTitle} - ${tagline}`}
        fill
        loading="lazy"
        sizes="100vw"
        quality={88}
        className="object-cover object-center transform-gpu"
      />

      {/* Subtle Cinematic Contrast Overlay matching the reference photo */}
      <div
        className="absolute inset-0 bg-black/30 pointer-events-none"
        aria-hidden="true"
      />

      {/* Editorial Content Layer */}
      <div className="relative z-10 w-full h-full max-w-[1720px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-between py-10 sm:py-14 md:py-18 lg:py-20">
        {/* Top Spacer for balanced vertical symmetry */}
        <div className="h-4 sm:h-8" aria-hidden="true" />

        {/* Middle Row: Brand Wordmark (Left) & Poetic Tagline (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 md:gap-12 w-full my-auto">
          {/* Left: Brand Title */}
          <div className="text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium uppercase tracking-[0.25em] text-neutral-300/90 leading-tight">
              {brandTitle}
            </h2>
          </div>

          {/* Right: Editorial Tagline */}
          <div className="text-left md:text-right">
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-neutral-300/90 tracking-wide font-normal leading-tight">
              {tagline}
            </p>
          </div>
        </div>

        {/* Bottom Center: Minimalist Monolithic Button */}
        <div className="flex justify-center w-full pt-6 sm:pt-8">
          <Link
            href={buttonHref}
            className="inline-flex items-center justify-center px-10 sm:px-14 py-3 sm:py-3.5 bg-[#404040]/80 hover:bg-[#525252] text-neutral-200 hover:text-white text-[11px] sm:text-xs font-semibold tracking-[0.25em] uppercase transition-all duration-200 backdrop-blur-xs border border-white/10 hover:border-white/20 active:scale-95"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
