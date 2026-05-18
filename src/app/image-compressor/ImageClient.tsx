"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

export default function ImageClient() {
  const [original, setOriginal] = useState<{ src: string; file: File } | null>(null);
  const [compressed, setCompressed] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [quality, setQuality] = useState(80);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-mega-muted hover:text-mega-accent-light transition-colors mb-6 sm:mb-8"
      >
        ← Back to Tools
      </Link>

      <div className="glass rounded-2xl p-4 sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Image Compressor</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-mega-muted">
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
                ? "border-mega-accent bg-mega-accent/10"
                : "border-mega-border hover:border-mega-accent/50"
            }`}
          >
            <div className="mb-3 text-4xl">📁</div>
            <p className="text-mega-muted">
              {dragOver
                ? "Drop your image here"
                : "Drag & drop an image here, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-mega-muted/60">
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
                <h3 className="mb-2 text-sm font-medium text-mega-muted">
                  Original — {formatBytes(original.file.size)}
                </h3>
                <div className="overflow-hidden rounded-xl border border-mega-border">
                  <img
                    src={original.src}
                    alt="Original"
                    className="h-48 sm:h-64 w-full object-contain"
                  />
                </div>
              </div>

              {/* Compressed */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-mega-muted">
                  Compressed{" "}
                  {compressed && (
                    <span className="text-mega-accent-light">
                      — {formatBytes(compressedSize)}
                    </span>
                  )}
                </h3>
                {compressed && compressedSize > original.file.size && (
                  <p className="mb-2 text-xs text-yellow-400">
                    ⚠ Compressed file is larger than the original. Try lowering the quality.
                  </p>
                )}
                <div className="overflow-hidden rounded-xl border border-mega-border">
                  {isProcessing ? (
                    <div className="flex h-48 sm:h-64 items-center justify-center text-mega-muted">
                      Compressing…
                    </div>
                  ) : compressed ? (
                    <img
                      src={compressed}
                      alt="Compressed"
                      className="h-48 sm:h-64 w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-48 sm:h-64 items-center justify-center text-mega-muted">
                      Processing…
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quality slider */}
            <div className="mt-6">
              <label className="mb-2 flex items-center justify-between text-sm">
                <span className="text-mega-muted">Quality</span>
                <span className="font-mono text-mega-accent-light">{quality}%</span>
              </label>
              <input
                type="range"
                min={1}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                onMouseUp={handleCompressRelease}
                onKeyUp={handleCompressRelease}
                className="w-full accent-mega-accent cursor-pointer"
              />
              <div className="mt-1 flex justify-between text-xs text-mega-muted/50">
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>

            {/* Size comparison */}
            {compressed && (
              <div className="mt-6 rounded-xl border border-mega-border bg-mega-dark/50 p-4">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-mega-muted">Original</p>
                    <p className="font-medium text-mega-text">
                      {formatBytes(original.file.size)}
                    </p>
                  </div>
                  <div>
                    <p className="text-mega-muted">Compressed</p>
                    <p className="font-medium text-mega-text">
                      {formatBytes(compressedSize)}
                    </p>
                  </div>
                  <div>
                    <p className="text-mega-muted">Reduction</p>
                    <p
                      className={`font-medium ${
                        compressedSize < original.file.size
                          ? "text-green-400"
                          : compressedSize > original.file.size
                            ? "text-yellow-400"
                            : "text-mega-text"
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
            <div className="mt-6 grid grid-cols-1 sm:flex sm:flex-wrap sm:gap-3 gap-2">
              <button
                onClick={handleDownload}
                disabled={!compressed}
                className="rounded-xl bg-mega-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="rounded-xl border border-mega-border px-6 py-2.5 text-sm font-medium text-mega-muted transition-colors hover:border-mega-accent/50 hover:text-white"
              >
                ↻ Compress Another
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
