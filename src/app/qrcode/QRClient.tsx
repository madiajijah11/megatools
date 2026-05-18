"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";

export default function QRClient() {
  const [text, setText] = useState("https://example.com");
  const [dataUrl, setDataUrl] = useState("");

  const generateQR = useCallback(async () => {
    if (!text) {
      setDataUrl("");
      return;
    }
    try {
      const url = await QRCode.toDataURL(text, { width: 300, margin: 2 });
      setDataUrl(url);
    } catch {
      setDataUrl("");
    }
  }, [text]);

  useEffect(() => {
    generateQR();
  }, [generateQR]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-mega-muted hover:text-mega-accent-light transition-colors mb-6 sm:mb-8"
      >
        ← Back to Tools
      </Link>

      <div className="glass rounded-2xl p-4 sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">QR Code Generator</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-mega-muted">
            Generate QR codes from any text or URL. Runs entirely in your browser.
          </p>
        </div>

        {/* Input */}
        <div className="mb-4 sm:mb-6">
          <label className="mb-2 block text-sm font-medium text-mega-muted">
            Text or URL
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL..."
            className="w-full rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm text-mega-text placeholder-mega-muted/40 outline-none transition-colors focus:border-mega-accent"
          />
        </div>

        {/* QR Preview */}
        <div className="flex justify-center mb-4 sm:mb-6">
          {dataUrl ? (
            <div className="rounded-xl border border-mega-border bg-white p-2 sm:p-4">
              <img
                src={dataUrl}
                alt="QR Code"
                className="block max-w-full h-auto w-[300px] sm:w-[300px]"
              />
            </div>
          ) : (
            <div className="flex h-64 w-64 sm:h-[332px] sm:w-[332px] items-center justify-center rounded-xl border border-mega-border bg-mega-dark/50">
              <span className="text-sm text-mega-muted">Enter text to generate</span>
            </div>
          )}
        </div>

        {/* Download button */}
        <div className="flex justify-center">
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="w-full sm:w-auto rounded-xl bg-mega-accent px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
