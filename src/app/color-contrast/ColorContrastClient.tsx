"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

function rgbToHsl(rgb: RGB): string {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
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

// WCAG 2.1 Relative Luminance
function getLuminance(rgb: RGB): number {
  const a = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(fg: RGB, bg: RGB): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export default function ColorContrastClient() {
  const [fgHex, setFgHex] = useState("#4ade80");
  const [bgHex, setBgHex] = useState("#0a0f0d");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fgRgb = useMemo(() => hexToRgb(fgHex) || { r: 74, g: 222, b: 128 }, [fgHex]);
  const bgRgb = useMemo(() => hexToRgb(bgHex) || { r: 10, g: 15, b: 13 }, [bgHex]);

  const ratio = useMemo(() => {
    return getContrastRatio(fgRgb, bgRgb);
  }, [fgRgb, bgRgb]);

  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;
  const aaaLarge = ratio >= 4.5;
  const uiComponent = ratio >= 3.0;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Contrast Ratio</p>
        <p className="text-accent font-mono font-bold">{ratio.toFixed(2)} : 1</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">WCAG Level</p>
        <p className={`font-mono font-bold ${aaaNormal ? "text-success" : aaNormal ? "text-accent" : "text-error"}`}>
          {aaaNormal ? "AAA PASS" : aaNormal ? "AA PASS" : "FAIL"}
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
              <span className="gradient-text">Color Contrast &amp; Palette</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Calculate WCAG 2.1 accessibility contrast ratios and convert color spaces.
            </p>
          </div>

          {/* Color Pickers & Presets */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Foreground */}
            <div className="rounded border border-border-subtle bg-bg-page p-4 space-y-3 font-mono text-xs">
              <label className="text-text-muted uppercase font-semibold block">
                Foreground (Text Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={fgHex.startsWith("#") && fgHex.length === 7 ? fgHex : "#4ade80"}
                  onChange={(e) => setFgHex(e.target.value)}
                  className="w-10 h-10 rounded border border-border-subtle bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={fgHex}
                  onChange={(e) => setFgHex(e.target.value)}
                  className="input-field text-sm"
                  placeholder="#4ade80"
                />
              </div>
              <p className="text-text-muted text-[11px]">
                RGB: rgb({fgRgb.r}, {fgRgb.g}, {fgRgb.b}) · {rgbToHsl(fgRgb)}
              </p>
            </div>

            {/* Background */}
            <div className="rounded border border-border-subtle bg-bg-page p-4 space-y-3 font-mono text-xs">
              <label className="text-text-muted uppercase font-semibold block">
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgHex.startsWith("#") && bgHex.length === 7 ? bgHex : "#0a0f0d"}
                  onChange={(e) => setBgHex(e.target.value)}
                  className="w-10 h-10 rounded border border-border-subtle bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={bgHex}
                  onChange={(e) => setBgHex(e.target.value)}
                  className="input-field text-sm"
                  placeholder="#0a0f0d"
                />
              </div>
              <p className="text-text-muted text-[11px]">
                RGB: rgb({bgRgb.r}, {bgRgb.g}, {bgRgb.b}) · {rgbToHsl(bgRgb)}
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mb-6 flex flex-wrap gap-2 text-xs font-mono">
            <span className="text-text-muted py-1">Presets:</span>
            {[
              { label: "Terminal Hacker", fg: "#4ade80", bg: "#0a0f0d" },
              { label: "High Contrast (B&W)", fg: "#ffffff", bg: "#000000" },
              { label: "Cyber Amber", fg: "#fbbf24", bg: "#0f1512" },
              { label: "Light Clean", fg: "#0f172a", bg: "#f8fafc" },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setFgHex(p.fg);
                  setBgHex(p.bg);
                }}
                className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-text-secondary hover:border-accent"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Contrast Score Banner */}
          <div className="mb-6 rounded border border-border-subtle bg-bg-page p-4 text-center">
            <p className="text-xs font-mono text-text-muted uppercase tracking-wider mb-1">
              Contrast Ratio
            </p>
            <p className="text-4xl font-bold font-mono text-accent">
              {ratio.toFixed(2)} <span className="text-lg text-text-muted">: 1</span>
            </p>
          </div>

          {/* WCAG Compliance Badges Grid */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="rounded border border-border-subtle bg-bg-page p-3 text-center space-y-1">
              <span className="text-text-muted text-[11px] block">AA Normal Text (≥4.5:1)</span>
              <span
                className={`font-bold px-2 py-0.5 rounded border inline-block ${
                  aaNormal
                    ? "border-success/40 bg-success/15 text-success"
                    : "border-error/40 bg-error/15 text-error"
                }`}
              >
                {aaNormal ? "✓ PASS" : "✕ FAIL"}
              </span>
            </div>

            <div className="rounded border border-border-subtle bg-bg-page p-3 text-center space-y-1">
              <span className="text-text-muted text-[11px] block">AA Large Text (≥3.0:1)</span>
              <span
                className={`font-bold px-2 py-0.5 rounded border inline-block ${
                  aaLarge
                    ? "border-success/40 bg-success/15 text-success"
                    : "border-error/40 bg-error/15 text-error"
                }`}
              >
                {aaLarge ? "✓ PASS" : "✕ FAIL"}
              </span>
            </div>

            <div className="rounded border border-border-subtle bg-bg-page p-3 text-center space-y-1">
              <span className="text-text-muted text-[11px] block">AAA Normal Text (≥7.0:1)</span>
              <span
                className={`font-bold px-2 py-0.5 rounded border inline-block ${
                  aaaNormal
                    ? "border-success/40 bg-success/15 text-success"
                    : "border-error/40 bg-error/15 text-error"
                }`}
              >
                {aaaNormal ? "✓ PASS" : "✕ FAIL"}
              </span>
            </div>

            <div className="rounded border border-border-subtle bg-bg-page p-3 text-center space-y-1">
              <span className="text-text-muted text-[11px] block">AAA Large Text (≥4.5:1)</span>
              <span
                className={`font-bold px-2 py-0.5 rounded border inline-block ${
                  aaaLarge
                    ? "border-success/40 bg-success/15 text-success"
                    : "border-error/40 bg-error/15 text-error"
                }`}
              >
                {aaaLarge ? "✓ PASS" : "✕ FAIL"}
              </span>
            </div>

            <div className="rounded border border-border-subtle bg-bg-page p-3 text-center space-y-1 sm:col-span-2">
              <span className="text-text-muted text-[11px] block">UI Components &amp; Icons (≥3.0:1)</span>
              <span
                className={`font-bold px-2 py-0.5 rounded border inline-block ${
                  uiComponent
                    ? "border-success/40 bg-success/15 text-success"
                    : "border-error/40 bg-error/15 text-error"
                }`}
              >
                {uiComponent ? "✓ PASS" : "✕ FAIL"}
              </span>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="rounded border border-border-subtle p-6 space-y-4" style={{ backgroundColor: bgHex }}>
            <div style={{ color: fgHex }}>
              <p className="text-xs font-mono opacity-70 mb-1">Live Text Preview (Custom Colors)</p>
              <h2 className="text-2xl font-bold mb-2">
                Large Heading Text (18pt / 24px Bold)
              </h2>
              <p className="text-sm leading-relaxed mb-3">
                This is a regular body paragraph rendered with your selected foreground and background colors.
                Accessible color contrast ensures maximum readability in direct sunlight and for visually impaired users.
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-4 py-1.5 text-xs font-mono font-bold rounded border"
                  style={{ borderColor: fgHex, color: fgHex }}
                >
                  Button Outline
                </button>
                <CopyButton text={`Foreground: ${fgHex} | Background: ${bgHex} | Ratio: ${ratio.toFixed(2)}:1`} label="copy palette" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="color-contrast" stats={stats} />
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
        <InfoPanel toolId="color-contrast" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
