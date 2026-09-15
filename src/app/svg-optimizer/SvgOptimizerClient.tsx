"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

function optimizeSvg(rawSvg: string): string {
  if (!rawSvg.trim()) return "";

  return rawSvg
    // Strip XML prolog & DocType
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    // Strip comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Strip metadata, title, desc
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .replace(/<title[\s\S]*?<\/title>/gi, "")
    .replace(/<desc[\s\S]*?<\/desc>/gi, "")
    // Strip editor namespaces and attributes
    .replace(/\s+(xmlns:inkscape|xmlns:sodipodi|xmlns:sketch|xmlns:adobe|xmlns:illustrator)="[^"]*"/gi, "")
    .replace(/\s+(inkscape|sodipodi|sketch|adobe|i):[a-zA-Z0-9_-]+="[^"]*"/gi, "")
    .replace(/\s+data-name="[^"]*"/gi, "")
    // Strip empty groups
    .replace(/<g\s*><\/g>/gi, "")
    .replace(/<g\s*\/>/gi, "")
    .replace(/<defs\s*><\/defs>/gi, "")
    // Collapse excess whitespace
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generator: Adobe Illustrator 28.0, SVG Export Plug-In -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 100 100" width="100" height="100" data-name="Layer 1">
  <metadata>
    <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
      <cc:Work rdf:about=""/>
    </rdf:RDF>
  </metadata>
  <g id="shield-icon" inkscape:label="Layer 1">
    <circle cx="50" cy="50" r="45" fill="#101713" stroke="#4ade80" stroke-width="4"/>
    <path d="M50 25 L75 35 L75 55 C75 70 50 82 50 82 C50 82 25 70 25 55 L25 35 Z" fill="#4ade80" fill-opacity="0.2" stroke="#4ade80" stroke-width="3"/>
    <polyline points="40,52 47,60 62,45" fill="none" stroke="#4ade80" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

export default function SvgOptimizerClient() {
  const [input, setInput] = useState(SAMPLE_SVG);
  const [dragOver, setDragOver] = useState(false);
  const output = useMemo(() => {
    return optimizeSvg(input);
  }, [input]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setInput(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "optimized.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  const origSize = new TextEncoder().encode(input).length;
  const optSize = new TextEncoder().encode(output).length;
  const savings = origSize && optSize ? (((origSize - optSize) / origSize) * 100).toFixed(1) : null;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Original Size</p>
        <p className="text-text-primary font-mono">{origSize ? `${origSize} B` : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Optimized Size</p>
        <p className="text-text-primary font-mono">{optSize ? `${optSize} B` : "—"}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="svg-optimizer" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
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
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileUpload(f);
            }}
            className={`mb-6 flex min-h-[90px] cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed px-4 py-4 text-center transition-colors ${
              dragOver
                ? "border-accent bg-accent-soft"
                : "border-border-subtle bg-bg-page hover:border-accent"
            }`}
          >
            <input
              type="file"
              accept=".svg,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <span className="font-mono text-xs text-text-secondary">
              $ drop an .svg file here -- or paste XML below
            </span>
          </label>

          {/* Input & Output Panes */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-text-secondary font-mono">
                  SVG Raw Code
                </label>
                <button
                  onClick={() => setInput("")}
                  className="text-xs text-text-muted hover:text-text-primary font-mono"
                >
                  clear
                </button>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="<svg ...>...</svg>"
                className="input-field min-h-[120px] resize-y font-mono text-xs"
              />
            </div>

            {/* Visual Vector Preview & Clean Output */}
            {output && (
              <div className="space-y-4">
                <div className="rounded border border-border-subtle bg-bg-page p-4">
                  <p className="text-xs font-semibold text-text-muted uppercase mb-3 font-mono">
                    Live Vector Render Preview
                  </p>
                  <div className="flex items-center justify-center p-6 bg-bg-card rounded border border-border-subtle overflow-hidden">
                    <div
                      className="max-w-[200px] max-h-[200px]"
                      dangerouslySetInnerHTML={{ __html: output }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-text-secondary font-mono">
                        Optimized SVG Code
                      </label>
                      {savings && Number(savings) > 0 && (
                        <span className="px-2 py-0.5 rounded bg-success/15 border border-success/30 text-success text-[11px] font-mono">
                          -{savings}% reduction
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton text={output} label="copy svg" />
                      <button
                        onClick={handleDownload}
                        className="btn-secondary text-xs py-1 px-3"
                      >
                        Download .svg
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    value={output}
                    className="output-field min-h-[120px] resize-y font-mono text-xs text-accent whitespace-pre-wrap"
                  />
                </div>
              </div>
            )}
          </div>
      </div>
    </ToolLayout>
  );
}