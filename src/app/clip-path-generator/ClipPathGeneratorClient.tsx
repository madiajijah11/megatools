"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useRef, useMemo, useCallback } from "react";
import CopyButton from "@/components/CopyButton";

interface Point {
  x: number; // 0 to 100%
  y: number; // 0 to 100%
}

const PRESETS: Record<string, Point[]> = {
  triangle: [
    { x: 50, y: 0 },
    { x: 0, y: 100 },
    { x: 100, y: 100 },
  ],
  trapezoid: [
    { x: 20, y: 0 },
    { x: 80, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ],
  hexagon: [
    { x: 50, y: 0 },
    { x: 100, y: 25 },
    { x: 100, y: 75 },
    { x: 50, y: 100 },
    { x: 0, y: 75 },
    { x: 0, y: 25 },
  ],
  chevron: [
    { x: 75, y: 0 },
    { x: 100, y: 50 },
    { x: 75, y: 100 },
    { x: 0, y: 100 },
    { x: 25, y: 50 },
    { x: 0, y: 0 },
  ],
  star: [
    { x: 50, y: 0 },
    { x: 61, y: 35 },
    { x: 98, y: 35 },
    { x: 68, y: 57 },
    { x: 79, y: 91 },
    { x: 50, y: 70 },
    { x: 21, y: 91 },
    { x: 32, y: 57 },
    { x: 2, y: 35 },
    { x: 39, y: 35 },
  ],
  rhombus: [
    { x: 50, y: 0 },
    { x: 100, y: 50 },
    { x: 50, y: 100 },
    { x: 0, y: 50 },
  ],
  message: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 75 },
    { x: 75, y: 75 },
    { x: 75, y: 100 },
    { x: 50, y: 75 },
    { x: 0, y: 75 },
  ],
};

export default function ClipPathGeneratorClient() {
  const [points, setPoints] = useState<Point[]>(PRESETS.hexagon);
  const [activePreset, setActivePreset] = useState<string>("hexagon");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [bgStyle, setBgStyle] = useState<"gradient" | "solid" | "neon">("gradient");
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const clipPathCss = useMemo(() => {
    const coords = points.map((p) => `${Math.round(p.x)}% ${Math.round(p.y)}%`).join(", ");
    return `clip-path: polygon(${coords});`;
  }, [points]);

  const tailwindClass = useMemo(() => {
    const coords = points.map((p) => `${Math.round(p.x)}%_${Math.round(p.y)}%`).join(",");
    return `[clip-path:polygon(${coords})]`;
  }, [points]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingIdx === null || !canvasContainerRef.current) return;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const clientY = e.clientY;

      let x = ((clientX - rect.left) / rect.width) * 100;
      let y = ((clientY - rect.top) / rect.height) * 100;

      x = Math.max(0, Math.min(100, Math.round(x)));
      y = Math.max(0, Math.min(100, Math.round(y)));

      setPoints((prev) => {
        const next = [...prev];
        next[draggingIdx] = { x, y };
        return next;
      });
    },
    [draggingIdx]
  );

  const handlePointerUp = () => {
    setDraggingIdx(null);
  };

  const handleAddPoint = () => {
    setPoints([...points, { x: 50, y: 50 }]);
  };

  const handleRemovePoint = (idx: number) => {
    if (points.length <= 3) return;
    setPoints(points.filter((_, i) => i !== idx));
  };

  const loadPreset = (name: string) => {
    setActivePreset(name);
    setPoints(PRESETS[name]);
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Vertices</p>
        <p className="text-accent font-mono text-xs font-bold">{points.length} Points</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">CSS Property</p>
        <p className="text-text-primary font-mono text-xs">clip-path</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="clip-path-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Presets */}
          <div className="mb-4">
            <label className="text-xs font-mono text-text-secondary block mb-1.5 font-bold">Presets:</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(PRESETS).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => loadPreset(name)}
                  className={`px-3 py-1 text-xs font-mono rounded capitalize transition-colors ${
                    activePreset === name
                      ? "bg-accent-soft text-accent font-bold border border-accent"
                      : "bg-bg-page border border-border-subtle text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Interactive Canvas */}
            <div className="flex flex-col space-y-3">
              <div
                ref={canvasContainerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative w-full aspect-square max-h-[380px] rounded-2xl bg-bg-page border border-border-subtle overflow-hidden select-none touch-none flex items-center justify-center p-4"
              >
                {/* Background Shape being clipped */}
                <div
                  style={{
                    clipPath: `polygon(${points.map((p) => `${p.x}% ${p.y}%`).join(", ")})`,
                  }}
                  className={`w-full h-full transition-all duration-75 shadow-2xl ${
                    bgStyle === "gradient"
                      ? "bg-gradient-to-tr from-accent via-emerald-500 to-cyan-500"
                      : bgStyle === "neon"
                      ? "bg-gradient-to-r from-fuchsia-500 via-purple-600 to-accent"
                      : "bg-accent"
                  }`}
                />

                {/* SVG Polygon Outline */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon
                    points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="0.75"
                    strokeDasharray="2,2"
                  />
                </svg>

                {/* Draggable Anchors */}
                {points.map((pt, idx) => (
                  <div
                    key={idx}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setDraggingIdx(idx);
                    }}
                    style={{
                      left: `calc(${pt.x}% - 8px)`,
                      top: `calc(${pt.y}% - 8px)`,
                    }}
                    className={`absolute w-4 h-4 rounded-full border-2 cursor-grab active:cursor-grabbing z-20 flex items-center justify-center text-[8px] font-mono font-bold shadow-md transition-transform ${
                      draggingIdx === idx
                        ? "bg-white border-accent scale-125"
                        : "bg-accent border-bg-page text-bg-page hover:scale-110"
                    }`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>

              {/* Controls below canvas */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-bg-page border border-border-subtle">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddPoint}
                    className="px-2.5 py-1 text-xs font-mono rounded bg-bg-card border border-border-subtle hover:border-accent text-text-primary transition-colors"
                  >
                    + Add Vertex
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePoint(points.length - 1)}
                    disabled={points.length <= 3}
                    className="px-2.5 py-1 text-xs font-mono rounded bg-bg-card border border-border-subtle hover:border-error text-text-secondary disabled:opacity-50 transition-colors"
                  >
                    - Remove Vertex
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-text-muted">Theme:</span>
                  {(["gradient", "neon", "solid"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBgStyle(st)}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize ${
                        bgStyle === st ? "bg-accent-soft text-accent font-bold" : "text-text-muted"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Code Output */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                    Standard CSS Rule:
                  </span>
                  <CopyButton text={clipPathCss} />
                </div>
                <div className="p-3 bg-bg-card border border-border-subtle rounded font-mono text-xs text-accent break-all select-all">
                  {clipPathCss}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                    Tailwind CSS Arbitrary Value:
                  </span>
                  <CopyButton text={tailwindClass} />
                </div>
                <div className="p-3 bg-bg-card border border-border-subtle rounded font-mono text-[11px] text-text-secondary break-all select-all">
                  {tailwindClass}
                </div>
              </div>

              {/* Point Coordinates table */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2 max-h-[160px] overflow-y-auto">
                <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider block">
                  Vertex Coordinate Points:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {points.map((p, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-bg-card border border-border-subtle font-mono text-[10px] text-text-muted flex justify-between">
                      <span className="text-accent font-bold">P{idx + 1}:</span>
                      <span>{p.x}%, {p.y}%</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}