/**
 * Custom Next.js Image loader that delegates dynamic resizing, format negotiation,
 * and compression directly to Cloudinary's worldwide CDN edge.
 *
 * Benefits:
 * 1. Zero Next.js server CPU/RAM usage (Node.js doesn't run sharp for Cloudinary images).
 * 2. Automatic AVIF/WebP negotiation (`f_auto`) based on the client browser.
 * 3. Perceptual compression (`q_auto`) cutting image weight by up to 60%.
 * 4. Automatic responsive sizing (`w_${width}`) preventing oversized downloads on mobile.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src) return "";

  // If external non-Cloudinary image (e.g. unsplash or local /images/...), return as-is
  if (!src.includes("res.cloudinary.com")) {
    return src;
  }

  // Desired Cloudinary edge transformation parameters
  const q = quality ? `q_${quality}` : "q_auto";
  const transforms = [
    `w_${width}`,
    "c_limit",
    "f_auto",
    q,
  ].join(",");

  // Inject transformations right after /upload/
  if (src.includes("/upload/")) {
    // Prevent duplicate transformations if already present
    const cleanUrl = src.replace(/\/upload\/(?:[a-zA-Z0-9_,-]+\/)?/, "/upload/");
    return cleanUrl.replace("/upload/", `/upload/${transforms}/`);
  }

  return src;
}
