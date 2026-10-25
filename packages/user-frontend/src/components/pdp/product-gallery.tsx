"use client";

import * as React from "react";
import Image from "next/image";
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = React.useState<number | null>(null);
  const [mobileActiveIndex, setMobileActiveIndex] = React.useState<number>(0);
  const mobileScrollRef = React.useRef<HTMLDivElement | null>(null);

  const displayImages =
    images && images.length > 0
      ? images
      : [
          "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=90",
        ];

  // Handle mobile scroll index update
  const handleMobileScroll = () => {
    if (!mobileScrollRef.current) return;
    const { scrollLeft, clientWidth } = mobileScrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setMobileActiveIndex(idx);
    }
  };

  const handleNextLightbox = () => {
    if (activeImageIndex === null) return;
    setActiveImageIndex((activeImageIndex + 1) % displayImages.length);
  };

  const handlePrevLightbox = () => {
    if (activeImageIndex === null) return;
    setActiveImageIndex(
      (activeImageIndex - 1 + displayImages.length) % displayImages.length
    );
  };

  return (
    <div className="w-full">
      {/* 1. DESKTOP GALLERY: 2-Column Grid matching reference image */}
      <div
        className={cn(
          "hidden md:grid gap-3 lg:gap-4",
          displayImages.length === 1
            ? "md:grid-cols-1 max-w-xl mx-auto"
            : "md:grid-cols-2"
        )}
      >
        {displayImages.map((src, index) => (
          <div
            key={`desktop-img-${index}`}
            className="group relative aspect-[3/4] w-full overflow-hidden bg-[#f6f6f6] cursor-zoom-in"
            onClick={() => setActiveImageIndex(index)}
          >
            <Image
              src={src}
              alt={`${productName} view ${index + 1}`}
              fill
              priority={index < 2}
              sizes="(max-width: 1024px) 50vw, 30vw"
              className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
            />

            {/* Minimalist [+] Zoom Icon in the corner matching reference */}
            <button
              type="button"
              aria-label={`Zoom view ${index + 1}`}
              className="absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-xs backdrop-blur-xs transition-transform duration-200 hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImageIndex(index);
              }}
            >
              <Plus className="h-4 w-4 stroke-[2.2]" />
            </button>
          </div>
        ))}
      </div>

      {/* 2. MOBILE GALLERY: Clean horizontal swipe carousel (<768px) */}
      <div className="block md:hidden">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          className="flex w-full snap-x snap-mandatory overflow-x-auto scrollbar-none gap-3 pb-3"
        >
          {displayImages.map((src, index) => (
            <div
              key={`mobile-img-${index}`}
              className="relative aspect-[3/4] w-full min-w-full shrink-0 snap-center overflow-hidden bg-[#f6f6f6]"
              onClick={() => setActiveImageIndex(index)}
            >
              <Image
                src={src}
                alt={`${productName} mobile view ${index + 1}`}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              />

              {/* Minimalist [+] Zoom Icon */}
              <button
                type="button"
                aria-label={`Zoom view ${index + 1}`}
                className="absolute bottom-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-xs backdrop-blur-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(index);
                }}
              >
                <Plus className="h-4 w-4 stroke-[2.2]" />
              </button>
            </div>
          ))}
        </div>

        {/* Mobile Carousel Indicators */}
        {displayImages.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {displayImages.map((_, i) => (
              <span
                key={`dot-${i}`}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === mobileActiveIndex
                    ? "w-6 bg-black"
                    : "w-1.5 bg-neutral-300"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. LIGHTBOX DIALOG: High-Resolution Zoom Modal (shadcn Dialog primitive) */}
      <Dialog
        open={activeImageIndex !== null}
        onOpenChange={(open) => {
          if (!open) setActiveImageIndex(null);
        }}
      >
        <DialogContent
          className="max-w-[92vw] lg:max-w-4xl p-0 overflow-hidden bg-black/95 border-none text-white rounded-none sm:rounded-sm"
        >
          <div className="sr-only">
            <DialogTitle>{productName} Image Lightbox</DialogTitle>
            <DialogDescription>
              Zoom inspection for {productName} photo {Number(activeImageIndex) + 1}
            </DialogDescription>
          </div>

          {activeImageIndex !== null && (
            <div className="relative aspect-[3/4] max-h-[85vh] w-full overflow-hidden select-none">
              <Image
                src={displayImages[activeImageIndex]}
                alt={`${productName} enlarged view`}
                fill
                quality={90}
                sizes="90vw"
                className="object-contain object-center"
              />

              {/* Index counter */}
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-xs px-2.5 py-1 text-xs font-mono font-medium tracking-widest text-neutral-300 rounded-none">
                {activeImageIndex + 1} / {displayImages.length}
              </div>

              {/* Prev / Next controls */}
              {displayImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevLightbox}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs hover:bg-white/40 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextLightbox}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs hover:bg-white/40 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
