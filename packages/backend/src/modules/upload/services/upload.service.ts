import crypto from "node:crypto";
import { env } from "../../../shared/config/env.js";

export interface UploadSignatureResult {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export class UploadService {
  /**
   * Generates a cryptographic SHA-1 presigned upload signature for Cloudinary.
   * Allows the frontend to upload directly to Cloudinary without exposing API secrets.
   */
  generateSignature(folder?: string): UploadSignatureResult {
    const timestamp = Math.floor(Date.now() / 1000);
    const targetFolder = folder || env.CLOUDINARY_UPLOAD_FOLDER || "vendor-vogue/products";

    // Cloudinary algorithm: parameters sorted alphabetically, joined as key=value&key=value, followed by api_secret
    const paramsToSign = `folder=${targetFolder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;

    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign)
      .digest("hex");

    return {
      signature,
      timestamp,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      folder: targetFolder,
    };
  }
}
