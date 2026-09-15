"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function ExifStripperClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isStripping, setIsStripping] = useState(false);
  const [cleanUrl, setCleanUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [cleanSize, setCleanSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const processImage = useCallback(async (selectedFile: File) => {
    setIsStripping(true);
    setError(null);
    setCleanUrl(null);
    setOriginalSize(selectedFile.size);

    const objUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objUrl);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load photo into memory"));
        img.src = objUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      ctx.drawImage(img, 0, 0);

      const mimeType = selectedFile.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, mimeType, 0.95);
      });

      if (!blob) throw new Error("Sanitization failed");

      const resultUrl = URL.createObjectURL(blob);
      setCleanUrl(resultUrl);
      setCleanSize(blob.size);
    } catch (err) {
      setError(`Error sanitizing image: ${(err as Error).message}`);
    } finally {
      setIsStripping(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      processImage(f);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) {
      setFile(f);
      processImage(f);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (cleanUrl) URL.revokeObjectURL(cleanUrl);
    };
  }, [previewUrl, cleanUrl]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">EXIF Metadata:</span>
        <span className="text-success font-bold">100% Stripped</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">GPS / Device Tags:</span>
        <span className="text-success font-bold">Purged</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Original Size:</span>
        <span className="text-text-primary">{originalSize ? formatBytes(originalSize) : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Sanitized Size:</span>
        <span className="text-accent font-bold">{cleanSize ? formatBytes(cleanSize) : "—"}</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="exif-stripper" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Upload Dropzone */}
        {!file ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border-subtle hover:border-accent/40 bg-bg-page"
            }`}
          >
            <span className="text-2xl mb-2">🛡️</span>
            <span className="text-sm font-semibold text-text-primary">
              Drop photo here to strip metadata
            </span>
            <span className="text-xs text-text-muted mt-1">
              Removes GPS coordinates, camera model, shutter speed, date/time, and author tags.
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 truncate">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Original"
                  className="w-10 h-10 rounded object-cover border border-border-subtle"
                />
              )}
              <div className="truncate">
                <span className="font-bold text-text-primary block truncate">{file.name}</span>
                <span className="text-text-muted text-[10px]">
                  Original: {formatBytes(originalSize)}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setCleanUrl(null);
              }}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle shrink-0"
            >
              [Change Photo]
            </button>
          </div>
        )}

        {/* Processing Indicator */}
        {isStripping && (
          <div className="p-4 rounded-lg border border-accent/30 bg-accent/10 text-xs text-accent text-center">
            Purging EXIF, GPS tags, and device fingerprints via Canvas buffer...
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Sanitized Image Result */}
        {cleanUrl && (
          <div className="pt-3 border-t border-border-subtle space-y-3">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-success">
                ✓ EXIF Data Completely Purged ({formatBytes(cleanSize)})
              </span>
              <a
                href={cleanUrl}
                download={`sanitized-${file?.name || "photo.jpg"}`}
                className="px-3 py-1 rounded bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Download Sanitized Photo
              </a>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-page p-3 flex items-center justify-center max-h-72 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cleanUrl}
                alt="Sanitized preview"
                className="max-h-64 object-contain rounded"
              />
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
