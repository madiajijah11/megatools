"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useRef, useMemo, useEffect } from "react";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

const PRESET_TEXTS = ["CONFIDENTIAL", "DRAFT", "DO NOT COPY", "INTERNAL USE", "SAMPLE"];

const PRESET_COLORS = [
  { name: "Crimson", hex: "#ef4444", r: 0.93, g: 0.27, b: 0.27 },
  { name: "Terminal Green", hex: "#4ade80", r: 0.29, g: 0.87, b: 0.50 },
  { name: "Slate Gray", hex: "#64748b", r: 0.39, g: 0.45, b: 0.54 },
  { name: "Deep Blue", hex: "#3b82f6", r: 0.23, g: 0.51, b: 0.96 },
  { name: "Carbon Black", hex: "#000000", r: 0, g: 0, b: 0 },
];
export default function PdfWatermarkClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  const [text, setText] = useState<string>("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState<number>(54);
  const [opacity, setOpacity] = useState<number>(25); // 0-100%
  const [rotation, setRotation] = useState<number>(45); // degrees
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadPdf = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a valid PDF file.");
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const doc = await PDFDocument.load(bytes);
      setFile(selectedFile);
      setPdfBytes(bytes);
      setPageCount(doc.getPageCount());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load PDF file.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) loadPdf(f);
  };

  // Live Canvas Preview of Watermark
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Simulated Paper Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    // Simulated Document Dummy Lines
    ctx.fillStyle = "#e2e8f0";
    for (let y = 30; y < h - 30; y += 14) {
      const lineLen = y % 28 === 0 ? w - 80 : w - 50;
      ctx.fillRect(25, y, lineLen, 6);
    }

    // Watermark Overlay
    if (text.trim()) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.globalAlpha = opacity / 100;
      ctx.fillStyle = selectedColor.hex;
      ctx.font = "bold " + Math.round(fontSize * 0.5) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }, [text, fontSize, opacity, rotation, selectedColor]);

  // Stamp and compile PDF
  const applyWatermarkAndDownload = async () => {
    if (!pdfBytes || !text.trim()) return;
    setProcessing(true);
    setError(null);

    try {
      const doc = await PDFDocument.load(pdfBytes);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      for (const page of pages) {
        const { width, height } = page.getSize();
        const rad = (rotation * Math.PI) / 180;

        // Calculate center position accounting for rotation
        const centerX = width / 2;
        const centerY = height / 2;

        const x = centerX - (Math.cos(rad) * (textWidth / 2) - Math.sin(rad) * (textHeight / 2));
        const y = centerY - (Math.sin(rad) * (textWidth / 2) + Math.cos(rad) * (textHeight / 2));

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(selectedColor.r, selectedColor.g, selectedColor.b),
          opacity: opacity / 100,
          rotate: degrees(rotation),
        });
      }

      const outBytes = await doc.save();
      const blob = new Blob([outBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (file?.name.replace(/\.pdf$/i, "") || "document") + "-watermarked.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to stamp watermark onto PDF.");
    } finally {
      setProcessing(false);
    }
  };

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Target Document:</span>
        <span className="text-text-primary font-bold truncate max-w-[120px]">
          {file ? file.name : "None loaded"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Pages to Stamp:</span>
        <span className="text-accent font-bold">{pageCount}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Overlay Vector:</span>
        <span className="text-success font-bold">{rotation}° / {opacity}% Opacity</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Processing:</span>
        <span className="text-accent font-bold">100% Client-Side</span>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="pdf-watermark" stats={stats}>
      <div className="space-y-4 font-mono">
        {/* File Upload Bar */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-3">
            <div className="h-8 flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> PDF_SOURCE_FILE
              </span>
              {file && (
                <button
                  onClick={() => {
                    setFile(null);
                    setPdfBytes(null);
                    setPageCount(0);
                  }}
                  className="px-2 py-1 rounded border border-border-subtle text-text-muted hover:text-error hover:border-error/40 transition-colors"
                >
                  Remove File
                </button>
              )}
            </div>

            {!pdfBytes ? (
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
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) loadPdf(f);
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-bg-card border border-border-subtle flex items-center justify-center text-xl mx-auto mb-2">
                  🏷️
                </div>
                <p className="font-bold text-text-primary">
                  Drop PDF here or click to browse
                </p>
                <p className="text-[11px] text-text-muted mt-0.5">
                  100% private — processed locally in browser RAM
                </p>
              </div>
            ) : (
              <div className="p-3 rounded bg-bg-page border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="font-bold text-text-primary block">{file?.name}</span>
                  <span className="text-[11px] text-text-muted">
                    {pageCount} pages · {(file!.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <span className="text-success font-bold text-[11px]">Ready to Stamp</span>
              </div>
            )}
          </div>

          {/* Watermark Configuration & Preview Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Box: Controls */}
            <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-8 flex items-center justify-between">
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    <span className="text-accent">&gt;</span> STAMP_ATTRIBUTES
                  </span>
                </div>

                {/* Text & Presets */}
                <div className="space-y-2">
                  <label className="text-text-secondary block">Watermark Text:</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="CONFIDENTIAL, DRAFT..."
                    className="w-full bg-bg-page border border-border-subtle rounded px-3 py-1.5 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1 pt-1">
                    {PRESET_TEXTS.map((pt) => (
                      <button
                        key={pt}
                        onClick={() => setText(pt)}
                        className="px-2 py-0.5 rounded border border-border-subtle bg-bg-page text-[10px] text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
                      >
                        [{pt}]
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rotation Angle */}
                <div className="space-y-1 p-2.5 rounded bg-bg-page border border-border-subtle">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Rotation Angle:</span>
                    <span className="text-accent font-bold">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-muted">
                    <span>-90°</span>
                    <span>0° (Horizontal)</span>
                    <span>45° (Diagonal)</span>
                    <span>90°</span>
                  </div>
                </div>

                {/* Font Size & Opacity */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 p-2.5 rounded bg-bg-page border border-border-subtle">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Font Size:</span>
                      <span className="text-text-primary font-bold">{fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="16"
                      max="100"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1 p-2.5 rounded bg-bg-page border border-border-subtle">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Opacity:</span>
                      <span className="text-warning font-bold">{opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(parseInt(e.target.value, 10))}
                      className="w-full accent-warning cursor-pointer"
                    />
                  </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-1.5">
                  <span className="text-text-muted text-[11px] block">Overlay Color:</span>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setSelectedColor(c)}
                        className={"px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors " + (
                          selectedColor.name === c.name
                            ? "border-accent bg-accent-soft text-text-primary font-bold"
                            : "border-border-subtle bg-bg-page text-text-secondary hover:border-accent/40"
                        )}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-border-subtle">
                <button
                  onClick={applyWatermarkAndDownload}
                  disabled={processing || !pdfBytes || !text.trim()}
                  className="w-full py-2 rounded bg-accent text-bg-page font-bold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 text-xs"
                >
                  {processing ? "Stamping Document..." : "Stamp & Download PDF (" + pageCount + " Pages)"}
                </button>
                {error && <p className="text-error text-[11px] mt-2">{error}</p>}
              </div>
            </div>

            {/* Right Box: Live Visual Page Preview */}
            <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-3 flex flex-col">
              <div className="h-8 flex items-center justify-between">
                <span className="font-semibold text-text-primary flex items-center gap-1.5">
                  <span className="text-accent">&gt;</span> REALTIME_PAGE_PREVIEW
                </span>
                <span className="text-text-muted text-[11px]">Simulated A4</span>
              </div>

              <div className="flex-1 rounded bg-bg-page border border-border-subtle flex items-center justify-center p-3 overflow-hidden">
                <canvas
                  ref={previewCanvasRef}
                  width={240}
                  height={320}
                  className="border border-border-subtle rounded shadow-lg block max-w-full"
                />
              </div>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}