"use client";

import { useState, useCallback, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import ToolLayout from "@/components/ToolLayout";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

type PageSizeOption = "fit" | "a4" | "letter";
type OrientationOption = "portrait" | "landscape" | "auto";

const PAGE_SIZES: Record<"a4" | "letter", { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function ImageToPdfClient() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>("fit");
  const [orientation, setOrientation] = useState<OrientationOption>("auto");
  const [margin, setMargin] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const validFiles = Array.from(files).filter((f) =>
      ["image/png", "image/jpeg", "image/webp"].includes(f.type)
    );

    if (validFiles.length === 0) {
      setError("Please drop valid PNG, JPEG, or WebP images.");
      return;
    }

    validFiles.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2),
            file,
            previewUrl,
            width: img.naturalWidth,
            height: img.naturalHeight,
          },
        ]);
      };
      img.src = previewUrl;
    });

    setPdfUrl(null);
    setPdfSize(null);
  }, []);

  const moveItem = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
    setPdfUrl(null);
  };

  const removeItem = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setPdfUrl(null);
  };

  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of images) {
        let imageBytes: ArrayBuffer;
        let isPng = item.file.type === "image/png";

        if (item.file.type === "image/webp") {
          const canvas = document.createElement("canvas");
          canvas.width = item.width;
          canvas.height = item.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context unavailable");

          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = item.previewUrl;
          });

          ctx.drawImage(img, 0, 0);
          const pngBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );
          if (!pngBlob) throw new Error("WebP conversion failed");
          imageBytes = await pngBlob.arrayBuffer();
          isPng = true;
        } else {
          imageBytes = await item.file.arrayBuffer();
        }

        const embeddedImage = isPng
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        let pWidth: number;
        let pHeight: number;

        if (pageSize === "fit") {
          pWidth = embeddedImage.width + margin * 2;
          pHeight = embeddedImage.height + margin * 2;
        } else {
          const dims = PAGE_SIZES[pageSize];
          let isLandscape = false;
          if (orientation === "landscape") isLandscape = true;
          else if (orientation === "portrait") isLandscape = false;
          else isLandscape = embeddedImage.width > embeddedImage.height;

          pWidth = isLandscape ? dims.height : dims.width;
          pHeight = isLandscape ? dims.width : dims.height;
        }

        const page = pdfDoc.addPage([pWidth, pHeight]);
        const availW = pWidth - margin * 2;
        const availH = pHeight - margin * 2;

        let drawW = embeddedImage.width;
        let drawH = embeddedImage.height;

        if (pageSize !== "fit" || margin > 0) {
          const scale = Math.min(availW / drawW, availH / drawH, 1);
          drawW *= scale;
          drawH *= scale;
        }

        const drawX = margin + (availW - drawW) / 2;
        const drawY = margin + (availH - drawH) / 2;

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfSize(blob.size);
    } catch (err) {
      setError(`PDF Generation failed: ${(err as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalBytes = images.reduce((acc, img) => acc + img.file.size, 0);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Images:</span>
        <span className="text-accent font-bold">{images.length} images</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Source Size:</span>
        <span className="text-text-primary">{formatBytes(totalBytes)}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Page Layout:</span>
        <span className="text-text-primary uppercase">{pageSize}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">PDF Output:</span>
        <span className="text-success font-bold">{pdfSize ? formatBytes(pdfSize) : "—"}</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="image-to-pdf" stats={stats}>
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
          <span className="text-2xl mb-2">📸</span>
          <span className="text-sm font-semibold text-text-primary">
            Drop images here or click to browse
          </span>
          <span className="text-xs text-text-muted mt-1">
            PNG, JPEG, WebP supported. Multiple images compile into one multi-page PDF.
          </span>
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
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

        {/* Page Options */}
        {images.length > 0 && (
          <div className="pt-2 border-t border-border-subtle space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-text-secondary block mb-1">Page Format</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value as PageSizeOption);
                    setPdfUrl(null);
                  }}
                  className="w-full rounded border border-border-subtle bg-bg-page p-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="fit">Fit to Image Size</option>
                  <option value="a4">A4 (ISO 216)</option>
                  <option value="letter">US Letter</option>
                </select>
              </div>

              <div>
                <label className="text-text-secondary block mb-1">Orientation</label>
                <select
                  value={orientation}
                  disabled={pageSize === "fit"}
                  onChange={(e) => {
                    setOrientation(e.target.value as OrientationOption);
                    setPdfUrl(null);
                  }}
                  className="w-full rounded border border-border-subtle bg-bg-page p-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none disabled:opacity-40"
                >
                  <option value="auto">Auto (Match Image)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div>
                <label className="text-text-secondary block mb-1">Margin ({margin}px)</label>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={5}
                  value={margin}
                  onChange={(e) => {
                    setMargin(Number(e.target.value));
                    setPdfUrl(null);
                  }}
                  className="w-full accent-accent cursor-pointer h-1.5 bg-border-subtle rounded-lg mt-2"
                />
              </div>
            </div>

            {/* Images Queue Grid */}
            <div className="space-y-2 pt-2 border-t border-border-subtle">
              <div className="h-8 flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">
                  Pages Sequence ({images.length} Images)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setImages([]);
                    setPdfUrl(null);
                  }}
                  className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
                >
                  [Clear All]
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg border border-border-subtle bg-bg-page flex flex-col items-center space-y-1.5 relative group"
                  >
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-bg-card/90 border border-border-subtle text-[10px] font-bold text-accent">
                      #{index + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="w-full h-24 object-contain rounded bg-white/5"
                    />
                    <span className="text-[10px] text-text-muted truncate w-full text-center">
                      {item.file.name}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveItem(index, -1)}
                        className="px-1.5 py-0.5 rounded border border-border-subtle text-[10px] text-text-secondary disabled:opacity-20"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={index === images.length - 1}
                        onClick={() => moveItem(index, 1)}
                        className="px-1.5 py-0.5 rounded border border-border-subtle text-[10px] text-text-secondary disabled:opacity-20"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="px-1.5 py-0.5 rounded border border-border-subtle text-[10px] text-error"
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
                  onClick={generatePdf}
                  disabled={isGenerating || images.length === 0}
                  className="w-full py-2.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40"
                >
                  {isGenerating ? "Compiling PDF..." : `Compile ${images.length} Images into PDF`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Download Link */}
        {pdfUrl && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-success">
                ✓ PDF Document Generated ({pdfSize ? formatBytes(pdfSize) : ""})
              </span>
              <a
                href={pdfUrl}
                download="images-compiled.pdf"
                className="px-4 py-1.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Download Compiled PDF
              </a>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
