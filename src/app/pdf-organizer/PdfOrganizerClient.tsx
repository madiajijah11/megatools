"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { PDFDocument, degrees } from "pdf-lib";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

interface PageMeta {
  originalIndex: number; // 0-based
  currentRotation: number; // 0, 90, 180, 270
  width: number;
  height: number;
}
export default function PdfOrganizerClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPdf = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF document.");
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const doc = await PDFDocument.load(bytes);
      const count = doc.getPageCount();

      const metas: PageMeta[] = [];
      for (let i = 0; i < count; i++) {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const rot = page.getRotation().angle;
        metas.push({
          originalIndex: i,
          currentRotation: rot,
          width: Math.round(width),
          height: Math.round(height),
        });
      }

      setFile(selectedFile);
      setPdfBytes(bytes);
      setPages(metas);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load PDF file.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) loadPdf(dropped);
  };

  // Reorder actions
  const movePage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= pages.length) return;
    setPages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      return copy;
    });
  };

  // Rotation actions
  const rotatePage = (idx: number, deltaDeg: number) => {
    setPages((prev) => {
      const copy = [...prev];
      const target = { ...copy[idx] };
      target.currentRotation = (target.currentRotation + deltaDeg + 360) % 360;
      copy[idx] = target;
      return copy;
    });
  };

  const rotateAll = (deltaDeg: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        currentRotation: (p.currentRotation + deltaDeg + 360) % 360,
      }))
    );
  };

  const reverseOrder = () => {
    setPages((prev) => [...prev].reverse());
  };

  const removePage = (idx: number) => {
    setPages((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetPages = () => {
    if (!pdfBytes) return;
    setProcessing(true);
    PDFDocument.load(pdfBytes).then((doc) => {
      const count = doc.getPageCount();
      const metas: PageMeta[] = [];
      for (let i = 0; i < count; i++) {
        const page = doc.getPage(i);
        metas.push({
          originalIndex: i,
          currentRotation: page.getRotation().angle,
          width: Math.round(page.getWidth()),
          height: Math.round(page.getHeight()),
        });
      }
      setPages(metas);
      setProcessing(false);
    });
  };

  // Compile and export modified PDF
  const exportPdf = async () => {
    if (!pdfBytes || pages.length === 0) return;
    setProcessing(true);
    setError(null);
    try {
      const srcDoc = await PDFDocument.load(pdfBytes);
      const newDoc = await PDFDocument.create();

      for (const p of pages) {
        const [copiedPage] = await newDoc.copyPages(srcDoc, [p.originalIndex]);
        copiedPage.setRotation(degrees(p.currentRotation));
        newDoc.addPage(copiedPage);
      }

      const outBytes = await newDoc.save();
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (file?.name.replace(/\.pdf$/i, "") || "document") + "-organized.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to compile organized PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Total Pages:</span>
        <span className="text-accent font-bold">{pages.length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Original Size:</span>
        <span className="text-text-primary font-bold">
          {file ? (file.size / 1024).toFixed(1) + " KB" : "0 KB"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Modified:</span>
        <span className="text-success font-bold">
          {pages.some((p, i) => p.originalIndex !== i || p.currentRotation !== 0) ? "YES" : "NO"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Processing:</span>
        <span className="text-accent font-bold">100% Client-Side</span>
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
          <span>megatools --pdf-organizer --airgapped</span>
          <span className="animate-pulse text-accent">▊</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          PDF Page Rotator & <span className="gradient-text">Reorder Grid</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Reorder page sequence, rotate orientations (90°/180°/270°), and delete unwanted pages with 100% in-browser compilation.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: PDF Organizer Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Dropzone if no file loaded */}
          {!pdfBytes ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={"p-10 rounded-lg border-2 border-dashed text-center cursor-pointer font-mono transition-colors " + (
                dragOver
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border-subtle bg-bg-card hover:border-accent/40 text-text-secondary"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadPdf(f);
                }}
              />
              <div className="w-12 h-12 rounded-full bg-bg-page border border-border-subtle flex items-center justify-center text-2xl mx-auto mb-3">
                📑
              </div>
              <p className="text-sm font-bold text-text-primary">
                Drop your PDF file here, or click to browse
              </p>
              <p className="text-xs text-text-muted mt-1">
                Zero file upload — processed entirely in browser memory
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Toolbar Actions standard: h-8 flex items-center justify-between */}
              <div className="rounded-lg border border-border-subtle bg-bg-card p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary truncate max-w-xs">
                    {file?.name}
                  </span>
                  <span className="text-text-muted">({pages.length} pages)</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => rotateAll(90)}
                    className="px-2 py-1 rounded border border-border-subtle bg-bg-page hover:border-accent/40 hover:text-accent transition-colors cursor-pointer"
                    title="Rotate all pages 90° clockwise"
                  >
                    ↻ Rotate All 90°
                  </button>
                  <button
                    onClick={reverseOrder}
                    className="px-2 py-1 rounded border border-border-subtle bg-bg-page hover:border-accent/40 hover:text-accent transition-colors cursor-pointer"
                    title="Reverse entire document page order"
                  >
                    ⇄ Reverse Order
                  </button>
                  <button
                    onClick={resetPages}
                    className="px-2 py-1 rounded border border-border-subtle text-text-muted hover:text-error hover:border-error/40 transition-colors cursor-pointer"
                    title="Reset to original order and rotation"
                  >
                    Reset
                  </button>

                  <button
                    onClick={exportPdf}
                    disabled={processing || pages.length === 0}
                    className="px-3 py-1 rounded bg-accent text-bg-page font-bold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {processing ? "Compiling..." : "Export PDF (" + pages.length + ")"}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded bg-error/10 border border-error/30 text-xs font-mono text-error">
                  {error}
                </div>
              )}

              {/* Page Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {pages.map((p, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border-subtle bg-bg-card p-3 font-mono flex flex-col justify-between hover:border-accent/40 transition-colors"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between text-[11px] mb-2">
                      <span className="font-bold text-accent">#{idx + 1}</span>
                      <span className="text-text-muted text-[10px]">
                        Orig: #{p.originalIndex + 1}
                      </span>
                    </div>

                    {/* Visual Card Representation */}
                    <div className="h-32 rounded bg-bg-page border border-border-subtle flex flex-col items-center justify-center p-2 relative overflow-hidden mb-3">
                      <div
                        className="w-14 h-20 rounded border border-border-subtle bg-bg-card flex flex-col items-center justify-center transition-transform duration-200"
                        style={{ transform: "rotate(" + p.currentRotation + "deg)" }}
                      >
                        <span className="text-lg text-text-muted">📄</span>
                        <span className="text-[9px] text-text-muted font-bold mt-1">
                          {p.width}×{p.height}
                        </span>
                      </div>
                      <span className="absolute bottom-1 right-2 text-[9px] text-text-muted">
                        {p.currentRotation}°
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between border-t border-border-subtle pt-2 gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => movePage(idx, idx - 1)}
                          disabled={idx === 0}
                          className="px-1.5 py-0.5 rounded border border-border-subtle text-text-secondary hover:text-accent disabled:opacity-30"
                          title="Move left"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => movePage(idx, idx + 1)}
                          disabled={idx === pages.length - 1}
                          className="px-1.5 py-0.5 rounded border border-border-subtle text-text-secondary hover:text-accent disabled:opacity-30"
                          title="Move right"
                        >
                          →
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => rotatePage(idx, 90)}
                          className="px-1.5 py-0.5 rounded border border-border-subtle text-text-secondary hover:text-accent"
                          title="Rotate 90° CW"
                        >
                          ↻
                        </button>
                        <button
                          onClick={() => removePage(idx)}
                          className="px-1.5 py-0.5 rounded border border-border-subtle text-text-muted hover:text-error hover:border-error/40"
                          title="Delete page"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Info Panel Desktop */}
        <div className="hidden lg:block">
          <InfoPanel toolId="pdf-organizer" stats={stats} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="pdf-organizer" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
