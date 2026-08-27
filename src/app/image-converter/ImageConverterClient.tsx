"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

type TargetFormat = "image/png" | "image/jpeg" | "image/webp";

export default function ImageConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("image/webp");
  const [quality, setQuality] = useState<number>(0.85);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((selectedFile: File) => {
    setError(null);
    setConvertedBlob(null);
    setConvertedUrl(null);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  }, []);

  // Cleanup object URLs on unmount/change
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [previewUrl, convertedUrl]);

  const convertImage = useCallback(async () => {
    if (!file || !previewUrl) return;
    setConverting(true);
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

      // Fill white background for JPEG conversions if transparent
      if (targetFormat === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, targetFormat, quality)
      );

      if (!blob) throw new Error("Conversion failed");

      setConvertedBlob(blob);
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
    } catch (err) {
      setError(`Conversion error: ${(err as Error).message}`);
    } finally {
      setConverting(false);
    }
  }, [file, previewUrl, targetFormat, quality]);

  // Auto-convert on format/quality change
  useEffect(() => {
    if (file && previewUrl) {
      const t = setTimeout(() => {
        convertImage();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [file, previewUrl, targetFormat, quality, convertImage]);

  const formatExtension = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  }[targetFormat];

  const originalSize = file ? file.size : 0;
  const newSize = convertedBlob ? convertedBlob.size : 0;
  const sizeDiffPercent =
    originalSize && newSize
      ? (((newSize - originalSize) / originalSize) * 100).toFixed(1)
      : null;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Original</p>
        <p className="text-text-primary font-mono">
          {originalSize ? `${(originalSize / 1024).toFixed(1)} KB` : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Converted</p>
        <p className="text-text-primary font-mono">
          {newSize ? `${(newSize / 1024).toFixed(1)} KB` : "—"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Image Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Convert between PNG, JPG, and WebP formats instantly in your browser.
            </p>
          </div>

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
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-8 text-center transition-colors ${
                dragOver
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle bg-bg-page hover:border-accent"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <span className="font-mono text-sm text-text-secondary">
                $ drop an image here -- or click to browse
              </span>
              <span className="text-xs text-text-muted">PNG · JPG · WebP · GIF · BMP</span>
            </label>
          ) : (
            <div className="space-y-6">
              {/* File details & change button */}
              <div className="flex items-center justify-between rounded border border-border-subtle bg-bg-page p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-text-primary">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {(file.size / 1024).toFixed(1)} KB · {file.type || "unknown"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setConvertedBlob(null);
                    setConvertedUrl(null);
                  }}
                  className="btn-secondary text-xs shrink-0"
                >
                  Change Image
                </button>
              </div>

              {/* Format & Quality Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded border border-border-subtle bg-bg-page p-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-2 uppercase">
                    Target Format
                  </label>
                  <div className="flex gap-2">
                    {(["image/webp", "image/png", "image/jpeg"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setTargetFormat(fmt)}
                        className={`flex-1 py-1.5 text-xs font-mono rounded border transition-colors ${
                          targetFormat === fmt
                            ? "border-accent bg-accent text-bg-page font-bold"
                            : "border-border-subtle bg-bg-card text-text-secondary hover:border-accent"
                        }`}
                      >
                        {fmt === "image/jpeg" ? "JPG" : fmt === "image/png" ? "PNG" : "WebP"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-text-muted uppercase">
                      Quality ({Math.round(quality * 100)}%)
                    </label>
                    {targetFormat === "image/png" && (
                      <span className="text-[10px] text-text-muted font-mono">(Lossless)</span>
                    )}
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    disabled={targetFormat === "image/png"}
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-accent disabled:opacity-30 cursor-pointer"
                  />
                </div>
              </div>

              {/* Converted Preview & Stats */}
              {convertedUrl && (
                <div className="rounded border border-border-subtle bg-bg-page p-4 text-center space-y-4">
                  <div className="max-h-64 overflow-hidden rounded bg-bg-card flex items-center justify-center p-2">
                    <img
                      src={convertedUrl}
                      alt="Converted preview"
                      className="max-h-56 max-w-full object-contain rounded"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-t border-border-subtle pt-3">
                    <span className="text-text-secondary">
                      Size: <strong className="text-text-primary">{(newSize / 1024).toFixed(1)} KB</strong>
                    </span>
                    {sizeDiffPercent && (
                      <span
                        className={
                          Number(sizeDiffPercent) < 0 ? "text-success" : "text-warning"
                        }
                      >
                        {Number(sizeDiffPercent) < 0 ? "Reduction: " : "Increase: "}
                        {Math.abs(Number(sizeDiffPercent))}%
                      </span>
                    )}
                    <a
                      href={convertedUrl}
                      download={`${file.name.replace(/\.[^/.]+$/, "")}.${formatExtension}`}
                      className="btn-primary py-1 px-4 text-xs"
                    >
                      {converting ? "Processing..." : `Download .${formatExtension}`}
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-error text-center">{error}</p>}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="image-converter" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="image-converter" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
