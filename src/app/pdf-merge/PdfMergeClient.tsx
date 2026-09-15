"use client";

import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/ToolLayout";

interface PdfItem {
  id: string;
  file: File;
  pageCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function PdfMergeClient() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [mergedSize, setMergedSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const newItems: PdfItem[] = [];

    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        continue;
      }
      try {
        const buffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        newItems.push({
          id: Math.random().toString(36).slice(2),
          file,
          pageCount: doc.getPageCount(),
        });
      } catch (err) {
        setError(`Failed to read "${file.name}": ${(err as Error).message}`);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setMergedBlobUrl(null);
    }
  }, []);

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setMergedBlobUrl(null);
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    setItems((prev) => {
      const next = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
    setMergedBlobUrl(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setError("Please add at least 2 PDF documents to merge.");
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const mergedDoc = await PDFDocument.create();

      for (const item of items) {
        const buffer = await item.file.arrayBuffer();
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const indices = srcDoc.getPageIndices();
        const copiedPages = await mergedDoc.copyPages(srcDoc, indices);
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      }

      const pdfBytes = await mergedDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedBlobUrl(url);
      setMergedSize(blob.size);
    } catch (err) {
      setError(`Merge failed: ${(err as Error).message}`);
    } finally {
      setIsMerging(false);
    }
  };

  const totalPages = items.reduce((acc, item) => acc + item.pageCount, 0);
  const totalInputSize = items.reduce((acc, item) => acc + item.file.size, 0);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Files:</span>
        <span className="text-accent font-bold">{items.length} PDFs</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Pages:</span>
        <span className="text-text-primary">{totalPages} pages</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Combined Input:</span>
        <span className="text-text-primary">{formatBytes(totalInputSize)}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Privacy:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="pdf-merge" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Upload Dropzone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border-subtle hover:border-accent/40 bg-bg-page"
          }`}
        >
          <span className="text-2xl mb-2">📑</span>
          <span className="text-sm font-semibold text-text-primary">
            Drop PDF documents here or click to browse
          </span>
          <span className="text-xs text-text-muted mt-1">
            Zero server uploads — documents are combined directly in your browser with pdf-lib.
          </span>
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            className="hidden"
          />
        </label>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* PDF Queue List */}
        {items.length > 0 && (
          <div className="pt-2 border-t border-border-subtle space-y-3">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                PDF Merge Queue ({items.length} Files · {totalPages} Pages)
              </span>
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setMergedBlobUrl(null);
                }}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear All]
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="w-6 h-6 rounded bg-bg-card border border-border-subtle text-accent font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-text-primary block truncate">{item.file.name}</span>
                      <span className="text-text-muted text-[10px]">
                        {item.pageCount} pages · {formatBytes(item.file.size)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveItem(index, "up")}
                      className="px-2 py-0.5 rounded border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => moveItem(index, "down")}
                      className="px-2 py-0.5 rounded border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="px-2 py-0.5 rounded border border-border-subtle text-text-muted hover:text-error hover:border-error/40 transition-colors"
                      title="Remove document"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleMerge}
                disabled={isMerging || items.length < 2}
                className="w-full py-2.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isMerging ? "Merging Documents..." : `Merge ${items.length} PDF Documents`}
              </button>
            </div>
          </div>
        )}

        {/* Download Action */}
        {mergedBlobUrl && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-success">
                ✓ PDF Documents Successfully Merged ({formatBytes(mergedSize)})
              </span>
              <a
                href={mergedBlobUrl}
                download="merged-document.pdf"
                className="px-4 py-1.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Download Merged PDF
              </a>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
