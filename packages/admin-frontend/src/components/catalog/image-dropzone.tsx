"use client";

import React, { useState, useRef } from "react";
import { clientApiFetch } from "@/lib/api-client";
import { UploadCloud, X, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";

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

export function ImageDropzone({
  value = [],
  onChange,
  maxImages = 5,
  folder = "vendor-vogue/products",
}: ImageDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (value.length + files.length > maxImages) {
      setError(`Maximum limit reached: You can only upload up to ${maxImages} images.`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(`Preparing direct-to-cloud upload signature...`);

    try {
      // 1. Get cryptographic HMAC-SHA1 upload signature from our backend
      const signRes = await clientApiFetch<UploadSignature>("/api/upload/sign", {
        method: "POST",
        body: JSON.stringify({ folder }),
      });

      const { signature, timestamp, apiKey, cloudName, folder: targetFolder } = signRes.data;

      const isPlaceholder =
        !cloudName ||
        cloudName.includes("placeholder") ||
        !apiKey ||
        apiKey.includes("placeholder");

      const uploadedUrls: string[] = [];

      // If in development and Cloudinary credentials have placeholder values,
      // fallback to reading as local data URLs so product creation testing is not blocked.
      if (isPlaceholder) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(dataUrl);
        }
        setError(
          "Notice: Using local preview because Cloudinary is running in demo/placeholder mode. To enable global CDN storage, paste your real Cloudinary keys in packages/backend/.env"
        );
        onChange([...value, ...uploadedUrls]);
        return;
      }

      // 2. Upload directly to Cloudinary CDN from the browser
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length} to Cloud CDN...`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", apiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("signature", signature);
        formData.append("folder", targetFolder);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const uploadRes = await fetch(cloudinaryUrl, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData?.error?.message || "Direct upload to Cloudinary failed");
        }

        const data = await uploadRes.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      }

      onChange([...value, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of uploaded images + Drop trigger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {value.map((url, idx) => (
          <div
            key={url}
            className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
          >
            <img
              src={url}
              alt={`Asset ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                Primary
              </span>
            )}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center justify-center p-3 text-slate-500 hover:text-emerald-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mb-1" />
            ) : (
              <UploadCloud className="w-6 h-6 mb-1 text-slate-400 group-hover:text-emerald-600" />
            )}
            <span className="text-[11px] font-semibold text-center">
              {isUploading ? "Uploading..." : "Upload Image"}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
              ({value.length}/{maxImages})
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={maxImages - value.length > 1}
        className="hidden"
        onChange={handleFileSelect}
      />

      {uploadProgress && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{uploadProgress}</span>
        </div>
      )}
    </div>
  );
}
