"use client";

import { useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Color = { r: number; g: number; b: number; a: number };

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const fmt = (n: number, digits = 2) => Number(n.toFixed(digits));

function parseHex(value: string): Color | null {
  const raw = value.trim().replace(/^#/, "");
  if (![3, 4, 6, 8].includes(raw.length) || !/^[\da-f]+$/i.test(raw)) return null;
  const expanded = raw.length < 5 ? raw.split("").map((x) => x + x).join("") : raw;
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
    a: expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1,
  };
}
function parseColor(value: string): Color | null {
  const hexColor = parseHex(value); if (hexColor) return hexColor;
  const m = value.trim().match(/^(rgba?|hsla?)\(\s*([^)]*)\)$/i); if (!m) return null;
  const parts = m[2].replace(/\s*\/\s*/g, ",").split(/\s*,\s*/);
  const alpha = parts[3] === undefined ? 1 : Number(parts[3].replace("%", "")) / (parts[3].includes("%") ? 100 : 1);
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null;
  if (m[1].toLowerCase().startsWith("rgb")) {
    const vals = parts.slice(0, 3).map((v) => v.endsWith("%") ? Number(v.slice(0, -1)) * 2.55 : Number(v));
    return vals.length === 3 && vals.every((v) => Number.isFinite(v) && v >= 0 && v <= 255) ? { r: vals[0], g: vals[1], b: vals[2], a: alpha } : null;
  }
  const h = Number(parts[0]), sat = Number(parts[1]?.replace("%", "")) / 100, light = Number(parts[2]?.replace("%", "")) / 100;
  if (![h, sat, light].every(Number.isFinite) || sat < 0 || sat > 1 || light < 0 || light > 1) return null;
  const chroma = (1 - Math.abs(2 * light - 1)) * sat, x = chroma * (1 - Math.abs((h / 60) % 2 - 1)), add = light - chroma / 2;
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return { r: (r + add) * 255, g: (g + add) * 255, b: (b + add) * 255, a: alpha };
}
function hex(c: Color): string {
  const out = [c.r, c.g, c.b].map((x) => Math.round(clamp(x / 255) * 255).toString(16).padStart(2, "0")).join("");
  return `#${out}${c.a < 1 ? Math.round(c.a * 255).toString(16).padStart(2, "0") : ""}`;
}
function rgba(c: Color) { return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${fmt(c.a, 3)})`; }
function rgb(c: Color) { return `rgb(${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)}${c.a < 1 ? ` / ${fmt(c.a, 3)}` : ""})`; }
function hsl(c: Color) {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255, hi = Math.max(r, g, b), lo = Math.min(r, g, b), d = hi - lo;
  let h = 0; const l = (hi + lo) / 2; const s = !d ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) h = hi === r ? ((g - b) / d) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return `hsl(${Math.round((h * 60 + 360) % 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%${c.a < 1 ? ` / ${fmt(c.a, 3)}` : ""})`;
}
function linear(n: number) { return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4; }
function gamma(n: number) { return n <= 0.0031308 ? n * 12.92 : 1.055 * n ** (1 / 2.4) - 0.055; }
function labAndOklch(c: Color) {
  const r = linear(c.r / 255), g = linear(c.g / 255), b = linear(c.b / 255);
  const X = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const Y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1;
  const Z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
  const f = (n: number) => n > 0.008856 ? n ** (1 / 3) : 7.787 * n + 16 / 116;
  const fx = f(X), fy = f(Y), fz = f(Z);
  const lab = { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l3 = Math.cbrt(l), m3 = Math.cbrt(m), s3 = Math.cbrt(s);
  const L = 0.2104542553 * l3 + 0.793617785 * m3 - 0.0040720468 * s3;
  const A = 1.9779984951 * l3 - 2.428592205 * m3 + 0.4505937099 * s3;
  const B = 0.0259040371 * l3 + 0.7827717662 * m3 - 0.808675766 * s3;
  return { lab, oklch: { l: L, c: Math.sqrt(A * A + B * B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 } };
}
function luminance(c: Color) { return 0.2126 * linear(c.r / 255) + 0.7152 * linear(c.g / 255) + 0.0722 * linear(c.b / 255); }
function contrast(a: Color, b: Color) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function mix(a: Color, b: Color, amount: number): Color { return { r: a.r + (b.r - a.r) * amount, g: a.g + (b.g - a.g) * amount, b: a.b + (b.b - a.b) * amount, a: a.a + (b.a - a.a) * amount }; }
const white: Color = { r: 255, g: 255, b: 255, a: 1 }, black: Color = { r: 0, g: 0, b: 0, a: 1 };

function Card({ title, value }: { title: string; value: string }) {
  return <div className="rounded-xl border border-border-subtle bg-bg-card p-3"><div className="flex h-8 items-center justify-between"><span className="text-xs text-text-muted">{title}</span><CopyButton text={value} /></div><code className="break-all text-sm text-text-primary">{value}</code></div>;
}

export default function ColorConverterProClient() {
  const [input, setInput] = useState("#4ade80");
  const color = useMemo(() => parseColor(input), [input]);
  const data = useMemo(() => {
    if (!color) return null;
    const spaces = labAndOklch(color), whiteRatio = contrast(color, white), blackRatio = contrast(color, black);
    const foreground = whiteRatio >= blackRatio ? white : black;
    const palette = [0.8, 0.6, 0.4, 0.2].map((x) => mix(color, white, x)).concat([0.15, 0.3, 0.45, 0.6].map((x) => mix(color, black, x)));
    const vars = `:root {\n  --color-base: ${hex(color)};\n  --color-rgb: ${Math.round(color.r)} ${Math.round(color.g)} ${Math.round(color.b)};\n  --color-foreground: ${hex(foreground)};\n}`;
    return { spaces, whiteRatio, blackRatio, foreground, palette, vars };
  }, [color]);
  const setValue = (value: string) => setInput(value);
  const stats = <div className="space-y-1 text-xs font-mono"><div className="flex justify-between"><span className="text-text-muted">Formats</span><b className="text-accent">HEX · RGB · HSL · LAB</b></div><div className="flex justify-between"><span className="text-text-muted">Status</span><b className={color ? "text-success" : "text-error"}>{color ? "VALID" : "INVALID"}</b></div></div>;
  return <ToolLayout toolId="color-converter-pro" stats={stats}><div className="space-y-4 font-mono">
    <section className="rounded-xl border border-border-subtle bg-bg-card p-4"><div className="flex flex-wrap items-center gap-3"><input type="color" aria-label="Pick a color" value={color ? hex({ ...color, a: 1 }) : "#000000"} onChange={(e) => setValue(e.target.value)} className="h-10 w-16 bg-transparent"/><input aria-label="HEX color" value={input} onChange={(e) => setValue(e.target.value)} onBlur={() => color && setValue(hex(color))} className="min-w-0 flex-1 rounded border border-border-subtle bg-bg-page p-2 text-sm text-text-primary" placeholder="#RRGGBB or #RGBA"/><span className="text-xs text-text-muted">3/4/6/8 digit HEX</span></div>{!color && input && <p className="mt-2 text-xs text-error">Enter a valid HEX value: #RGB, #RGBA, #RRGGBB, or #RRGGBBAA.</p>}</section>
    {data && color && <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Card title="HEX" value={hex(color)} /><Card title="RGB" value={rgb(color)} /><Card title="RGBA" value={rgba(color)} /><Card title="HSL" value={hsl(color)} /></div><div className="grid gap-3 sm:grid-cols-2"><Card title="LAB (D65)" value={`lab(${fmt(data.spaces.lab.l)}% ${fmt(data.spaces.lab.a)} ${fmt(data.spaces.lab.b)})`} /><Card title="OKLCH" value={`oklch(${fmt(data.spaces.oklch.l * 100)}% ${fmt(data.spaces.oklch.c, 3)} ${fmt(data.spaces.oklch.h)})`} /></div>
      <section className="rounded-xl border border-border-subtle bg-bg-card p-4"><div className="flex h-8 items-center justify-between"><h2 className="text-sm text-text-primary">Tint / shade palette</h2><span className="text-xs text-text-muted">white → base → black</span></div><div className="grid grid-cols-4 gap-2 sm:grid-cols-8">{data.palette.map((swatch, i) => <button type="button" key={i} aria-label={`Copy ${hex(swatch)}`} title={hex(swatch)} onClick={() => setValue(hex(swatch))} className="h-12 rounded border border-border-subtle" style={{ backgroundColor: hex(swatch) }} />)}</div></section>
      <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border-subtle bg-bg-card p-4"><h2 className="mb-3 text-sm">WCAG contrast</h2><div className="space-y-2 text-xs"><div className="flex justify-between"><span>Against white</span><b>{fmt(data.whiteRatio, 2)}:1 {data.whiteRatio >= 4.5 ? "✓ AA" : "—"}</b></div><div className="flex justify-between"><span>Against black</span><b>{fmt(data.blackRatio, 2)}:1 {data.blackRatio >= 4.5 ? "✓ AA" : "—"}</b></div><div className="mt-3 rounded p-2 text-center" style={{ backgroundColor: hex(color), color: hex(data.foreground) }}>Accessible foreground: {hex(data.foreground)}</div></div></div><div className="rounded-xl border border-border-subtle bg-bg-card p-4"><div className="flex h-8 items-center justify-between"><h2 className="text-sm">CSS variables</h2><CopyButton text={data.vars} /></div><pre className="overflow-x-auto text-xs text-text-secondary">{data.vars}</pre></div></section></>}
  </div></ToolLayout>;
}
