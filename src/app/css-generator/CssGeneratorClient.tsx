"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

type Mode = "glass" | "shadow" | "gradient";

export default function CssGeneratorClient() {
  const [activeMode, setActiveMode] = useState<Mode>("glass");
  // Glassmorphism state
  const [glassBlur, setGlassBlur] = useState(16);
  const [glassOpacity, setGlassOpacity] = useState(0.15);
  const [glassBorderOpacity, setGlassBorderOpacity] = useState(0.2);
  const [glassBgColor, setGlassBgColor] = useState("#ffffff");

  // Box Shadow state
  const [shadowX, setShadowX] = useState(0);
  const [shadowY, setShadowY] = useState(10);
  const [shadowBlur, setShadowBlur] = useState(25);
  const [shadowSpread, setShadowSpread] = useState(-5);
  const [shadowColor, setShadowColor] = useState("#4ade80");
  const [shadowOpacity, setShadowOpacity] = useState(0.3);
  const [shadowInset, setShadowInset] = useState(false);

  // Gradient state
  const [gradAngle, setGradAngle] = useState(135);
  const [gradColor1, setGradColor1] = useState("#4ade80");
  const [gradColor2, setGradColor2] = useState("#06b6d4");
  const [gradColor3, setGradColor3] = useState("#3b82f6");

  const cssCode = useMemo(() => {
    if (activeMode === "glass") {
      return `/* Glassmorphism CSS */
background: ${glassBgColor}${Math.round(glassOpacity * 255).toString(16).padStart(2, "0")};
backdrop-filter: blur(${glassBlur}px);
-webkit-backdrop-filter: blur(${glassBlur}px);
border: 1px solid ${glassBgColor}${Math.round(glassBorderOpacity * 255).toString(16).padStart(2, "0")};
border-radius: 16px;`;
    } else if (activeMode === "shadow") {
      const insetStr = shadowInset ? "inset " : "";
      const hexAlpha = Math.round(shadowOpacity * 255).toString(16).padStart(2, "0");
      return `/* Box Shadow CSS */
box-shadow: ${insetStr}${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}${hexAlpha};
border-radius: 12px;`;
    } else {
      return `/* Gradient CSS */
background: linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2}, ${gradColor3});
border-radius: 12px;`;
    }
  }, [
    activeMode,
    glassBlur,
    glassOpacity,
    glassBorderOpacity,
    glassBgColor,
    shadowX,
    shadowY,
    shadowBlur,
    shadowSpread,
    shadowColor,
    shadowOpacity,
    shadowInset,
    gradAngle,
    gradColor1,
    gradColor2,
    gradColor3,
  ]);

  const previewStyle = useMemo<React.CSSProperties>(() => {
    if (activeMode === "glass") {
      return {
        background: `${glassBgColor}${Math.round(glassOpacity * 255).toString(16).padStart(2, "0")}`,
        backdropFilter: `blur(${glassBlur}px)`,
        WebkitBackdropFilter: `blur(${glassBlur}px)`,
        border: `1px solid ${glassBgColor}${Math.round(glassBorderOpacity * 255).toString(16).padStart(2, "0")}`,
        borderRadius: "16px",
      };
    } else if (activeMode === "shadow") {
      const insetStr = shadowInset ? "inset " : "";
      const hexAlpha = Math.round(shadowOpacity * 255).toString(16).padStart(2, "0");
      return {
        background: "#101713",
        boxShadow: `${insetStr}${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}${hexAlpha}`,
        border: "1px solid #1f2b24",
        borderRadius: "12px",
      };
    } else {
      return {
        background: `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2}, ${gradColor3})`,
        borderRadius: "12px",
      };
    }
  }, [
    activeMode,
    glassBlur,
    glassOpacity,
    glassBorderOpacity,
    glassBgColor,
    shadowX,
    shadowY,
    shadowBlur,
    shadowSpread,
    shadowColor,
    shadowOpacity,
    shadowInset,
    gradAngle,
    gradColor1,
    gradColor2,
    gradColor3,
  ]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Generator Mode</p>
        <p className="text-accent font-mono uppercase text-xs font-bold">{activeMode}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">CSS Output</p>
        <p className="text-text-primary font-mono text-xs">Standard CSS3</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="css-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Mode Tabs */}
          <div className="flex items-center gap-1.5 mb-6 bg-bg-page p-1 rounded-lg border border-border-subtle">
            {(
              [
                { id: "glass", label: "Glassmorphism" },
                { id: "shadow", label: "Box Shadow & Glow" },
                { id: "gradient", label: "Gradients" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className={`flex-1 py-2 text-xs font-mono rounded-md transition-colors ${
                  activeMode === tab.id
                    ? "bg-accent-soft text-accent font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Workspace: Preview + Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Visual Canvas Preview */}
            <div className="relative rounded-xl p-8 flex items-center justify-center min-h-[280px] overflow-hidden border border-border-subtle bg-[radial-gradient(#1f2b24_1px,transparent_1px)] [background-size:16px_16px]">
              {/* Decorative background shapes for glass effect */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-accent/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/30 rounded-full blur-2xl" />

              <div
                style={previewStyle}
                className="relative z-10 w-full max-w-[240px] h-[160px] p-4 flex flex-col justify-between transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-[10px] font-mono text-white/80 uppercase font-semibold">
                    Preview
                  </span>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">MegaTools UI</p>
                  <p className="text-white/70 text-xs mt-0.5">Terminal Component</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4 p-4 rounded-xl bg-bg-page border border-border-subtle">
              {activeMode === "glass" && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                      <span>Backdrop Blur</span>
                      <span>{glassBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={glassBlur}
                      onChange={(e) => setGlassBlur(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                      <span>Background Opacity</span>
                      <span>{Math.round(glassOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.9"
                      step="0.01"
                      value={glassOpacity}
                      onChange={(e) => setGlassOpacity(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                      <span>Border Opacity</span>
                      <span>{Math.round(glassBorderOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={glassBorderOpacity}
                      onChange={(e) => setGlassBorderOpacity(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-mono text-text-secondary">Glass Tint Color</span>
                    <input
                      type="color"
                      value={glassBgColor}
                      onChange={(e) => setGlassBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-border-subtle bg-transparent cursor-pointer"
                    />
                  </div>
                </>
              )}

              {activeMode === "shadow" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                        <span>X Offset</span>
                        <span>{shadowX}px</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={shadowX}
                        onChange={(e) => setShadowX(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                        <span>Y Offset</span>
                        <span>{shadowY}px</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={shadowY}
                        onChange={(e) => setShadowY(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                        <span>Blur</span>
                        <span>{shadowBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={shadowBlur}
                        onChange={(e) => setShadowBlur(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                        <span>Spread</span>
                        <span>{shadowSpread}px</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={shadowSpread}
                        onChange={(e) => setShadowSpread(Number(e.target.value))}
                        className="w-full accent-accent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shadowInset}
                        onChange={(e) => setShadowInset(e.target.checked)}
                        className="rounded border-border-subtle text-accent focus:ring-accent"
                      />
                      Inset Shadow
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-text-secondary">Color:</span>
                      <input
                        type="color"
                        value={shadowColor}
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-8 h-8 rounded border border-border-subtle bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeMode === "gradient" && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-mono text-text-secondary mb-1">
                      <span>Angle</span>
                      <span>{gradAngle}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradAngle}
                      onChange={(e) => setGradAngle(Number(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-mono text-text-secondary">Color Stops:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={gradColor1}
                        onChange={(e) => setGradColor1(e.target.value)}
                        className="w-7 h-7 rounded border border-border-subtle bg-transparent cursor-pointer"
                      />
                      <input
                        type="color"
                        value={gradColor2}
                        onChange={(e) => setGradColor2(e.target.value)}
                        className="w-7 h-7 rounded border border-border-subtle bg-transparent cursor-pointer"
                      />
                      <input
                        type="color"
                        value={gradColor3}
                        onChange={(e) => setGradColor3(e.target.value)}
                        className="w-7 h-7 rounded border border-border-subtle bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Generated CSS Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Generated CSS:
              </label>
              <CopyButton text={cssCode} />
            </div>
            <div className="relative rounded-lg bg-bg-page border border-border-subtle p-4 font-mono text-xs text-text-primary overflow-x-auto">
              <pre className="whitespace-pre">{cssCode}</pre>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}