"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

interface PdfItem {
  id: string;
  file: File;
  pageCount: number;
  buffer: ArrayBuffer;
}

export default function PdfMergeClient() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [merging, setMerging] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const newItems: PdfItem[] = [];

    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          pageCount: doc.getPageCount(),
          buffer,
        });
      } catch (err) {
        setError(`Failed to read "${file.name}": ${(err as Error).message}`);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setDownloadUrl(null);
    }
  }, []);

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
    setDownloadUrl(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDownloadUrl(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setError("Please add at least 2 PDF files to merge.");
      return;
    }
    setMerging(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of items) {
        const pdf = await PDFDocument.load(item.buffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      setError(`Merge failed: ${(err as Error).message}`);
    } finally {
      setMerging(false);
    }
  };

  const totalPages = items.reduce((acc, curr) => acc + curr.pageCount, 0);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Files</p>
        <p className="text-text-primary font-mono">{items.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Total Pages</p>
        <p className="text-text-primary font-mono">{totalPages || "—"}</p>
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
              <span className="gradient-text">Merge PDF</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Combine multiple PDF files into one. Fast & 100% in-browser.
            </p>
          </div>

          {/* Dropzone */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) {
                handleFiles(e.dataTransfer.files);
              }
            }}
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-8 text-center transition-colors ${
              dragOver
                ? "border-accent bg-accent-soft"
                : "border-border-subtle bg-bg-page hover:border-accent"
            }`}
          >
            <input
              type="file"
              multiple
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <span className="font-mono text-sm text-text-secondary">
              $ drop multiple .pdf files here -- or click to select
            </span>
            <span className="text-xs text-text-muted">Client-side only · No size limit</span>
          </label>

          {error && <p className="mt-4 text-sm text-error text-center">{error}</p>}

          {/* File list */}
          {items.length > 0 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                PDF Files to Merge ({items.length}) — Top to Bottom Order
              </p>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded border border-border-subtle bg-bg-page p-3 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-accent font-mono text-xs">[{index + 1}]</span>
                    <span className="truncate text-text-primary font-mono">{item.file.name}</span>
                    <span className="text-xs text-text-muted shrink-0">
                      ({item.pageCount} {item.pageCount === 1 ? "page" : "pages"} ·{" "}
                      {(item.file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="px-2 py-1 text-xs btn-secondary disabled:opacity-30"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      className="px-2 py-1 text-xs btn-secondary disabled:opacity-30"
                      title="Move down"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="px-2 py-1 text-xs text-error hover:bg-error/10 rounded transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-subtle">
                <button
                  onClick={() => {
                    setItems([]);
                    setDownloadUrl(null);
                  }}
                  className="btn-secondary text-xs"
                >
                  Clear All
                </button>

                <button
                  onClick={handleMerge}
                  disabled={merging || items.length < 2}
                  className="btn-primary"
                >
                  {merging ? "Merging..." : `$ merge ${items.length} pdfs`}
                </button>
              </div>
            </div>
          )}

          {/* Download ready */}
          {downloadUrl && (
            <div className="mt-6 rounded border border-accent/40 bg-accent-soft p-4 text-center">
              <p className="text-sm font-semibold text-accent mb-2">
                ✓ PDF merge complete ({totalPages} pages)
              </p>
              <a
                href={downloadUrl}
                download="merged.pdf"
                className="btn-primary inline-flex items-center gap-2"
              >
                Download merged.pdf
              </a>
            </div>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="pdf-merge" stats={stats} />
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
        <InfoPanel toolId="pdf-merge" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
