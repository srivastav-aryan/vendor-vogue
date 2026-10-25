"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface InfiniteMarqueeProps {
  text?: string;
  className?: string;
}

/**
 * Pure Tailwind CSS infinite marquee banner.
 * Seamless GPU-accelerated loop with zero external dependencies.
 */
export function InfiniteMarquee({
  text = "Vendor Vogue™",
  className,
}: InfiniteMarqueeProps) {
  const items = Array.from({ length: 8 });

  return (
    <div
      role="region"
      aria-label="Brand Announcement"
      className={cn(
        "w-full overflow-hidden bg-black py-2.5 sm:py-3 text-white border-y border-neutral-900 select-none",
        className
      )}
    >
      <div className="flex w-max whitespace-nowrap animate-ticker motion-reduce:animate-none">
        {/* Track 1 */}
        <div className="flex shrink-0 items-center">
          {items.map((_, i) => (
            <span
              key={`track1-${i}`}
              className="text-xs sm:text-[13px] md:text-sm font-bold tracking-tight text-white whitespace-nowrap mx-6 sm:mx-9 md:mx-12"
            >
              {text}
            </span>
          ))}
        </div>

        {/* Track 2 (Seamless loop duplicate) */}
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {items.map((_, i) => (
            <span
              key={`track2-${i}`}
              className="text-xs sm:text-[13px] md:text-sm font-bold tracking-tight text-white whitespace-nowrap mx-6 sm:mx-9 md:mx-12"
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
