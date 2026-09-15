"use client";

import { useState, useCallback, useMemo } from "react";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/ToolLayout";

function parsePageRanges(input: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pages.add(p);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pages.add(page);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function PdfSplitClient() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [rangeInput, setRangeInput] = useState<string>("1");
  const [isSplitting, setIsSplitting] = useState<boolean>(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadSize, setDownloadSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const selectedPages = useMemo(() => {
    if (pageCount === 0) return [];
    return parsePageRanges(rangeInput, pageCount);
  }, [rangeInput, pageCount]);

  const handleFile = useCallback(async (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      setError("Please select a valid .pdf document.");
      return;
    }
    setError(null);
    setDownloadUrl(null);

    try {
      const arrayBuf = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuf, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      setFile(selectedFile);
      setBuffer(arrayBuf);
      setPageCount(count);
      setRangeInput(count >= 2 ? "1-2" : "1");
    } catch (err) {
      setError(`Failed to read PDF: ${(err as Error).message}`);
    }
  }, []);

  const handleSplit = async () => {
    if (!buffer || selectedPages.length === 0) {
      setError("No valid pages selected for extraction.");
      return;
    }

    setIsSplitting(true);
    setError(null);

    try {
      const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      const pageIndices = selectedPages.map((p) => p - 1);
      const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadSize(blob.size);
    } catch (err) {
      setError(`Split failed: ${(err as Error).message}`);
    } finally {
      setIsSplitting(false);
    }
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Pages:</span>
        <span className="text-accent font-bold">{pageCount || "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Extracted Pages:</span>
        <span className="text-success font-bold">{selectedPages.length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Source Size:</span>
        <span className="text-text-primary">{file ? formatBytes(file.size) : "—"}</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="pdf-split" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
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
              const dropped = e.dataTransfer.files[0];
              if (dropped) handleFile(dropped);
            }}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border-subtle hover:border-accent/40 bg-bg-page"
            }`}
          >
            <span className="text-2xl mb-2">✂️</span>
            <span className="text-sm font-semibold text-text-primary">
              Drop PDF document here to split
            </span>
            <span className="text-xs text-text-muted mt-1">
              Extract specific page ranges locally in your browser memory.
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
          </label>
        ) : (
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 truncate">
              <span className="text-base">📄</span>
              <div className="truncate">
                <span className="font-bold text-text-primary block truncate">{file.name}</span>
                <span className="text-text-muted text-[10px]">
                  {pageCount} total pages · {formatBytes(file.size)}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setBuffer(null);
                setPageCount(0);
                setDownloadUrl(null);
              }}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle shrink-0"
            >
              [Change Document]
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Page Range Extraction Input */}
        {file && pageCount > 0 && (
          <div className="pt-2 border-t border-border-subtle space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">Page Ranges to Extract</span>
                <span className="text-text-muted">
                  Valid page range: 1 to {pageCount}
                </span>
              </div>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => {
                  setRangeInput(e.target.value);
                  setDownloadUrl(null);
                }}
                placeholder="e.g. 1-3, 5, 8-10"
                className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            {/* Quick Range Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-text-muted text-[11px]">Presets:</span>
              <button
                type="button"
                onClick={() => setRangeInput("1")}
                className="px-2 py-0.5 rounded border border-border-subtle bg-bg-page text-text-secondary hover:border-accent hover:text-accent"
              >
                Page 1
              </button>
              {pageCount >= 2 && (
                <button
                  type="button"
                  onClick={() => setRangeInput(`1-${Math.min(pageCount, 5)}`)}
                  className="px-2 py-0.5 rounded border border-border-subtle bg-bg-page text-text-secondary hover:border-accent hover:text-accent"
                >
                  First {Math.min(pageCount, 5)} Pages
                </button>
              )}
              {pageCount >= 2 && (
                <button
                  type="button"
                  onClick={() => setRangeInput(String(pageCount))}
                  className="px-2 py-0.5 rounded border border-border-subtle bg-bg-page text-text-secondary hover:border-accent hover:text-accent"
                >
                  Last Page ({pageCount})
                </button>
              )}
            </div>

            {/* Active Selected Pages Summary */}
            <div className="p-3 rounded-lg border border-border-subtle bg-bg-page text-xs">
              <span className="text-text-muted block mb-1 text-[11px]">Selected Pages for Extraction:</span>
              {selectedPages.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedPages.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30 font-bold text-xs"
                    >
                      Page {p}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-error text-xs">No valid pages in range.</span>
              )}
            </div>

            {/* Split Button */}
            <button
              type="button"
              onClick={handleSplit}
              disabled={isSplitting || selectedPages.length === 0}
              className="w-full py-2.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSplitting ? "Extracting Pages..." : `Extract ${selectedPages.length} Pages`}
            </button>
          </div>
        )}

        {/* Download Button */}
        {downloadUrl && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-success">
                ✓ Extracted PDF Ready ({formatBytes(downloadSize)})
              </span>
              <a
                href={downloadUrl}
                download={`extracted-${file?.name || "pages.pdf"}`}
                className="px-4 py-1.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Download Extracted PDF
              </a>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
