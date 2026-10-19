import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { UploadService } from "../../src/modules/upload/services/upload.service.js";
import { env } from "../../src/shared/config/env.js";

describe("Unit: Cloudinary Direct Upload Signer", () => {
  const uploadService = new UploadService();

  it("generates a valid Cloudinary presigned upload signature with correct parameters", () => {
    const result = uploadService.generateSignature();

    expect(result).toBeDefined();
    expect(result.signature).toBeDefined();
    expect(result.signature).toMatch(/^[a-f0-9]{40}$/); // SHA-1 hex digest is 40 chars
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.apiKey).toBe(env.CLOUDINARY_API_KEY);
    expect(result.cloudName).toBe(env.CLOUDINARY_CLOUD_NAME);
    expect(result.folder).toBe(env.CLOUDINARY_UPLOAD_FOLDER);

    // Verify signature math against Cloudinary formula: folder=...&timestamp=...<secret>
    const expectedPayload = `folder=${result.folder}&timestamp=${result.timestamp}${env.CLOUDINARY_API_SECRET}`;
    const expectedSignature = crypto
      .createHash("sha1")
      .update(expectedPayload)
      .digest("hex");

    expect(result.signature).toBe(expectedSignature);
  });

  it("supports custom destination folders (e.g. banners or brand logos)", () => {
    const customFolder = "vendor-vogue/brand-logos";
    const result = uploadService.generateSignature(customFolder);

    expect(result.folder).toBe(customFolder);

    const expectedPayload = `folder=${customFolder}&timestamp=${result.timestamp}${env.CLOUDINARY_API_SECRET}`;
    const expectedSignature = crypto
      .createHash("sha1")
      .update(expectedPayload)
      .digest("hex");

    expect(result.signature).toBe(expectedSignature);
  });
});
