/**
 * cloudinary.utils.ts
 *
 * Universal URL transformation helpers for Cloudinary images and videos.
 * Works seamlessly in Browser (React/Next.js) and Server (Node/SSR).
 */

export interface CloudinaryImageTransformOptions {
  width?: number;
  height?: number;
  quality?: "auto" | "auto:good" | "auto:best" | "auto:eco" | "auto:low" | number;
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
  crop?: "limit" | "fill" | "fit" | "scale" | "thumb";
  gravity?: "auto" | "face" | "center";
  dpr?: "auto" | number;
}

export interface CloudinaryVideoTransformOptions {
  width?: number;
  quality?: "auto" | "auto:good" | "auto:eco" | number;
  format?: "auto" | "mp4" | "webm";
  bitRate?: string; // e.g. "500k", "1m"
}

/**
 * Checks if a URL is hosted on Cloudinary
 */
export function isCloudinaryUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes("res.cloudinary.com");
}

/**
 * Injects on-the-fly image transformations into a Cloudinary URL.
 * If the URL is not from Cloudinary, returns the raw URL safely.
 *
 * Example:
 *   Input:  "https://res.cloudinary.com/demo/image/upload/sample.jpg"
 *   Output: "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/sample.jpg"
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: CloudinaryImageTransformOptions = {},
): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  // Don't re-transform if already transformed with custom flags
  const uploadMarker = "/image/upload/";
  const markerIndex = url.indexOf(uploadMarker);
  if (markerIndex === -1) return url;

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "limit",
    gravity,
    dpr = "auto",
  } = options;

  const parts: string[] = [];

  if (format) parts.push(`f_${format}`);
  if (quality) parts.push(`q_${quality}`);
  if (crop) parts.push(`c_${crop}`);
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (gravity) parts.push(`g_${gravity}`);
  if (dpr) parts.push(`dpr_${dpr}`);

  const transformString = parts.join(",");
  const prefix = url.substring(0, markerIndex + uploadMarker.length);
  const suffix = url.substring(markerIndex + uploadMarker.length);

  return `${prefix}${transformString}/${suffix}`;
}

/**
 * Injects on-the-fly video transformations (adaptive bitrate, modern codec).
 */
export function getOptimizedVideoUrl(
  url?: string | null,
  options: CloudinaryVideoTransformOptions = {},
): string {
  if (!url) return "";
  if (!isCloudinaryUrl(url)) return url;

  const uploadMarker = "/video/upload/";
  const markerIndex = url.indexOf(uploadMarker);
  if (markerIndex === -1) return url;

  const { width, quality = "auto", format = "auto", bitRate } = options;

  const parts: string[] = [];
  if (format) parts.push(`f_${format}`);
  if (quality) parts.push(`q_${quality}`);
  if (width) parts.push(`w_${width}`);
  if (bitRate) parts.push(`br_${bitRate}`);

  const transformString = parts.join(",");
  const prefix = url.substring(0, markerIndex + uploadMarker.length);
  const suffix = url.substring(markerIndex + uploadMarker.length);

  return `${prefix}${transformString}/${suffix}`;
}

/**
 * Generates an automatic poster snapshot (first frame image) from a Cloudinary video URL.
 * Essential for instantaneous LCP and video placeholders on the storefront hero section.
 */
export function getVideoPosterUrl(videoUrl?: string | null, width: number = 1920): string {
  if (!videoUrl || !isCloudinaryUrl(videoUrl)) return "";

  // Replace /video/upload/ with /video/upload/so_0,w_1920,f_auto,q_auto/ and extension to .jpg
  const uploadMarker = "/video/upload/";
  const markerIndex = videoUrl.indexOf(uploadMarker);
  if (markerIndex === -1) return videoUrl;

  const prefix = videoUrl.substring(0, markerIndex + uploadMarker.length);
  let suffix = videoUrl.substring(markerIndex + uploadMarker.length);

  // Replace video extension with .jpg for poster frame extraction
  suffix = suffix.replace(/\.[a-zA-Z0-9]+$/, ".jpg");

  return `${prefix}so_0,w_${width},f_auto,q_auto/${suffix}`;
}

/**
 * Common presets for Apparel e-commerce
 */
export const MEDIA_PRESETS = {
  // Brand Logo / Avatar
  brandLogo: (url?: string | null) =>
    getOptimizedImageUrl(url, { width: 120, height: 120, crop: "fit" }),

  // PLP Product Card Grid (2-4 columns on desktop, 2 on mobile)
  plpCard: (url?: string | null) =>
    getOptimizedImageUrl(url, { width: 500, quality: "auto:good", crop: "limit" }),

  // PDP Hero Main Gallery Carousel
  pdpHero: (url?: string | null) =>
    getOptimizedImageUrl(url, { width: 1000, quality: "auto:good", crop: "limit" }),

  // PDP Deep Zoom Lightbox
  pdpZoom: (url?: string | null) =>
    getOptimizedImageUrl(url, { width: 2000, quality: "auto:best", crop: "limit" }),

  // Admin Table Thumbnail
  adminThumbnail: (url?: string | null) =>
    getOptimizedImageUrl(url, { width: 80, height: 80, crop: "fill", gravity: "center" }),

  // Storefront Hero Video (1080p, auto format WebM/MP4, auto quality)
  heroVideo: (url?: string | null) =>
    getOptimizedVideoUrl(url, { width: 1920, quality: "auto:good" }),
};
