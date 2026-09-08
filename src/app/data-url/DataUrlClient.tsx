"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface FileAssetInfo {
  name: string;
  mimeType: string;
  originalBytes: number;
  dataUrl: string;
  isImage: boolean;
}

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="20" fill="#101713" stroke="#4ade80" stroke-width="4"/>
  <circle cx="50" cy="50" r="28" fill="none" stroke="#4ade80" stroke-width="6"/>
  <circle cx="50" cy="50" r="10" fill="#4ade80"/>
</svg>`;
export default function DataUrlClient() {
  const [asset, setAsset] = useState<FileAssetInfo>(() => {
    const b64 = typeof window !== "undefined" ? btoa(SAMPLE_SVG) : "";
    const dataUrl = "data:image/svg+xml;base64," + b64;
    return {
      name: "sample-badge.svg",
      mimeType: "image/svg+xml",
      originalBytes: SAMPLE_SVG.length,
      dataUrl,
      isImage: true,
    };
  });

  const [dragOver, setDragOver] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [textInput, setTextInput] = useState<string>(SAMPLE_SVG);
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [customMime, setCustomMime] = useState<string>("image/svg+xml");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const isImg = file.type.startsWith("image/") || file.name.endsWith(".svg");
      setAsset({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        originalBytes: file.size,
        dataUrl,
        isImage: isImg,
      });
      setCustomMime(file.type || "application/octet-stream");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleTextConvert = () => {
    if (!textInput) return;
    try {
      const utf8Bytes = new TextEncoder().encode(textInput);
      let binary = "";
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const b64 = btoa(binary);
      const dataUrl = "data:" + (customMime || "text/plain") + ";base64," + b64;
      const isImg = customMime.startsWith("image/") || customMime.includes("svg");
      setAsset({
        name: "custom-input.txt",
        mimeType: customMime || "text/plain",
        originalBytes: utf8Bytes.length,
        dataUrl,
        isImage: isImg,
      });
    } catch {
      // ignore
    }
  };

  // Code Output snippets
  const snippets = useMemo(() => {
    const url = asset.dataUrl;
    const cssBg = "background-image: url('" + url + "');";
    const htmlImg = '<img src="' + url + '" alt="' + asset.name + '" />';
    const jsImport = 'const assetUri = "' + url + '";';

    const base64Only = url.includes(",") ? url.split(",")[1] : url;
    const encodedLength = url.length;
    const overheadPercent =
      asset.originalBytes > 0
        ? Math.round(((encodedLength - asset.originalBytes) / asset.originalBytes) * 100)
        : 33;

    return {
      raw: url,
      css: cssBg,
      html: htmlImg,
      js: jsImport,
      base64Only,
      encodedLength,
      overheadPercent,
    };
  }, [asset]);

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Original Size:</span>
        <span className="text-text-primary font-bold">
          {(asset.originalBytes / 1024).toFixed(2)} KB ({asset.originalBytes.toLocaleString()} B)
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Data URI Size:</span>
        <span className="text-accent font-bold">
          {(snippets.encodedLength / 1024).toFixed(2)} KB ({snippets.encodedLength.toLocaleString()} B)
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Size Overhead:</span>
        <span className="text-warning font-bold">+{snippets.overheadPercent}%</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">MIME Type:</span>
        <span className="text-accent font-bold">{asset.mimeType}</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent transition-colors"
        >
          <span>←</span> [cd .. / home]
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
        >
          [?] Tool Info
        </button>
      </div>

      {/* Hero Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-subtle bg-bg-card font-mono text-xs text-text-secondary mb-3">
          <span className="text-accent">$</span>
          <span>megatools --data-url-studio --asset-inline</span>
          <span className="animate-pulse text-accent">▊</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Base64 Data URL & <span className="gradient-text">Asset Embedder</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Transform images, fonts, SVGs, and files into RFC 2397 Data URLs, CSS background-image rules, and HTML elements.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Input & Snippets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Tabs */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-4 font-mono text-xs">
            <div className="h-8 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-bg-page border border-border-subtle rounded p-0.5">
                <button
                  onClick={() => setActiveTab("file")}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    activeTab === "file"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  File Upload
                </button>
                <button
                  onClick={() => setActiveTab("text")}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    activeTab === "text"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Raw SVG / Text
                </button>
              </div>

              <span className="text-text-muted text-[11px]">
                Active: {asset.name} ({asset.mimeType})
              </span>
            </div>

            {activeTab === "file" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={"p-8 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors " + (
                  dragOver
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border-subtle bg-bg-page hover:border-accent/40 text-text-secondary"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) processFile(f);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center text-xl mx-auto mb-2">
                  📦
                </div>
                <p className="font-bold text-text-primary">
                  Drop image, font, SVG, or document to encode
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Supports PNG, JPG, WebP, SVG, WOFF2, TTF, JSON, PDF (Zero server upload)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMime}
                    onChange={(e) => setCustomMime(e.target.value)}
                    placeholder="MIME type (e.g. image/svg+xml, text/plain)..."
                    className="flex-1 bg-bg-page border border-border-subtle rounded px-2.5 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={handleTextConvert}
                    className="px-3 py-1.5 rounded bg-accent text-bg-page font-bold hover:bg-accent-hover transition-colors cursor-pointer"
                  >
                    Encode Text
                  </button>
                </div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste SVG markup or raw string here..."
                  rows={4}
                  className="w-full bg-bg-page border border-border-subtle rounded p-2.5 text-xs text-text-primary focus:border-accent focus:outline-none resize-y"
                />
              </div>
            )}
          </div>

          {/* Asset Preview & Snippet Cards */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-4 font-mono text-xs">
            <div className="h-8 flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> EMBEDDING_CODE_SNIPPETS
              </span>
              {asset.isImage && (
                <span className="text-success text-[11px]">Visual Preview Active</span>
              )}
            </div>

            {/* Image Thumbnail Preview if applicable */}
            {asset.isImage && (
              <div className="p-3 rounded bg-bg-page border border-border-subtle flex items-center gap-4">
                <div className="w-16 h-16 rounded border border-border-subtle bg-bg-card p-1 flex items-center justify-center overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.dataUrl}
                    alt={asset.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-bold text-text-primary block">{asset.name}</span>
                  <span className="text-[11px] text-text-muted">
                    MIME: {asset.mimeType} · {asset.originalBytes.toLocaleString()} bytes
                  </span>
                </div>
              </div>
            )}

            {/* Snippet 1: Raw Data URL */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-text-muted">RFC 2397 Data URL:</label>
                <CopyButton text={snippets.raw} label="copy data url" />
              </div>
              <div className="p-2.5 rounded bg-bg-page border border-border-subtle max-h-24 overflow-y-auto break-all text-[11px] text-accent select-all">
                {snippets.raw}
              </div>
            </div>

            {/* Snippet 2: CSS background-image */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-text-muted">CSS background-image rule:</label>
                <CopyButton text={snippets.css} label="copy css" />
              </div>
              <div className="p-2.5 rounded bg-bg-page border border-border-subtle max-h-24 overflow-y-auto break-all text-[11px] text-text-primary select-all">
                {snippets.css}
              </div>
            </div>

            {/* Snippet 3: HTML <img> */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <label className="text-text-muted">HTML &lt;img&gt; Element:</label>
                <CopyButton text={snippets.html} label="copy html" />
              </div>
              <div className="p-2.5 rounded bg-bg-page border border-border-subtle max-h-24 overflow-y-auto break-all text-[11px] text-text-primary select-all">
                {snippets.html}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Info Panel Desktop */}
        <div className="hidden lg:block">
          <InfoPanel toolId="data-url" stats={stats} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="data-url" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
