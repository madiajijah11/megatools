"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";

type TargetFormat = "image/png" | "image/jpeg" | "image/webp";

interface FormatOption {
  label: string;
  mime: TargetFormat;
  ext: string;
  hasQuality: boolean;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { label: "PNG", mime: "image/png", ext: "png", hasQuality: false },
  { label: "JPEG", mime: "image/jpeg", ext: "jpg", hasQuality: true },
  { label: "WebP", mime: "image/webp", ext: "webp", hasQuality: true },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function ImageConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("image/png");
  const [quality, setQuality] = useState<number>(90);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const selectedFormatOption =
    FORMAT_OPTIONS.find((f) => f.mime === targetFormat) ?? FORMAT_OPTIONS[0];

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    setError(null);
    setFile(f);
    setConvertedUrl(null);
    setConvertedSize(null);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const handleConvert = useCallback(async () => {
    if (!file || !previewUrl) return;
    setIsConverting(true);
    setError(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = previewUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      if (targetFormat === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) => {
        const q = selectedFormatOption.hasQuality ? quality / 100 : undefined;
        canvas.toBlob(resolve, targetFormat, q);
      });

      if (!blob) throw new Error("Conversion failed");

      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
      setConvertedSize(blob.size);
    } catch (err) {
      setError(`Conversion error: ${(err as Error).message}`);
    } finally {
      setIsConverting(false);
    }
  }, [file, previewUrl, targetFormat, quality, selectedFormatOption, convertedUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [previewUrl, convertedUrl]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Source Format:</span>
        <span className="text-text-primary">{file ? file.type.replace("image/", "").toUpperCase() : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Target Format:</span>
        <span className="text-accent font-bold uppercase">{selectedFormatOption.label}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Original Size:</span>
        <span className="text-text-primary">{file ? formatBytes(file.size) : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Converted Size:</span>
        <span className="text-success font-bold">{convertedSize ? formatBytes(convertedSize) : "—"}</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="image-converter" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Upload Dropzone */}
        {!file ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border-subtle hover:border-accent/40 bg-bg-page"
            }`}
          >
            <span className="text-2xl mb-2">🔄</span>
            <span className="text-sm font-semibold text-text-primary">
              Drop image here or click to browse
            </span>
            <span className="text-xs text-text-muted mt-1">
              Convert PNG, JPEG, WebP, BMP, AVIF instantly with Canvas API
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
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
                  alt="Source preview"
                  className="w-10 h-10 rounded object-cover border border-border-subtle"
                />
              )}
              <div className="truncate">
                <span className="font-bold text-text-primary block truncate">{file.name}</span>
                <span className="text-text-muted text-[10px]">
                  {formatBytes(file.size)} · {file.type || "image"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setConvertedUrl(null);
                setConvertedSize(null);
              }}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle shrink-0"
            >
              [Change Image]
            </button>
          </div>
        )}

        {/* Format Selectors */}
        {file && (
          <div className="space-y-4 pt-2 border-t border-border-subtle text-xs">
            <div className="space-y-1.5">
              <span className="text-text-secondary block">Select Target Format</span>
              <div className="flex flex-wrap gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.mime}
                    type="button"
                    onClick={() => {
                      setTargetFormat(f.mime);
                      setConvertedUrl(null);
                      setConvertedSize(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      targetFormat === f.mime
                        ? "border-accent text-accent bg-accent/10 font-bold"
                        : "border-border-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedFormatOption.hasQuality && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Quality Compression</span>
                  <span className="font-bold text-accent">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => {
                    setQuality(Number(e.target.value));
                    setConvertedUrl(null);
                    setConvertedSize(null);
                  }}
                  className="w-full accent-accent cursor-pointer h-1.5 bg-border-subtle rounded-lg"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleConvert}
              disabled={isConverting}
              className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
            >
              {isConverting ? "Converting..." : `Convert to ${selectedFormatOption.label}`}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Converted Result */}
        {convertedUrl && (
          <div className="pt-3 border-t border-border-subtle space-y-3">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-success">
                ✓ Converted to {selectedFormatOption.label} ({convertedSize ? formatBytes(convertedSize) : ""})
              </span>
              <a
                href={convertedUrl}
                download={`converted.${selectedFormatOption.ext}`}
                className="px-3 py-1 rounded bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Download {selectedFormatOption.label}
              </a>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-page p-3 flex items-center justify-center max-h-72 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={convertedUrl}
                alt="Converted result"
                className="max-h-64 object-contain rounded"
              />
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
