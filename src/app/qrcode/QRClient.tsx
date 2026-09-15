"use client";

import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import ToolLayout from "@/components/ToolLayout";

export default function QRClient() {
  const [text, setText] = useState("https://megatools.dev");
  const [dataUrl, setDataUrl] = useState<string>("");
  const [size, setSize] = useState(300);
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");

  const generateQR = useCallback(async () => {
    if (!text.trim()) {
      setDataUrl("");
      return;
    }
    try {
      const url = await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorCorrection,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setDataUrl(url);
    } catch {
      setDataUrl("");
    }
  }, [text, size, errorCorrection]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handleDownload = (format: "png" | "svg") => {
    if (!dataUrl) return;
    if (format === "png") {
      const link = document.createElement("a");
      link.download = "qrcode.png";
      link.href = dataUrl;
      link.click();
    } else {
      QRCode.toString(
        text,
        {
          type: "svg",
          width: size,
          margin: 2,
          errorCorrectionLevel: errorCorrection,
        },
        (err, svgString) => {
          if (err) return;
          const blob = new Blob([svgString], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "qrcode.svg";
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      );
    }
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Payload Length:</span>
        <span className="text-accent font-bold">{text.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Resolution:</span>
        <span className="text-text-primary">{size} × {size} px</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">ECC Level:</span>
        <span className="text-success font-bold">{errorCorrection} (Standard)</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="qrcode" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">QR Code Content (URL / Text)</span>
            <button
              type="button"
              onClick={() => setText("")}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
            >
              [Clear]
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter URL, Wi-Fi credentials, vCard, or plaintext..."
            rows={4}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Configuration Sliders & Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Image Dimension</span>
              <span className="font-bold text-accent">{size}px</span>
            </div>
            <input
              type="range"
              min={128}
              max={600}
              step={32}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer h-1.5 bg-border-subtle rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-text-secondary block">Error Correction Level</span>
            <div className="flex items-center gap-1.5">
              {(["L", "M", "Q", "H"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setErrorCorrection(lvl)}
                  className={`flex-1 py-1 rounded border text-xs font-mono transition-colors ${
                    errorCorrection === lvl
                      ? "border-accent text-accent bg-accent/10 font-bold"
                      : "border-border-subtle text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* QR Code Canvas & Download Buttons */}
        <div className="pt-3 border-t border-border-subtle flex flex-col items-center justify-center space-y-4">
          {dataUrl ? (
            <div className="p-3 bg-white rounded-xl shadow-lg border border-border-subtle inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={dataUrl}
                alt="Generated QR Code"
                className="w-56 h-56 object-contain"
              />
            </div>
          ) : (
            <div className="w-56 h-56 rounded-xl border border-border-subtle bg-bg-page flex items-center justify-center text-xs text-text-muted">
              Enter content to generate
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownload("png")}
              disabled={!dataUrl}
              className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={() => handleDownload("svg")}
              disabled={!dataUrl}
              className="px-4 py-2 rounded-lg border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download SVG
            </button>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
