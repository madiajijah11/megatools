"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

export default function ImageClient() {
  const [original, setOriginal] = useState<{ src: string; file: File } | null>(null);
  const [compressed, setCompressed] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (original?.src) URL.revokeObjectURL(original.src);
      if (compressed) URL.revokeObjectURL(compressed);
    };
  }, [original?.src, compressed]);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const compressImage = useCallback(
    (file: File) => {
      setIsProcessing(true);
      setCompressed(null);

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");

        // Resize large images to max 1920px maintaining aspect ratio
        const MAX_DIM = 1920;
        let { naturalWidth: w, naturalHeight: h } = img;
        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCompressed((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(blob);
              });
              setCompressedSize(blob.size);
            }
            setIsProcessing(false);
          },
          "image/jpeg",
          quality / 100
        );
      };

      img.src = objectUrl;
    },
    [quality]
  );

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setOriginal({ src: URL.createObjectURL(file), file });
    compressImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleCompressRelease = useCallback(() => {
    if (original) compressImage(original.file);
  }, [original, compressImage]);

  const handleDownload = () => {
    if (!compressed) return;
    const a = document.createElement("a");
    a.href = compressed;
    a.download = `compressed-${original?.file.name.replace(/\.[^.]+$/, "")}.jpg`;
    a.click();
  };

  const reductionPercent = original && compressedSize
    ? Math.round(((original.file.size - compressedSize) / original.file.size) * 100)
    : 0;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Original</p>
        <p className="text-text-primary font-mono">
          {original ? formatBytes(original.file.size) : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Compressed</p>
        <p className="text-text-primary font-mono">
          {compressedSize ? formatBytes(compressedSize) : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Reduction</p>
        <p className={`font-mono ${reductionPercent > 0 ? "text-success" : reductionPercent < 0 ? "text-error" : "text-text-primary"}`}>
          {original && compressedSize ? `${reductionPercent}%` : "—"}
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
              <span className="gradient-text">Image Compressor</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Compress images in your browser. Nothing is uploaded.
            </p>
          </div>

          {/* Upload zone */}
          {!original && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                dragOver
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle hover:border-accent/50"
              }`}
            >
              <div className="mb-3 text-4xl">📁</div>
              <p className="text-text-secondary">
                {dragOver
                  ? "Drop your image here"
                  : "Drag & drop an image here, or click to browse"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Supports JPG, PNG, WebP, BMP, GIF
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          )}

          {/* Preview area */}
          {original && (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Original */}
                <div>
                  <h3 className="mb-2 text-sm font-medium text-text-secondary">
                    Original — {formatBytes(original.file.size)}
                  </h3>
                  <div className="overflow-hidden rounded-xl border border-border-subtle">
                    <img
                      src={original.src}
                      alt="Original"
                      className="h-48 sm:h-64 w-full object-contain"
                    />
                  </div>
                </div>

                {/* Compressed */}
                <div>
                  <h3 className="mb-2 text-sm font-medium text-text-secondary">
                    Compressed{" "}
                    {compressed && (
                      <span className="text-accent">
                        — {formatBytes(compressedSize)}
                      </span>
                    )}
                  </h3>
                  {compressed && compressedSize > original.file.size && (
                    <p className="mb-2 text-xs text-warning">
                      ⚠ Compressed file is larger than the original. Try lowering the quality.
                    </p>
                  )}
                  <div className="overflow-hidden rounded-xl border border-border-subtle">
                    {isProcessing ? (
                      <div className="flex h-48 sm:h-64 items-center justify-center text-text-muted">
                        Compressing…
                      </div>
                    ) : compressed ? (
                      <img
                        src={compressed}
                        alt="Compressed"
                        className="h-48 sm:h-64 w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-48 sm:h-64 items-center justify-center text-text-muted">
                        Processing…
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quality slider */}
              <div className="mt-6">
                <label className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Quality</span>
                  <span className="font-mono text-accent">{quality}%</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  onMouseUp={handleCompressRelease}
                  onKeyUp={handleCompressRelease}
                  className="w-full accent-accent cursor-pointer"
                />
                <div className="mt-1 flex justify-between text-xs text-text-muted">
                  <span>Smaller file</span>
                  <span>Better quality</span>
                </div>
              </div>

              {/* Size comparison */}
              {compressed && (
                <div className="mt-6 rounded-xl border border-border-subtle bg-bg-page p-4">
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <p className="text-text-muted">Original</p>
                      <p className="font-medium text-text-primary">
                        {formatBytes(original.file.size)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted">Compressed</p>
                      <p className="font-medium text-text-primary">
                        {formatBytes(compressedSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted">Reduction</p>
                      <p
                        className={`font-medium ${
                          compressedSize < original.file.size
                            ? "text-success"
                            : compressedSize > original.file.size
                              ? "text-warning"
                              : "text-text-primary"
                        }`}
                      >
                        {compressedSize < original.file.size
                          ? `${Math.round(((original.file.size - compressedSize) / original.file.size) * 100)}%`
                          : compressedSize > original.file.size
                            ? `+${Math.round(((compressedSize - original.file.size) / original.file.size) * 100)}%`
                            : "0%"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleDownload}
                  disabled={!compressed}
                  className="btn-primary px-6"
                >
                  ⬇ Download Compressed
                </button>
                <button
                  onClick={() => {
                    if (original?.src) URL.revokeObjectURL(original.src);
                    if (compressed) URL.revokeObjectURL(compressed);
                    setOriginal(null);
                    setCompressed(null);
                    setCompressedSize(0);
                    setQuality(80);
                  }}
                  className="btn-secondary px-6"
                >
                  ↻ Compress Another
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="image-compressor" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl hover:bg-accent/90 transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="image-compressor" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
