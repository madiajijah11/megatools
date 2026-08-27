"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

function parsePageRanges(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr.trim()) return [];
  const pagesSet = new Set<number>();
  const parts = rangeStr.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          pagesSet.add(i - 1);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pagesSet.add(p - 1);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

export default function PdfSplitClient() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState("");
  const [splitting, setSplitting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (selectedFile: File) => {
    setError(null);
    setDownloadUrl(null);

    if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid .pdf file.");
      return;
    }

    try {
      const buf = await selectedFile.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setFile(selectedFile);
      setBuffer(buf);
      setPageCount(count);
      setRangeInput(`1-${Math.min(count, 3)}`);
    } catch (err) {
      setError(`Failed to read PDF: ${(err as Error).message}`);
    }
  }, []);

  const parsedIndices = useMemo(() => {
    return parsePageRanges(rangeInput, pageCount);
  }, [rangeInput, pageCount]);

  const handleSplit = async () => {
    if (!buffer || parsedIndices.length === 0) {
      setError("No valid pages selected.");
      return;
    }
    setSplitting(true);
    setError(null);

    try {
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const outDoc = await PDFDocument.create();
      const copiedPages = await outDoc.copyPages(srcDoc, parsedIndices);
      copiedPages.forEach((p) => outDoc.addPage(p));

      const pdfBytes = await outDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      setError(`Split failed: ${(err as Error).message}`);
    } finally {
      setSplitting(false);
    }
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Total Pages</p>
        <p className="text-text-primary font-mono">{pageCount || "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Selected</p>
        <p className="text-text-primary font-mono">
          {parsedIndices.length ? `${parsedIndices.length} pgs` : "—"}
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
              <span className="gradient-text">Split PDF</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Extract pages or custom ranges from a PDF document.
            </p>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-8 text-center transition-colors ${
                dragOver
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle bg-bg-page hover:border-accent"
              }`}
            >
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <span className="font-mono text-sm text-text-secondary">
                $ drop a .pdf file here -- or click to select
              </span>
              <span className="text-xs text-text-muted">100% in-browser processing</span>
            </label>
          ) : (
            <div className="space-y-6">
              {/* Selected File Card */}
              <div className="flex items-center justify-between rounded border border-border-subtle bg-bg-page p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-text-primary">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {pageCount} total pages · {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setBuffer(null);
                    setPageCount(0);
                    setDownloadUrl(null);
                  }}
                  className="btn-secondary text-xs shrink-0"
                >
                  Change File
                </button>
              </div>

              {/* Range Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text-secondary">
                  Page range to extract
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => {
                      setRangeInput(e.target.value);
                      setDownloadUrl(null);
                    }}
                    placeholder="e.g. 1-3, 5, 8-10"
                    className="input-field flex-1 font-mono"
                  />
                  <button
                    onClick={() => {
                      setRangeInput(`1-${pageCount}`);
                      setDownloadUrl(null);
                    }}
                    className="btn-secondary text-xs shrink-0"
                  >
                    All Pages
                  </button>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  Use commas and hyphens: <span className="text-accent font-mono">1-3, 5, 8</span>{" "}
                  (Valid page numbers: 1 to {pageCount})
                </p>
              </div>

              {/* Quick Preview of Parsed Pages */}
              <div className="rounded border border-border-subtle bg-bg-page p-3 text-xs">
                <span className="text-text-muted font-semibold">Selected Pages: </span>
                {parsedIndices.length > 0 ? (
                  <span className="font-mono text-accent">
                    {parsedIndices.map((i) => i + 1).join(", ")} ({parsedIndices.length} pages total)
                  </span>
                ) : (
                  <span className="text-error font-mono">No valid pages in range</span>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSplit}
                  disabled={splitting || parsedIndices.length === 0}
                  className="btn-primary"
                >
                  {splitting ? "Extracting..." : `$ extract ${parsedIndices.length} pages`}
                </button>
              </div>

              {/* Download link */}
              {downloadUrl && (
                <div className="mt-4 rounded border border-accent/40 bg-accent-soft p-4 text-center">
                  <p className="text-sm font-semibold text-accent mb-2">
                    ✓ PDF pages extracted ({parsedIndices.length} pages)
                  </p>
                  <a
                    href={downloadUrl}
                    download={`extracted-${file.name}`}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Download extracted.pdf
                  </a>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-error text-center">{error}</p>}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="pdf-split" stats={stats} />
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
        <InfoPanel toolId="pdf-split" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
