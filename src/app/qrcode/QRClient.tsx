"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

export default function QRClient() {
  const [text, setText] = useState("https://example.com");
  const [dataUrl, setDataUrl] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Width</p>
        <p className="text-text-primary font-mono">300 px</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Chars</p>
        <p className="text-text-primary font-mono">{text.length}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">QR Code Generator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Generate QR codes from any text or URL. Runs entirely in your browser.
            </p>
          </div>

          {/* Input */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Text or URL
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text or URL..."
              className="input-field h-12"
            />
          </div>

          {/* QR Preview */}
          <div className="flex justify-center mb-6">
            {dataUrl ? (
              <div className="rounded-xl border border-border-subtle bg-white p-4">
                <img
                  src={dataUrl}
                  alt="QR Code"
                  className="block max-w-full h-auto w-[300px]"
                />
              </div>
            ) : (
              <div className="flex h-[332px] w-[332px] items-center justify-center rounded-xl border border-border-subtle bg-bg-page">
                <span className="text-sm text-text-muted">Enter text to generate</span>
              </div>
            )}
          </div>

          {/* Download button */}
          <div className="flex justify-center">
            <button
              onClick={handleDownload}
              disabled={!dataUrl}
              className="btn-primary w-full sm:w-auto px-8"
            >
              Download PNG
            </button>
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="qrcode" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl hover:bg-accent/90 transition-colors"
      >
        💡
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="qrcode" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
