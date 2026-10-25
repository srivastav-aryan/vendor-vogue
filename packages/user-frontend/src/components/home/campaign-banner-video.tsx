"use client";

import * as React from "react";

interface CampaignBannerVideoProps {
  videoSrc?: string;
  posterSrc?: string;
  className?: string;
}

export function CampaignBannerVideo({
  videoSrc = "/videos/banner.mp4",
  posterSrc = "/videos/banner-poster.jpg",
  className,
}: CampaignBannerVideoProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Use IntersectionObserver to optimize GPU/CPU and battery drain:
    // Only play video when visible in viewport, pause when scrolled out of view.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(() => {
                // Autoplay may be blocked by user policy or aborted; fail silently
              });
            }
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.15, // Trigger when at least 15% of banner is visible
      }
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section
      aria-label="Campaign Banner Video"
      className={`relative w-full overflow-hidden select-none bg-black h-[220px] sm:h-[240px] md:h-[280px] lg:h-[340px] xl:h-[380px] ${
        className || ""
      }`}
    >
      {/* Cinematic Video Strip */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover object-center"
      />

      {/* Subtle Dark Vignette Overlay for High-Contrast Clean Visuals */}
      <div
        className="absolute inset-0 bg-black/20 pointer-events-none"
        aria-hidden="true"
      />
    </section>
  );
}
