"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useRef, useEffect, useCallback } from "react";
import CopyButton from "@/components/CopyButton";

interface ColorSwatch {
  hex: string;
  rgb: string;
  hsl: string;
  count: number;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function extractPalette(canvas: HTMLCanvasElement, numColors = 6): ColorSwatch[] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  const { width, height } = canvas;
  const imgData = ctx.getImageData(0, 0, width, height).data;

  // Quantize colors by grouping in buckets of step 16
  const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};

  for (let i = 0; i < imgData.length; i += 16) {
    // sample every 4th pixel for speed
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];

    if (a < 128) continue; // Ignore transparent pixels

    const qr = Math.round(r / 24) * 24;
    const qg = Math.round(g / 24) * 24;
    const qb = Math.round(b / 24) * 24;
    const key = `${qr},${qg},${qb}`;

    if (!buckets[key]) {
      buckets[key] = { r: qr, g: qg, b: qb, count: 0 };
    }
    buckets[key].count++;
  }

  const sorted = Object.values(buckets).sort((a, b) => b.count - a.count);

  return sorted.slice(0, numColors).map((c) => ({
    hex: rgbToHex(c.r, c.g, c.b),
    rgb: `rgb(${c.r}, ${c.g}, ${c.b})`,
    hsl: rgbToHsl(c.r, c.g, c.b),
    count: c.count,
  }));
}

export default function ColorExtractorClient() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [palette, setPalette] = useState<ColorSwatch[]>([]);
  const [paletteCount, setPaletteCount] = useState(6);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate demo gradient image on initial mount
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 400, 300);
      grad.addColorStop(0, "#4ade80");
      grad.addColorStop(0.3, "#06b6d4");
      grad.addColorStop(0.7, "#3b82f6");
      grad.addColorStop(1, "#101713");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 300);
      setImageSrc(canvas.toDataURL("image/png"));
    }
  }, []);

  const processImage = useCallback(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Scale down image to max 200px for instant analysis
      const scale = Math.min(1, 200 / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const swatches = extractPalette(canvas, paletteCount);
      setPalette(swatches);
    };
    img.src = imageSrc;
  }, [imageSrc, paletteCount]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setImageSrc(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const cssVariablesCode = `:root {\n${palette
    .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
    .join("\n")}\n}`;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Colors Extracted</p>
        <p className="text-accent font-mono font-bold">{palette.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Dominant Color</p>
        <p className="text-text-primary font-mono text-xs">{palette[0]?.hex || "—"}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="color-extractor" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Upload Area */}
          <div className="mb-6 p-6 rounded-xl border border-dashed border-border-subtle bg-bg-page text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              id="file-input"
              className="hidden"
            />
            <label
              htmlFor="file-input"
              className="cursor-pointer inline-flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-accent-soft text-accent flex items-center justify-center text-xl font-mono font-bold">
                +
              </div>
              <p className="text-sm font-semibold text-text-primary">
                Click to upload image or drop file here
              </p>
              <p className="text-xs text-text-muted">Supports PNG, JPG, WebP, GIF, SVG</p>
            </label>
          </div>

          {/* Image & Extracted Swatches Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 mb-6">
            {/* Image Preview */}
            <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-bg-page border border-border-subtle">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc}
                  alt="Source"
                  className="max-h-[180px] w-auto rounded object-contain"
                />
              ) : (
                <p className="text-xs font-mono text-text-muted">No Image</p>
              )}
            </div>

            {/* Color Swatches */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Extracted Swatches ({palette.length}):
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-text-muted">Count:</span>
                  {[4, 6, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPaletteCount(n)}
                      className={`px-2 py-0.5 text-xs font-mono rounded border ${
                        paletteCount === n
                          ? "bg-accent-soft text-accent border-accent font-bold"
                          : "bg-bg-page border-border-subtle text-text-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {palette.map((swatch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-lg bg-bg-page border border-border-subtle"
                  >
                    <div
                      className="w-10 h-10 rounded-md border border-border-subtle shadow-inner shrink-0"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="flex-1 min-w-0 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text-primary">{swatch.hex}</span>
                        <CopyButton text={swatch.hex} />
                      </div>
                      <p className="text-[10px] text-text-secondary truncate">{swatch.rgb}</p>
                      <p className="text-[10px] text-text-muted truncate">{swatch.hsl}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CSS Variables Export */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                CSS Variables Export:
              </label>
              <CopyButton text={cssVariablesCode} />
            </div>
            <div className="p-3 bg-bg-page border border-border-subtle rounded-lg font-mono text-xs text-accent">
              <pre className="whitespace-pre">{cssVariablesCode}</pre>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}