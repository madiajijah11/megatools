"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export default function ImageToPdfClient() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"fit" | "a4">("fit");
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto");
  const [margin, setMargin] = useState<number>(0);
  const [converting, setConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const newItems: ImageItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setItems((prev) => [
          ...prev,
          {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            file,
            previewUrl: url,
            width: img.naturalWidth || 800,
            height: img.naturalHeight || 600,
          },
        ]);
      };
      img.src = url;
    });
    setDownloadUrl(null);
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [items, downloadUrl]);

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
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    setDownloadUrl(null);
  };

  const convertToPdf = async () => {
    if (items.length === 0) return;
    setConverting(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const item of items) {
        // Read file bytes
        let imgBytes = await item.file.arrayBuffer();
        const isJpg = item.file.type === "image/jpeg" || item.file.type === "image/jpg";
        const isPng = item.file.type === "image/png";

        let embeddedImage;

        if (isJpg) {
          embeddedImage = await pdfDoc.embedJpg(imgBytes);
        } else if (isPng) {
          embeddedImage = await pdfDoc.embedPng(imgBytes);
        } else {
          // WebP or other: draw to Canvas and export PNG
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = item.previewUrl;
          });

          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas context unavailable");
          ctx.drawImage(img, 0, 0);

          const pngBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/png")
          );
          if (!pngBlob) throw new Error("PNG conversion failed");
          imgBytes = await pngBlob.arrayBuffer();
          embeddedImage = await pdfDoc.embedPng(imgBytes);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth = imgWidth;
        let pageHeight = imgHeight;

        if (pageSize === "a4") {
          // A4 dimensions in points: 595.28 x 841.89
          const a4W = 595.28;
          const a4H = 841.89;

          if (orientation === "landscape" || (orientation === "auto" && imgWidth > imgHeight)) {
            pageWidth = a4H;
            pageHeight = a4W;
          } else {
            pageWidth = a4W;
            pageHeight = a4H;
          }
        } else {
          // Fit mode with orientation
          if (
            (orientation === "landscape" && imgHeight > imgWidth) ||
            (orientation === "portrait" && imgWidth > imgHeight)
          ) {
            pageWidth = imgHeight;
            pageHeight = imgWidth;
          }
        }

        const availableW = pageWidth - margin * 2;
        const availableH = pageHeight - margin * 2;

        const scale = Math.min(availableW / imgWidth, availableH / imgHeight, 1);
        const drawW = imgWidth * scale;
        const drawH = imgHeight * scale;
        const x = margin + (availableW - drawW) / 2;
        const y = margin + (availableH - drawH) / 2;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(embeddedImage, {
          x,
          y,
          width: drawW,
          height: drawH,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      setError(`PDF generation failed: ${(err as Error).message}`);
    } finally {
      setConverting(false);
    }
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Images</p>
        <p className="text-text-primary font-mono">{items.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Page Size</p>
        <p className="text-text-primary font-mono uppercase">{pageSize}</p>
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
              <span className="gradient-text">Image to PDF</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Convert PNG, JPG, or WebP images into a PDF document.
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
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <span className="font-mono text-sm text-text-secondary">
              $ drop images here -- or click to select
            </span>
            <span className="text-xs text-text-muted">PNG · JPG · WebP</span>
          </label>

          {error && <p className="mt-4 text-sm text-error text-center">{error}</p>}

          {/* Controls & Image List */}
          {items.length > 0 && (
            <div className="mt-6 space-y-6">
              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded border border-border-subtle bg-bg-page p-4 text-xs font-mono">
                <div>
                  <label className="text-text-muted block mb-1">PAGE SIZE</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(e.target.value as "fit" | "a4");
                      setDownloadUrl(null);
                    }}
                    className="input-field py-1 text-xs"
                  >
                    <option value="fit">Fit Image</option>
                    <option value="a4">Standard A4</option>
                  </select>
                </div>

                <div>
                  <label className="text-text-muted block mb-1">ORIENTATION</label>
                  <select
                    value={orientation}
                    onChange={(e) => {
                      setOrientation(e.target.value as "auto" | "portrait" | "landscape");
                      setDownloadUrl(null);
                    }}
                    className="input-field py-1 text-xs"
                  >
                    <option value="auto">Auto</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div>
                  <label className="text-text-muted block mb-1">MARGIN</label>
                  <select
                    value={margin}
                    onChange={(e) => {
                      setMargin(Number(e.target.value));
                      setDownloadUrl(null);
                    }}
                    className="input-field py-1 text-xs"
                  >
                    <option value={0}>None (0 pt)</option>
                    <option value={20}>Small (20 pt)</option>
                    <option value={40}>Medium (40 pt)</option>
                  </select>
                </div>
              </div>

              {/* Thumbnails grid */}
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Images ({items.length}) — Page Order
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="group relative rounded border border-border-subtle bg-bg-page p-2 flex flex-col items-center"
                    >
                      <div className="relative w-full aspect-square bg-bg-card rounded overflow-hidden flex items-center justify-center">
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="max-w-full max-h-full object-contain"
                        />
                        <span className="absolute top-1 left-1 bg-bg-page/80 border border-border-subtle px-1.5 py-0.5 text-[10px] font-mono text-accent rounded">
                          #{index + 1}
                        </span>
                      </div>

                      <p className="w-full truncate text-[11px] font-mono text-text-secondary mt-1.5 text-center">
                        {item.file.name}
                      </p>

                      <div className="mt-2 flex items-center gap-1 w-full justify-center">
                        <button
                          onClick={() => moveItem(index, -1)}
                          disabled={index === 0}
                          className="px-1.5 py-0.5 text-[10px] btn-secondary disabled:opacity-20"
                        >
                          ◀
                        </button>
                        <button
                          onClick={() => moveItem(index, 1)}
                          disabled={index === items.length - 1}
                          className="px-1.5 py-0.5 text-[10px] btn-secondary disabled:opacity-20"
                        >
                          ▶
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="px-1.5 py-0.5 text-[10px] text-error hover:bg-error/10 rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-subtle">
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
                  onClick={convertToPdf}
                  disabled={converting || items.length === 0}
                  className="btn-primary"
                >
                  {converting ? "Building PDF..." : `$ convert ${items.length} images to pdf`}
                </button>
              </div>

              {/* Download banner */}
              {downloadUrl && (
                <div className="rounded border border-accent/40 bg-accent-soft p-4 text-center">
                  <p className="text-sm font-semibold text-accent mb-2">
                    ✓ PDF Document Ready ({items.length} pages)
                  </p>
                  <a
                    href={downloadUrl}
                    download="images.pdf"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Download images.pdf
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="image-to-pdf" stats={stats} />
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
        <InfoPanel toolId="image-to-pdf" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
