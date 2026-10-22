"use client";

import { cn } from "@/lib/utils";

interface TickerBarProps {
  isLightMode: boolean;
}

const TICKER_MESSAGES = [
  "30 days Easy Returns & Exchanges",
  "No extra fees on US orders - Taxes & Duties Included",
  "Complimentary Express Shipping over $250",
  "FW26 Drop 02 Now Live",
];

export function TickerBar({ isLightMode }: TickerBarProps) {
  return (
    <div
      role="region"
      aria-label="Announcements"
      className={cn(
        "w-full overflow-hidden text-[11px] font-semibold tracking-wide py-1 sm:py-1.5 transition-colors duration-300 border-b select-none",
        isLightMode
          ? "bg-neutral-100 text-neutral-700 border-neutral-200"
          : "bg-black/40 backdrop-blur-xs text-white/95 border-white/10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      )}
    >
      <div className="flex w-max whitespace-nowrap animate-ticker hover:[animation-play-state:paused] motion-reduce:animate-none">
        {/* Set 1: Visible for users & assistive tech */}
        <div className="flex shrink-0 items-center">
          {TICKER_MESSAGES.map((msg, index) => (
            <span key={`msg-1-${index}`} className="inline-flex items-center mx-4 sm:mx-6">
              <span>{msg}</span>
              <span
                className={cn(
                  "mx-4 sm:mx-6",
                  isLightMode ? "text-neutral-400" : "text-white/40"
                )}
                aria-hidden="true"
              >
                ·
              </span>
            </span>
          ))}
        </div>

        {/* Set 2: Duplicate for seamless infinite loop (hidden from assistive tech) */}
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {TICKER_MESSAGES.map((msg, index) => (
            <span key={`msg-2-${index}`} className="inline-flex items-center mx-4 sm:mx-6">
              <span>{msg}</span>
              <span
                className={cn(
                  "mx-4 sm:mx-6",
                  isLightMode ? "text-neutral-400" : "text-white/40"
                )}
              >
                ·
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
