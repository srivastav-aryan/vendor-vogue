"use client";

import React, { useState, useRef } from "react";
import { clientApiFetch } from "@/lib/api-client";
import {
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Link as LinkIcon,
  Plus,
} from "lucide-react";

interface UploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

interface ImageDropzoneProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  folder?: string;
}

/**
 * Sniffs file MIME type or magic bytes to detect image formats
 * even when files have no extension (e.g. "ff" or "jpg").
 */
async function isLikelyImage(file: File): Promise<boolean> {
  if (file.type && file.type.startsWith("image/")) {
    return true;
  }
  if (/\.(jpe?g|png|webp|avif|gif|svg)$/i.test(file.name)) {
    return true;
  }
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) return false;
    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return true;
    // GIF: 47 49 46 38
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
    // WEBP: RIFF....WEBP
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return true;
    }
  } catch {
    // Ignore and fallback
  }
  return false;
}

export function ImageDropzone({
  value = [],
  onChange,
  maxImages = 6,
  folder = "vendor-vogue/products",
}: ImageDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processUpload = async (rawFiles: File[]) => {
    if (rawFiles.length === 0) return;

    if (value.length + rawFiles.length > maxImages) {
      setError(`Maximum limit reached: You can only upload up to ${maxImages} images.`);
      return;
    }

    // Validate size (max 10MB per image) and image format
    const validatedFiles: { file: File; uploadName: string }[] = [];
    for (const file of rawFiles) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 10MB size limit. Please choose a smaller image.`);
        return;
      }
      const isImg = await isLikelyImage(file);
      if (!isImg) {
        setError(`File "${file.name}" is not a recognized image format. Please select JPEG, PNG, or WebP.`);
        return;
      }
      // Ensure file has an image extension for Cloudinary MIME detection
      const hasExt = /\.(jpe?g|png|webp|avif|gif)$/i.test(file.name);
      const uploadName = hasExt ? file.name : `${file.name}.jpg`;
      validatedFiles.push({ file, uploadName });
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(`Requesting Cloudinary upload signature...`);

    try {
      // 1. Get cryptographic HMAC-SHA1 upload signature from our backend
      const signRes = await clientApiFetch<UploadSignature>("/api/upload/sign", {
        method: "POST",
        body: JSON.stringify({ folder }),
      });

      const { signature, timestamp, apiKey, cloudName, folder: targetFolder } = signRes.data;

      const cleanCloudName = (cloudName || "").trim();
      const cleanApiKey = (apiKey || "").trim();
      const cleanFolder = (targetFolder || "").trim();

      const uploadedUrls: string[] = [];

      // 2. Upload directly to Cloudinary CDN from the browser
      for (let i = 0; i < validatedFiles.length; i++) {
        const { file, uploadName } = validatedFiles[i];
        setUploadProgress(`Uploading ${i + 1} of ${validatedFiles.length} (${file.name}) to CDN...`);

        const formData = new FormData();
        formData.append("file", file, uploadName);
        formData.append("api_key", cleanApiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signature.trim());
        formData.append("folder", cleanFolder);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cleanCloudName}/image/upload`;

        const uploadRes = await fetch(cloudinaryUrl, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          console.error("Cloudinary direct upload error:", errData);
          const msg =
            errData?.error?.message ||
            `Cloudinary upload rejected with HTTP status ${uploadRes.status}`;
          throw new Error(msg);
        }

        const data = await uploadRes.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      }

      onChange([...value, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || "Failed to upload image to Cloudinary. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processUpload(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      processUpload(files);
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("https://")) {
      setError("Image URL must use secure HTTPS (e.g. https://...).");
      return;
    }

    if (value.length >= maxImages) {
      setError(`Maximum limit reached: You can only have up to ${maxImages} images.`);
      return;
    }

    setError(null);
    onChange([...value, trimmed]);
    setUrlInput("");
    setShowUrlInput(false);
  };

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Image Upload Notice</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid of uploaded images + Drop trigger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {value.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
          >
            <img
              src={url}
              alt={`Asset ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If broken link, show placeholder
                (e.target as HTMLElement).style.opacity = "0.5";
              }}
            />
            {idx === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                Primary
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              title="Remove image"
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 transition-all cursor-pointer ${
              isDragging
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 scale-95"
                : "border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-500 hover:text-emerald-700"
            } ${isUploading ? "opacity-60 cursor-not-allowed pointer-events-none" : ""}`}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-1" />
            ) : (
              <UploadCloud className="w-6 h-6 mb-1 text-slate-400 group-hover:text-emerald-600" />
            )}
            <span className="text-[11px] font-semibold text-center leading-tight">
              {isUploading ? "Uploading..." : isDragging ? "Drop JPEG/PNG" : "Upload File"}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
              ({value.length}/{maxImages})
            </span>
          </div>
        )}
      </div>

      {/* Hidden File Input allowing all files so OS dialog (Linux Nautilus) displays extensionless images */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxImages - value.length > 1}
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload Status / Optional Link input */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div>
          {uploadProgress ? (
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{uploadProgress}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">
              Supports JPEG, JPG, PNG, WebP up to 10MB per file.
            </span>
          )}
        </div>

        {value.length < maxImages && !isUploading && (
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
            {showUrlInput ? "Cancel URL input" : "Add by HTTPS URL"}
          </button>
        )}
      </div>

      {showUrlInput && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-150">
          <label className="block text-[11px] font-semibold text-slate-700">
            Paste Direct HTTPS Image URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            />
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all shrink-0"
            >
              Add URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
