"use client";

import { useState, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import { PDFDocument } from "pdf-lib";

interface PdfMeta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
}

const EMPTY_META: PdfMeta = {
  title: "",
  author: "",
  subject: "",
  keywords: "",
  creator: "",
  producer: "",
  creationDate: "",
  modificationDate: "",
};

export default function PdfMetadataEditorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [meta, setMeta] = useState<PdfMeta>(EMPTY_META);
  const [originalMeta, setOriginalMeta] = useState<PdfMeta>(EMPTY_META);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsePdfBuffer = async (buffer: ArrayBuffer, name: string, size: number) => {
    try {
      setIsProcessing(true);
      setError(null);
      setSuccessMsg(null);

      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      const loadedMeta: PdfMeta = {
        title: pdfDoc.getTitle() || "",
        author: pdfDoc.getAuthor() || "",
        subject: pdfDoc.getSubject() || "",
        keywords: pdfDoc.getKeywords() || "",
        creator: pdfDoc.getCreator() || "",
        producer: pdfDoc.getProducer() || "",
        creationDate: pdfDoc.getCreationDate() ? pdfDoc.getCreationDate()!.toISOString() : "",
        modificationDate: pdfDoc.getModificationDate() ? pdfDoc.getModificationDate()!.toISOString() : "",
      };

      setFileName(name);
      setFileSize(size);
      setPageCount(pdfDoc.getPageCount());
      setMeta(loadedMeta);
      setOriginalMeta(loadedMeta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load PDF. File may be encrypted or corrupted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPdf = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file.");
      return;
    }
    setFile(selectedFile);
    const arrayBuffer = await selectedFile.arrayBuffer();
    await parsePdfBuffer(arrayBuffer, selectedFile.name, selectedFile.size);
  };

  const loadDemoPdf = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const doc = await PDFDocument.create();
      doc.setTitle("Confidential Q3 Product Strategy");
      doc.setAuthor("Alice Smith (Director of Product)");
      doc.setSubject("Executive Roadmap & Financial Forecast");
      doc.setKeywords(["strategy", "confidential", "q3", "internal"]);
      doc.setCreator("Adobe Acrobat Pro DC 2026");
      doc.setProducer("macOS Quartz PDFContext");
      doc.setCreationDate(new Date(Date.now() - 86400000 * 30));
      doc.setModificationDate(new Date());

      const page = doc.addPage([600, 400]);
      page.drawText("Demo Confidential Document for Metadata Sanitization testing.", {
        x: 50,
        y: 350,
        size: 14,
      });

      const pdfBytes = await doc.save();
      const demoBlob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const demoFile = new File([demoBlob], "Q3_Strategy_Confidential.pdf", { type: "application/pdf" });
      setFile(demoFile);
      await parsePdfBuffer(pdfBytes.buffer as ArrayBuffer, demoFile.name, demoFile.size);
      setSuccessMsg("Loaded demo document with pre-filled confidential metadata!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate demo PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadPdf(e.dataTransfer.files[0]);
    }
  };

  const handleStripAll = () => {
    setMeta(EMPTY_META);
    setSuccessMsg("All metadata fields purged! Click 'Download Sanitized PDF' to export.");
  };

  const handleReset = () => {
    setMeta(originalMeta);
    setSuccessMsg("Metadata reset to original document values.");
  };

  const handleClearFile = () => {
    setFile(null);
    setFileName("");
    setFileSize(0);
    setMeta(EMPTY_META);
    setOriginalMeta(EMPTY_META);
    setPageCount(0);
    setError(null);
    setSuccessMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

      // Apply metadata updates
      pdfDoc.setTitle(meta.title || "");
      pdfDoc.setAuthor(meta.author || "");
      pdfDoc.setSubject(meta.subject || "");
      pdfDoc.setKeywords(meta.keywords ? meta.keywords.split(",").map((k) => k.trim()).filter(Boolean) : []);
      pdfDoc.setCreator(meta.creator || "");
      pdfDoc.setProducer(meta.producer || "");

      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(modifiedBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const originalName = fileName.replace(/\.pdf$/i, "");
      a.download = `${originalName}-sanitized.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg(`PDF exported successfully as "${originalName}-sanitized.pdf"!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save modified PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filledFieldsCount = Object.values(meta).filter((v) => Boolean(v)).length;
  const isPurged = filledFieldsCount === 0;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Document:</span>
        <span className="text-accent font-bold truncate max-w-[130px]" title={fileName}>
          {fileName || "None"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Pages / Size:</span>
        <span className="text-text-primary font-bold">
          {pageCount} {pageCount === 1 ? "page" : "pages"} ({fileSize > 0 ? (fileSize / 1024).toFixed(1) + " KB" : "0"})
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Privacy Status:</span>
        <span className={isPurged ? "text-success font-bold" : "text-warning font-bold"}>
          {isPurged ? "Clean / Sanitized" : `${filledFieldsCount} Fields Detected`}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Security:</span>
        <span className="text-success font-bold">100% Client-Side RAM</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="pdf-metadata-editor" stats={stats}>
      <div className="space-y-6">
        {/* Upload Zone */}
        {!file ? (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-accent bg-accent/5"
                  : "border-border-subtle bg-bg-card hover:border-text-muted"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    loadPdf(e.target.files[0]);
                  }
                }}
              />
              <div className="space-y-3 font-mono">
                <div className="text-4xl">📑</div>
                <p className="text-sm font-semibold text-text-primary">
                  Drop your PDF file here, or click to browse
                </p>
                <p className="text-xs text-text-muted max-w-md mx-auto">
                  100% Client-Side. Documents are parsed directly in browser memory without server upload.
                </p>
              </div>
            </div>

            {/* Quick Demo Loader */}
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-text-muted">
              <span>Don&apos;t have a PDF ready?</span>
              <button
                type="button"
                onClick={loadDemoPdf}
                disabled={isProcessing}
                className="text-accent underline hover:text-accent-hover transition-colors font-bold"
              >
                Load Sample Confidential PDF
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Document Header & Primary Controls */}
            <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 font-mono space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-border-subtle/50 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">📄</span>
                  <span className="font-bold text-text-primary truncate max-w-[240px] sm:max-w-md" title={fileName}>
                    {fileName}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-bg-page border border-border-subtle text-text-muted whitespace-nowrap">
                    {pageCount} {pageCount === 1 ? "page" : "pages"} · {(fileSize / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStripAll}
                    className="text-xs font-bold px-3 py-1.5 rounded border border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 transition-colors"
                  >
                    [1-Click Strip All]
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs px-2.5 py-1.5 rounded border border-border-subtle hover:text-text-primary text-text-muted transition-colors"
                  >
                    [Reset]
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="text-xs px-2.5 py-1.5 rounded border border-border-subtle hover:text-error text-text-muted transition-colors"
                  >
                    [Change File]
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className="text-xs font-bold px-3.5 py-1.5 rounded bg-accent text-bg-page hover:bg-accent-hover disabled:opacity-40 transition-colors"
                  >
                    {isProcessing ? "Processing..." : "Download Sanitized PDF"}
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">Privacy Status:</span>
                  {isPurged ? (
                    <span className="px-2 py-0.5 rounded bg-success/10 text-success border border-success/30 font-bold">
                      ✓ 100% SANITIZED (Zero Metadata)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 font-bold">
                      ⚠️ {filledFieldsCount} Metadata Fields Active
                    </span>
                  )}
                </div>
                <span className="text-text-muted text-[11px]">
                  {isPurged ? "Safe for public distribution" : "Contains identifiable tags"}
                </span>
              </div>
            </div>

            {/* Notification messages */}
            {successMsg && (
              <div className="p-3 rounded-lg border border-success/30 bg-success/10 text-success text-xs font-mono">
                ✓ {successMsg}
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg border border-error/40 bg-error/10 text-error text-xs font-mono">
                ⚠️ {error}
              </div>
            )}

            {/* Metadata Fields Form */}
            <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
              <div className="h-8 flex items-center justify-between text-xs border-b border-border-subtle/50 pb-2">
                <span className="font-semibold text-accent">Document Metadata Properties</span>
                <span className="text-text-muted text-[11px]">
                  {filledFieldsCount} of 6 fields populated
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Title */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-text-muted font-semibold">Document Title</label>
                    <span className={meta.title ? "text-accent" : "text-text-muted"}>
                      {meta.title ? "POPULATED" : "EMPTY"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={meta.title}
                    onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                    placeholder="e.g. Annual Financial Report"
                    className="w-full rounded border border-border-subtle bg-bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Author */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-text-muted font-semibold">Author / Originator</label>
                    <span className={meta.author ? "text-accent" : "text-text-muted"}>
                      {meta.author ? "POPULATED" : "EMPTY"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={meta.author}
                    onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                    placeholder="e.g. John Doe / Megacorp"
                    className="w-full rounded border border-border-subtle bg-bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-text-muted font-semibold">Subject / Summary</label>
                    <span className={meta.subject ? "text-accent" : "text-text-muted"}>
                      {meta.subject ? "POPULATED" : "EMPTY"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={meta.subject}
                    onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
                    placeholder="e.g. Q3 Performance Summary"
                    className="w-full rounded border border-border-subtle bg-bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Keywords */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-text-muted font-semibold">Keywords (comma-separated)</label>
                    <span className={meta.keywords ? "text-accent" : "text-text-muted"}>
                      {meta.keywords ? "POPULATED" : "EMPTY"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={meta.keywords}
                    onChange={(e) => setMeta({ ...meta, keywords: e.target.value })}
                    placeholder="e.g. finance, quarterly, audit"
                    className="w-full rounded border border-border-subtle bg-bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Creator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-text-muted font-semibold">Creator Tool / Application</label>
                    <span className={meta.creator ? "text-accent" : "text-text-muted"}>
                      {meta.creator ? "POPULATED" : "EMPTY"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={meta.creator}
                    onChange={(e) => setMeta({ ...meta, creator: e.target.value })}
                    placeholder="e.g. Microsoft Word / InDesign"
                    className="w-full rounded border border-border-subtle bg-bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                {/* Producer */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <label className="text-text-muted font-semibold">PDF Producer / Converter</label>
                    <span className={meta.producer ? "text-accent" : "text-text-muted"}>
                      {meta.producer ? "POPULATED" : "EMPTY"}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={meta.producer}
                    onChange={(e) => setMeta({ ...meta, producer: e.target.value })}
                    placeholder="e.g. macOS Quartz PDFContext"
                    className="w-full rounded border border-border-subtle bg-bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Timestamp sidecar */}
              {(meta.creationDate || meta.modificationDate) && (
                <div className="pt-3 border-t border-border-subtle/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-text-muted">
                  <div className="p-2 rounded bg-bg-page border border-border-subtle/50 space-y-0.5">
                    <span className="font-semibold text-text-muted">Creation Timestamp:</span>
                    <div className="text-text-secondary truncate">{meta.creationDate || "N/A"}</div>
                  </div>
                  <div className="p-2 rounded bg-bg-page border border-border-subtle/50 space-y-0.5">
                    <span className="font-semibold text-text-muted">Modification Timestamp:</span>
                    <div className="text-text-secondary truncate">{meta.modificationDate || "N/A"}</div>
                  </div>
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-border-subtle/50 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-text-muted">
                  Files are saved in browser memory — zero uploads to remote servers.
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-lg bg-accent text-bg-page font-bold text-xs hover:bg-accent-hover disabled:opacity-40 transition-colors flex items-center gap-2"
                >
                  {isProcessing ? "Processing..." : "Download Sanitized PDF"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
