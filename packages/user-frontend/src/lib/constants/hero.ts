export interface HeroConfig {
  /**
   * Set to "image" or "video". Start with image, toggle to video when ready.
   */
  mode: "image" | "video";

  /**
   * Desktop hero image path (widescreen 16:9 / 3:2 landscape)
   */
  imageSrc: string;

  /**
   * Optional tablet hero image path (portrait or landscape 4:3)
   */
  imageSrcTablet?: string;

  /**
   * Optional mobile-optimized vertical crop (portrait 4:5 or 9:16)
   * If not provided, the desktop image automatically adapts with responsive focal positioning.
   */
  imageSrcMobile?: string;

  /**
   * Video file URL (mp4 / webm / Cloudinary video URL). Used when mode === "video".
   */
  videoSrc?: string;

  /**
   * Instant-load poster image shown while the video streams/buffers (prevents blank screen)
   */
  posterSrc?: string;

  /**
   * Main brand / drop headline (Fear of God style)
   */
  title: string;

  /**
   * Subtitle / season indicator
   */
  subtitle: string;

  /**
   * Primary CTA button
   */
  ctaText: string;
  ctaHref: string;

  /**
   * Quick-filter links across top sub-bar
   */
  quickLinks: { label: string; href: string }[];
}

export const HERO_CONFIG: HeroConfig = {
  mode: "image",
  imageSrc: "/images/hero/hero.webp",
  imageSrcTablet: "/images/hero/hero-tablet.webp", // 1200x896 (landscape/4:3 tablet aspect)
  imageSrcMobile: "/images/hero/hero-mobile.webp", // 768x1376 (9:16 vertical portrait for mobile)
  videoSrc: "",
  posterSrc: "/images/hero/hero.webp",
  title: "VENDOR\nVOGUE",
  subtitle: "AUTUMN / WINTER 2026",
  ctaText: "DISCOVER FW26 →",
  ctaHref: "/catalog",
  quickLinks: [
    { label: "Men", href: "/catalog/men" },
    { label: "Women", href: "/catalog/women" },
  ],
};
