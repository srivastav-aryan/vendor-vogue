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

    // IntersectionObserver to pause video when offscreen and play when visible
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
        threshold: 0.15,
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
      className={`relative w-full overflow-hidden select-none bg-black flex items-center justify-center h-[520px] sm:h-[620px] md:h-[740px] lg:h-[840px] py-3 sm:py-6 ${
        className || ""
      }`}
    >
      {/* 
        High-Performance Cinematic Video:
        - object-contain ensures the full video frame is 100% visible with zero zooming or cropping.
        - Sized within the expanded responsive height container.
      */}
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full max-h-full object-contain object-center"
      />

      {/* Subtle overlay */}
      <div
        className="absolute inset-0 bg-black/10 pointer-events-none"
        aria-hidden="true"
      />
    </section>
  );
}
