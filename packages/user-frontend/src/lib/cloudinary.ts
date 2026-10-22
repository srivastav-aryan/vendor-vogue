/**
 * Cloudinary asset configuration & folder architecture for Vendor Vogue storefront.
 *
 * Folder Structure Convention:
 *  - vendor-vogue/
 *      ├── campaigns/       -> High-res lookbooks, hero videos, editorial banners
 *      ├── products/        -> E-commerce catalog assets
 *      │    ├── thumbnails/ -> Grid & search card optimized crops
 *      │    ├── gallery/    -> High-detail zoom & variant images
 *      └── brands/          -> Brand logos & partner badges
 */

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | number;
  format?: "auto" | "webp" | "avif" | "mp4" | "webm";
  crop?: "fill" | "limit" | "fit" | "scale" | "thumb";
  gravity?: "auto" | "center" | "face";
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo";

/**
 * Builds an optimized Cloudinary delivery URL with automatic format and quality negotiation.
 */
export function buildCloudinaryUrl(
  publicIdOrUrl: string,
  options: CloudinaryTransformOptions = {}
): string {
  if (!publicIdOrUrl) return "";

  // If already an absolute external non-Cloudinary URL, return as-is
  if (publicIdOrUrl.startsWith("http") && !publicIdOrUrl.includes("cloudinary.com")) {
    return publicIdOrUrl;
  }

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "limit",
    gravity,
  } = options;

  const transforms: string[] = [
    `f_${format}`,
    `q_${quality}`,
  ];

  if (crop) transforms.push(`c_${crop}`);
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (gravity) transforms.push(`g_${gravity}`);

  const transformString = transforms.join(",");

  // If full Cloudinary URL was provided, inject transforms
  if (publicIdOrUrl.includes("res.cloudinary.com")) {
    return publicIdOrUrl.replace("/upload/", `/upload/${transformString}/`);
  }

  // Otherwise construct from cloud name and public ID
  const cleanId = publicIdOrUrl.replace(/^\/+/, "");
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformString}/${cleanId}`;
}

/**
 * Builds an optimized video delivery URL from Cloudinary (supporting adaptive bitrate or mp4/webm).
 */
export function buildCloudinaryVideoUrl(
  publicIdOrUrl: string,
  options: { format?: "mp4" | "webm" | "auto"; quality?: string } = {}
): string {
  if (!publicIdOrUrl) return "";
  if (publicIdOrUrl.startsWith("http") && !publicIdOrUrl.includes("cloudinary.com")) {
    return publicIdOrUrl;
  }

  const { format = "auto", quality = "auto" } = options;
  const transformString = `f_${format},q_${quality},vc_auto`;

  if (publicIdOrUrl.includes("res.cloudinary.com")) {
    return publicIdOrUrl.replace("/video/upload/", `/video/upload/${transformString}/`);
  }

  const cleanId = publicIdOrUrl.replace(/^\/+/, "");
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/${transformString}/${cleanId}`;
}
