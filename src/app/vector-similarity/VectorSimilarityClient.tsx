"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

const SAMPLES = {
  highSim: {
    a: "0.82, 0.45, 0.12, 0.91, -0.23, 0.67",
    b: "0.79, 0.48, 0.15, 0.88, -0.21, 0.65",
  },
  opposite: {
    a: "1.0, 0.5, 0.2, 0.8, -0.5",
    b: "-1.0, -0.5, -0.2, -0.8, 0.5",
  },
  orthogonal: {
    a: "1.0, 0.0, 0.0, 1.0",
    b: "0.0, 1.0, 1.0, 0.0",
  },
};

function parseVector(input: string): number[] {
  const clean = input
    .replace(/[\[\]\(\)]/g, "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const nums: number[] = [];
  for (const s of clean) {
    const val = parseFloat(s);
    if (!isNaN(val)) nums.push(val);
  }
  return nums;
}

export default function VectorSimilarityClient() {
  const [vectorAStr, setVectorAStr] = useState<string>(SAMPLES.highSim.a);
  const [vectorBStr, setVectorBStr] = useState<string>(SAMPLES.highSim.b);
  const calculation = useMemo(() => {
    const vecA = parseVector(vectorAStr);
    const vecB = parseVector(vectorBStr);

    if (vecA.length === 0 || vecB.length === 0) {
      return { error: "Enter vector dimensions for both A and B", valid: false };
    }

    if (vecA.length !== vecB.length) {
      return {
        error: `Dimension mismatch: Vector A has ${vecA.length} dimensions, Vector B has ${vecB.length} dimensions. Dimensions must match!`,
        valid: false,
      };
    }

    const n = vecA.length;
    let dotProduct = 0;
    let normASq = 0;
    let normBSq = 0;
    let euclideanSq = 0;
    let manhattan = 0;

    for (let i = 0; i < n; i++) {
      const a = vecA[i];
      const b = vecB[i];
      dotProduct += a * b;
      normASq += a * a;
      normBSq += b * b;
      euclideanSq += (a - b) * (a - b);
      manhattan += Math.abs(a - b);
    }

    const normA = Math.sqrt(normASq);
    const normB = Math.sqrt(normBSq);
    const cosineSim = normA > 0 && normB > 0 ? dotProduct / (normA * normB) : 0;
    const cosineDist = 1 - cosineSim;
    const euclidean = Math.sqrt(euclideanSq);

    return {
      valid: true,
      dimensions: n,
      cosineSim: Number(cosineSim.toFixed(6)),
      cosineDist: Number(cosineDist.toFixed(6)),
      dotProduct: Number(dotProduct.toFixed(6)),
      euclidean: Number(euclidean.toFixed(6)),
      manhattan: Number(manhattan.toFixed(6)),
      normA: Number(normA.toFixed(6)),
      normB: Number(normB.toFixed(6)),
      error: null,
    };
  }, [vectorAStr, vectorBStr]);

  const generateRandom128D = () => {
    const a = Array.from({ length: 32 }, () => (Math.random() * 2 - 1).toFixed(4)).join(", ");
    const b = Array.from({ length: 32 }, () => (Math.random() * 2 - 1).toFixed(4)).join(", ");
    setVectorAStr(a);
    setVectorBStr(b);
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Vector Dimensions</p>
        <p className="text-accent font-mono text-xs font-bold">
          {calculation.valid ? `${calculation.dimensions}D` : "0D"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Cosine Score</p>
        <p className="text-text-primary font-mono text-xs">
          {calculation.valid ? calculation.cosineSim : "-"}
        </p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="vector-similarity" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <span className="text-text-muted">Presets:</span>
              <button
                type="button"
                onClick={() => {
                  setVectorAStr(SAMPLES.highSim.a);
                  setVectorBStr(SAMPLES.highSim.b);
                }}
                className="px-2 py-0.5 rounded border border-border-subtle bg-bg-page/60 text-text-secondary hover:border-accent/40 hover:text-text-primary transition-colors"
              >
                High Similarity (0.99)
              </button>
              <button
                type="button"
                onClick={() => {
                  setVectorAStr(SAMPLES.orthogonal.a);
                  setVectorBStr(SAMPLES.orthogonal.b);
                }}
                className="px-2 py-0.5 rounded border border-border-subtle bg-bg-page/60 text-text-secondary hover:border-accent/40 hover:text-text-primary transition-colors"
              >
                Orthogonal (0.0)
              </button>
              <button
                type="button"
                onClick={() => {
                  setVectorAStr(SAMPLES.opposite.a);
                  setVectorBStr(SAMPLES.opposite.b);
                }}
                className="px-2 py-0.5 rounded border border-border-subtle bg-bg-page/60 text-text-secondary hover:border-accent/40 hover:text-text-primary transition-colors"
              >
                Opposite (-1.0)
              </button>
            </div>

            <button
              type="button"
              onClick={generateRandom128D}
              className="text-xs font-mono text-accent hover:underline"
            >
              $ generate random 32D
            </button>
          </div>

          {/* 2-Column Vector Inputs */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            {/* Vector A */}
            <div className="flex flex-col space-y-2">
              <div className="h-8 flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  Vector A (Embedding Array):
                </label>
                <button
                  type="button"
                  onClick={() => setVectorAStr("")}
                  className="text-xs font-mono text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle/60 bg-bg-page/60"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={vectorAStr}
                onChange={(e) => setVectorAStr(e.target.value)}
                placeholder="0.12, 0.45, -0.89, ..."
                rows={6}
                className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Vector B */}
            <div className="flex flex-col space-y-2">
              <div className="h-8 flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  Vector B (Embedding Array):
                </label>
                <button
                  type="button"
                  onClick={() => setVectorBStr("")}
                  className="text-xs font-mono text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle/60 bg-bg-page/60"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={vectorBStr}
                onChange={(e) => setVectorBStr(e.target.value)}
                placeholder="0.15, 0.41, -0.82, ..."
                rows={6}
                className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          {calculation.error && (
            <div className="p-3.5 mb-6 rounded-xl bg-error/10 border border-error/30 text-error font-mono text-xs">
              ⚠ {calculation.error}
            </div>
          )}

          {/* Results Grid */}
          {calculation.valid && (
            <div className="space-y-4 border-t border-border-subtle pt-6">
              {/* Primary Score: Cosine Similarity */}
              <div className="p-4 rounded-xl border border-accent/40 bg-accent-soft/30 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-accent font-bold uppercase">
                    Cosine Similarity (cos θ)
                  </span>
                  <div className="font-mono text-2xl sm:text-3xl font-bold text-accent">
                    {calculation.cosineSim}
                  </div>
                  <span className="text-[11px] font-mono text-text-muted">
                    Scale: +1.0 (Identical) · 0.0 (Unrelated) · -1.0 (Opposite)
                  </span>
                </div>
                <div>
                  <CopyButton
                    text={String(calculation.cosineSim)}
                    label="copy score"
                    className="text-xs font-mono px-3 py-1.5 rounded border border-accent/40 bg-accent-soft text-accent hover:bg-accent-hover hover:text-bg-page transition-colors cursor-pointer"
                  />
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle">
                  <span className="text-[11px] font-mono text-text-muted block">Dot Product:</span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {calculation.dotProduct}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle">
                  <span className="text-[11px] font-mono text-text-muted block">Euclidean (L2):</span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {calculation.euclidean}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle">
                  <span className="text-[11px] font-mono text-text-muted block">Manhattan (L1):</span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {calculation.manhattan}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle">
                  <span className="text-[11px] font-mono text-text-muted block">Cosine Dist (1-cos):</span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {calculation.cosineDist}
                  </span>
                </div>
              </div>
            </div>
          )}
      </div>
    </ToolLayout>
  );
}