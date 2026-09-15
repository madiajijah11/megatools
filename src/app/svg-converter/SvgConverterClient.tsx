"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useRef, useEffect, useCallback } from "react";

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ade80" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" rx="40" fill="#101713" />
  <circle cx="200" cy="200" r="120" fill="url(#grad)" opacity="0.2" />
  <polygon points="200,90 290,260 110,260" fill="none" stroke="#4ade80" stroke-width="12" stroke-linejoin="round" />
  <circle cx="200" cy="200" r="30" fill="#4ade80" />
  <text x="200" y="340" font-family="monospace" font-size="22" font-weight="bold" fill="#d6e8dc" text-anchor="middle">MEGATOOLS 2026</text>
</svg>`;

export default function SvgConverterClient() {
  const [svgInput, setSvgInput] = useState(SAMPLE_SVG);
  const [scale, setScale] = useState<number>(2);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) setSvgInput(content);
    };
    reader.readAsText(file);
  };

  const renderSvg = useCallback(() => {
    setError(null);
    if (!svgInput.trim()) {
      setPreviewUrl(null);
      return;
    }

    try {
      // Parse SVG dimensions
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgInput, "image/svg+xml");
      const parserError = doc.querySelector("parsererror");
      if (parserError) {
        throw new Error(parserError.textContent || "Invalid SVG XML markup");
      }

      const svgEl = doc.documentElement;
      let width = parseFloat(svgEl.getAttribute("width") || "0");
      let height = parseFloat(svgEl.getAttribute("height") || "0");

      if (!width || !height) {
        const viewBox = svgEl.getAttribute("viewBox");
        if (viewBox) {
          const parts = viewBox.split(/[\s,]+/).map(Number);
          if (parts.length === 4) {
            width = parts[2];
            height = parts[3];
          }
        }
      }

      if (!width) width = 400;
      if (!height) height = 400;

      setDimensions({ width, height });

      const blob = new Blob([svgInput], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetWidth = width * scale;
        const targetHeight = height * scale;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (format === "jpeg") {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(url);

        const mime = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
        const dataUrl = canvas.toDataURL(mime, 0.95);
        setPreviewUrl(dataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError("Failed to render SVG image");
      };

      img.src = url;
    } catch (err) {
      setError((err as Error).message);
      setPreviewUrl(null);
    }
  }, [svgInput, scale, format, bgColor]);

  useEffect(() => {
    const t = setTimeout(renderSvg, 150);
    return () => clearTimeout(t);
  }, [renderSvg]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `rendered-vector-${scale}x.${format}`;
    a.click();
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Output Resolution</p>
        <p className="text-accent font-mono font-bold text-xs">
          {dimensions.width * scale} × {dimensions.height * scale} px
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Format / Scale</p>
        <p className="text-text-primary font-mono text-xs uppercase">
          {format} ({scale}x)
        </p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="svg-converter" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-bg-page rounded-lg border border-border-subtle">
            {/* Resolution Scale */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono text-text-muted mr-1">Scale:</span>
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScale(s)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    scale === s
                      ? "bg-accent-soft text-accent border-accent font-bold"
                      : "bg-bg-card border-border-subtle text-text-muted hover:text-text-primary"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-border-subtle">
              {(["png", "jpeg", "webp"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors uppercase ${
                    format === f
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {format === "jpeg" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-text-muted">Bg Color:</span>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-6 h-6 rounded border border-border-subtle bg-transparent cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Editor & Preview Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* SVG Code Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  SVG Markup:
                </label>
                <label className="text-xs font-mono text-text-muted hover:text-accent cursor-pointer">
                  [Upload .svg]
                  <input type="file" accept=".svg,image/svg+xml" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <textarea
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                placeholder="Paste <svg>...</svg> markup here..."
                rows={14}
                className="w-full rounded-lg bg-bg-page border border-border-subtle p-3 font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-y"
                spellCheck={false}
              />
              {error && <p className="mt-1 text-xs font-mono text-error">{error}</p>}
            </div>

            {/* Live Rendered Canvas Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Rasterized Preview ({scale}x):
                </label>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1 bg-accent text-bg-page font-mono text-xs font-bold rounded hover:bg-accent-hover transition-colors"
                  >
                    Download {format.toUpperCase()}
                  </button>
                )}
              </div>
              <div className="relative rounded-lg bg-bg-page border border-border-subtle p-4 flex items-center justify-center min-h-[290px] overflow-hidden bg-[radial-gradient(#1f2b24_1px,transparent_1px)] [background-size:16px_16px]">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Rendered SVG preview"
                    className="max-h-[260px] max-w-full object-contain rounded shadow-md"
                  />
                ) : (
                  <p className="text-xs font-mono text-text-muted">No SVG loaded</p>
                )}
              </div>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}