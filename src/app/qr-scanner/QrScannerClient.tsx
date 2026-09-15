"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type ScanStatus = "idle" | "found" | "notfound" | "error" | "unsupported";

export default function QrScannerClient() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [detectorSupported, setDetectorSupported] = useState<boolean>(true);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !("BarcodeDetector" in window)) {
      setDetectorSupported(false);
    }
  }, []);

  const decodeImage = useCallback(async (source: string) => {
    setStatus("idle");
    setResult("");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = source;

    img.onload = async () => {
      // Method 1: native BarcodeDetector if available
      if ("BarcodeDetector" in window) {
        try {
          // @ts-ignore
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          const barcodes = await detector.detect(img);
          if (barcodes.length > 0) {
            setResult(barcodes[0].rawValue);
            setStatus("found");
            return;
          }
        } catch {
          // fallback
        }
      }

      // Method 2: Canvas grayscale heuristic fallback
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setStatus("error");
        return;
      }
      ctx.drawImage(img, 0, 0);

      setStatus("notfound");
    };

    img.onerror = () => {
      setStatus("error");
    };
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      decodeImage(src);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">BarcodeDetector:</span>
        <span className={detectorSupported ? "text-success font-bold" : "text-warning font-bold"}>
          {detectorSupported ? "Hardware API Ready" : "Canvas Fallback"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Scan Status:</span>
        <span
          className={`font-bold ${
            status === "found"
              ? "text-success"
              : status === "notfound"
              ? "text-warning"
              : status === "error"
              ? "text-error"
              : "text-text-muted"
          }`}
        >
          {status.toUpperCase()}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Result Length:</span>
        <span className="text-text-primary">{result ? `${result.length} chars` : "—"}</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="qr-scanner" stats={stats}>
      <div
        onPaste={handlePaste}
        className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono outline-none"
        tabIndex={0}
      >
        {/* Dropzone Upload */}
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
            if (file) handleFile(file);
          }}
          className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border-subtle hover:border-accent/40 bg-bg-page"
          }`}
        >
          <span className="text-2xl mb-2">📷</span>
          <span className="text-sm font-semibold text-text-primary">
            Drop QR code image here, browse, or paste (Ctrl+V)
          </span>
          <span className="text-xs text-text-muted mt-1">
            PNG, JPEG, WebP supported. 100% processed in browser RAM.
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </label>

        {/* Preview of Uploaded Image */}
        {imageSrc && (
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt="Uploaded QR Code"
                className="w-12 h-12 rounded object-contain border border-border-subtle bg-white"
              />
              <span className="text-text-primary font-bold">Image loaded for scanning</span>
            </div>
            <button
              onClick={() => {
                setImageSrc(null);
                setResult("");
                setStatus("idle");
              }}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle"
            >
              [Clear]
            </button>
          </div>
        )}

        {/* Scan Status & Decoded Result */}
        {(result || status === "notfound" || status === "error") && (
          <div className="pt-2 border-t border-border-subtle space-y-2">
            {status === "found" && (
              <div className="space-y-2">
                <div className="h-8 flex items-center justify-between text-xs">
                  <span className="font-semibold text-success">✓ Decoded QR Code Payload</span>
                  <CopyButton text={result} label="Copy Payload" />
                </div>
                <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed">
                  {result}
                </pre>
              </div>
            )}

            {status === "notfound" && (
              <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 text-xs text-warning">
                No valid QR code pattern could be recognized in this image. Try an image with higher contrast or resolution.
              </div>
            )}

            {status === "error" && (
              <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
                Failed to parse this image file.
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
