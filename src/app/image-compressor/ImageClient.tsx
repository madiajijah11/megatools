"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";

interface ImageInfo {
  file: File;
  preview: string;
  width: number;
  height: number;
}

type OutputFormat = "image/jpeg" | "image/webp" | "image/png";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function ImageClient() {
  const [original, setOriginal] = useState<ImageInfo | null>(null);
  const [compressed, setCompressed] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<OutputFormat>("image/jpeg");
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const compressImage = useCallback(
    (info: ImageInfo, q: number, fmt: OutputFormat, maxW: number) => {
      setIsProcessing(true);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (maxW > 0 && width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }

        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsProcessing(false);
          return;
        }

        if (fmt === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              if (compressed) URL.revokeObjectURL(compressed);
              const url = URL.createObjectURL(blob);
              setCompressed(url);
              setCompressedSize(blob.size);
            }
            setIsProcessing(false);
          },
          fmt,
          q / 100
        );
      };
      img.src = info.preview;
    },
    [compressed]
  );

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const preview = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const info: ImageInfo = {
        file,
        preview,
        width: img.width,
        height: img.height,
      };
      setOriginal(info);
      compressImage(info, quality, format, maxWidth);
    };
    img.src = preview;
  };

  const handleQualityChange = (newQ: number) => {
    setQuality(newQ);
    if (original) compressImage(original, newQ, format, maxWidth);
  };

  const handleFormatChange = (newFmt: OutputFormat) => {
    setFormat(newFmt);
    if (original) compressImage(original, quality, newFmt, maxWidth);
  };

  const handleMaxWidthChange = (newMaxW: number) => {
    setMaxWidth(newMaxW);
    if (original) compressImage(original, quality, format, newMaxW);
  };

  const handleDownload = () => {
    if (!compressed || !original) return;
    const ext = format === "image/webp" ? "webp" : format === "image/png" ? "png" : "jpg";
    const name = original.file.name.replace(/\.[^.]+$/, "");
    const link = document.createElement("a");
    link.href = compressed;
    link.download = `${name}-compressed.${ext}`;
    link.click();
  };

  useEffect(() => {
    return () => {
      if (original) URL.revokeObjectURL(original.preview);
      if (compressed) URL.revokeObjectURL(compressed);
    };
  }, [original, compressed]);

  const reductionPercent =
    original && compressedSize
      ? Math.round(((original.file.size - compressedSize) / original.file.size) * 100)
      : 0;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Original Size:</span>
        <span className="text-text-primary">{original ? formatBytes(original.file.size) : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Compressed Size:</span>
        <span className="text-accent font-bold">{compressedSize ? formatBytes(compressedSize) : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Savings:</span>
        <span className={`font-bold ${reductionPercent > 0 ? "text-success" : "text-text-muted"}`}>
          {reductionPercent > 0 ? `-${reductionPercent}%` : "—"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="image-compressor" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        <canvas ref={canvasRef} className="hidden" />

        {/* Upload Dropzone */}
        {!original ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileSelect(file);
            }}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border-subtle hover:border-accent/40 bg-bg-page"
            }`}
          >
            <span className="text-2xl mb-2">🖼️</span>
            <span className="text-sm font-semibold text-text-primary">
              Drop image here or click to browse
            </span>
            <span className="text-xs text-text-muted mt-1">
              Supports JPEG, PNG, WebP. 100% Canvas compression in browser RAM.
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
              className="hidden"
            />
          </label>
        ) : (
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 truncate">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={original.preview}
                alt="Source"
                className="w-10 h-10 rounded object-cover border border-border-subtle"
              />
              <div className="truncate">
                <span className="font-bold text-text-primary block truncate">{original.file.name}</span>
                <span className="text-text-muted text-[10px]">
                  {original.width} × {original.height} px · {formatBytes(original.file.size)}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setOriginal(null);
                setCompressed(null);
                setCompressedSize(0);
              }}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle shrink-0"
            >
              [Change Image]
            </button>
          </div>
        )}

        {/* Compression Controls */}
        {original && (
          <div className="space-y-4 pt-2 border-t border-border-subtle text-xs">
            {/* Format Selector */}
            <div className="space-y-1.5">
              <span className="text-text-secondary block">Target Output Format</span>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { label: "JPEG (Lossy)", fmt: "image/jpeg" },
                    { label: "WebP (Modern)", fmt: "image/webp" },
                    { label: "PNG (Lossless)", fmt: "image/png" },
                  ] as const
                ).map(({ label, fmt }) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => handleFormatChange(fmt)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      format === fmt
                        ? "border-accent text-accent bg-accent/10 font-bold"
                        : "border-border-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider */}
            {format !== "image/png" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary">Compression Quality</span>
                  <span className="font-bold text-accent">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={quality}
                  onChange={(e) => handleQualityChange(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer h-1.5 bg-border-subtle rounded-lg"
                />
              </div>
            )}

            {/* Resize Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Max Width Resize (0 = original)</span>
                <span className="font-bold text-text-primary">{maxWidth > 0 ? `${maxWidth}px` : "Original"}</span>
              </div>
              <input
                type="range"
                min={0}
                max={original.width}
                step={50}
                value={maxWidth}
                onChange={(e) => handleMaxWidthChange(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer h-1.5 bg-border-subtle rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Output Comparison & Download */}
        {compressed && original && (
          <div className="pt-3 border-t border-border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-text-primary">
                Compressed Result ({formatBytes(compressedSize)} ·{" "}
                <span className={reductionPercent > 0 ? "text-success" : "text-text-muted"}>
                  {reductionPercent > 0 ? `${reductionPercent}% smaller` : "ready"}
                </span>
                )
              </span>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Download Compressed Image
              </button>
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-page p-3 flex items-center justify-center max-h-72 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={compressed}
                alt="Compressed"
                className="max-h-64 object-contain rounded"
              />
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
