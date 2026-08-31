"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

const COMMON_PRESETS = [
  { name: "4K UHD (16:9)", w: 3840, h: 2160 },
  { name: "1440p QHD (16:9)", w: 2560, h: 1440 },
  { name: "1080p FHD (16:9)", w: 1920, h: 1080 },
  { name: "720p HD (16:9)", w: 1280, h: 720 },
  { name: "Ultrawide (21:9)", w: 3440, h: 1440 },
  { name: "TikTok / Reels (9:16)", w: 1080, h: 1920 },
  { name: "Instagram Square (1:1)", w: 1080, h: 1080 },
  { name: "Instagram Portrait (4:5)", w: 1080, h: 1350 },
  { name: "Classic Monitor (4:3)", w: 1024, h: 768 },
];

export default function AspectRatioCalculatorClient() {
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);

  // Scaling tool
  const [newWidth, setNewWidth] = useState<number>(1280);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { ratioStr, decimalRatio, megapixels, totalPixels } = useMemo(() => {
    const w = Math.max(1, width || 1);
    const h = Math.max(1, height || 1);
    const divisor = gcd(w, h);
    const rW = w / divisor;
    const rH = h / divisor;
    const dec = (w / h).toFixed(4);
    const pixels = w * h;
    const mp = (pixels / 1_000_000).toFixed(2);

    return {
      ratioStr: `${rW}:${rH}`,
      decimalRatio: dec,
      megapixels: `${mp} MP`,
      totalPixels: pixels.toLocaleString(),
    };
  }, [width, height]);

  // Scaled height
  const scaledHeight = useMemo(() => {
    if (!width || !height || !newWidth) return 0;
    return Math.round((newWidth / width) * height);
  }, [width, height, newWidth]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Aspect Ratio</p>
        <p className="text-accent font-mono text-xs font-bold">{ratioStr}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Resolution</p>
        <p className="text-text-primary font-mono text-xs">{megapixels}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Aspect Ratio & Resolution Calculator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Calculate exact GCD aspect ratios, resize pixel dimensions proportionally, and inspect video resolutions.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="mb-6">
            <label className="text-xs font-mono text-text-secondary block mb-2 font-bold">
              Standard Resolution Presets:
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setWidth(preset.w);
                    setHeight(preset.h);
                  }}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    width === preset.w && height === preset.h
                      ? "bg-accent-soft border-accent text-accent font-bold"
                      : "bg-bg-page border-border-subtle text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Dimension Inputs & Stats */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-4">
                <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider block">
                  Original Dimensions (W × H)
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Width (px):</label>
                    <input
                      type="number"
                      min={1}
                      value={width}
                      onChange={(e) => setWidth(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Height (px):</label>
                    <input
                      type="number"
                      min={1}
                      value={height}
                      onChange={(e) => setHeight(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                {/* Calculation Cards */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle">
                    <span className="text-[10px] font-mono text-text-muted uppercase block">Simplified Ratio</span>
                    <span className="font-mono text-xl font-bold text-accent">{ratioStr}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle">
                    <span className="text-[10px] font-mono text-text-muted uppercase block">Decimal Factor</span>
                    <span className="font-mono text-xl font-bold text-text-primary">{decimalRatio}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle">
                    <span className="text-[10px] font-mono text-text-muted uppercase block">Total Megapixels</span>
                    <span className="font-mono text-sm font-bold text-text-primary">{megapixels}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-card border border-border-subtle">
                    <span className="text-[10px] font-mono text-text-muted uppercase block">Total Pixels</span>
                    <span className="font-mono text-sm font-bold text-text-secondary">{totalPixels} px</span>
                  </div>
                </div>
              </div>

              {/* Scaling Tool */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-3">
                <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider block">
                  Proportional Resizing Calculator
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Target Width (px):</label>
                    <input
                      type="number"
                      min={1}
                      value={newWidth}
                      onChange={(e) => setNewWidth(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Calculated Height (px):</label>
                    <div className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-sm text-accent font-bold">
                      {scaledHeight} px
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Visual Proportional Frame */}
            <div className="flex flex-col space-y-4">
              <div className="p-6 rounded-xl bg-bg-page border border-border-subtle flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
                <span className="text-xs font-mono text-text-muted absolute top-3 left-4">
                  Visual Frame Proportion ({width} × {height})
                </span>

                {/* Aspect Frame */}
                <div
                  style={{
                    aspectRatio: `${width} / ${height}`,
                    maxWidth: "85%",
                    maxHeight: "220px",
                  }}
                  className="w-full rounded-xl bg-gradient-to-tr from-accent/20 via-emerald-500/10 to-accent/5 border-2 border-dashed border-accent flex flex-col items-center justify-center p-4 transition-all duration-300 shadow-lg"
                >
                  <span className="font-mono text-lg font-bold text-accent">{ratioStr}</span>
                  <span className="font-mono text-xs text-text-muted mt-1">
                    {width} × {height}
                  </span>
                </div>
              </div>

              {/* CSS Aspect Ratio Property */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                    CSS Declaration:
                  </span>
                  <CopyButton text={`aspect-ratio: ${ratioStr.replace(":", " / ")};`} />
                </div>
                <div className="p-2.5 bg-bg-card border border-border-subtle rounded font-mono text-xs text-accent select-all">
                  aspect-ratio: {ratioStr.replace(":", " / ")};
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="aspect-ratio-calculator" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="aspect-ratio-calculator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
