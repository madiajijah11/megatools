"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

const PRESETS = {
  financial: {
    title: "Financial Earnings Summary",
    labelA: "Model A (GPT-4o)",
    labelB: "Model B (Claude 3.5 Sonnet)",
    outputA: `Q3 Financial Overview:
- Total Revenue: $48.2 billion (up 14.5% year-over-year).
- Net Income: $12.8 billion with diluted EPS of $2.15.
- Operating Margin: 26.5% compared to 24.1% in Q3 prior year.
- Cloud Services growth accelerated to 29.0%, reaching $14.1 billion.
- Full-year revenue guidance raised to $195.0 billion.`,
    outputB: `Q3 Financial Summary:
- Total Revenue: $48.2 billion (up 12.8% year-over-year).
- Net Income: $12.8 billion with diluted EPS of $2.18.
- Operating Margin: 26.5% compared to 24.1% in Q3 prior year.
- Cloud Services growth accelerated to 31.5%, reaching $14.1 billion.
- Full-year revenue guidance maintained at $192.5 billion.`
  },
  codeReview: {
    title: "Code Review Refactoring",
    labelA: "Draft A (Temperature 0.2)",
    labelB: "Draft B (Temperature 0.7)",
    outputA: `function calculateDiscount(price: number, tier: string): number {
  if (price <= 0) return 0;
  switch (tier.toLowerCase()) {
    case 'vip': return price * 0.80;
    case 'premium': return price * 0.90;
    default: return price;
  }
}`,
    outputB: `function calculateDiscount(price: number, tier: string): number {
  if (typeof price !== 'number' || price <= 0) return 0;
  const rates: Record<string, number> = { vip: 0.20, premium: 0.10 };
  const discountRate = rates[tier.toLowerCase()] ?? 0;
  return price * (1 - discountRate);
}`
  },
  medical: {
    title: "Clinical Drug Interaction Summary",
    labelA: "Model A (Standard Prompt)",
    labelB: "Model B (Reasoning Prompt)",
    outputA: `Patient Assessment:
1. Administer Amoxicillin 500mg every 8 hours for 7 days.
2. Monitor renal function daily if serum creatinine exceeds 1.4 mg/dL.
3. Adverse reactions observed in 4.2% of patient cohort during Phase 3 trials.`,
    outputB: `Patient Assessment:
1. Administer Amoxicillin 500mg every 8 hours for 10 days.
2. Monitor renal function daily if serum creatinine exceeds 1.8 mg/dL.
3. Adverse reactions observed in 7.8% of patient cohort during Phase 3 trials.`
  }
};

export default function LlmDiffComparatorClient() {
  const [labelA, setLabelA] = useState<string>(PRESETS.financial.labelA);
  const [labelB, setLabelB] = useState<string>(PRESETS.financial.labelB);
  const [outputA, setOutputA] = useState<string>(PRESETS.financial.outputA);
  const [outputB, setOutputB] = useState<string>(PRESETS.financial.outputB);
  const [viewMode, setViewMode] = useState<"side-by-side" | "diff" | "discrepancies">("side-by-side");

  const loadPreset = (key: keyof typeof PRESETS) => {
    setLabelA(PRESETS[key].labelA);
    setLabelB(PRESETS[key].labelB);
    setOutputA(PRESETS[key].outputA);
    setOutputB(PRESETS[key].outputB);
  };

  const diffWords = useMemo(() => {
    const wordsA = outputA.split(/(\s+|[^\s\w])/g).filter(Boolean);
    const wordsB = outputB.split(/(\s+|[^\s\w])/g).filter(Boolean);

    const setA = new Set(wordsA.map((w) => w.toLowerCase().trim()).filter(Boolean));
    const setB = new Set(wordsB.map((w) => w.toLowerCase().trim()).filter(Boolean));
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    const jaccard = union.size > 0 ? (intersection.size / union.size) * 100 : 100;

    return {
      jaccardScore: Math.round(jaccard),
    };
  }, [outputA, outputB]);

  const discrepancies = useMemo(() => {
    const numRegex = /\b\d+(?:\.\d+)?%?|\$\d+(?:\.\d+)?(?:\s*(?:billion|million|trillion|k|b|m))?\b/gi;

    const matchesA = outputA.match(numRegex) || [];
    const matchesB = outputB.match(numRegex) || [];

    const normA = matchesA.map((m) => m.toLowerCase().trim());
    const normB = matchesB.map((m) => m.toLowerCase().trim());

    const inAnotB = normA.filter((x) => !normB.includes(x));
    const inBnotA = normB.filter((x) => !normA.includes(x));

    const totalStats = Math.max(normA.length, normB.length);
    const commonStats = normA.filter((x) => normB.includes(x)).length;
    const statConsistency = totalStats > 0 ? Math.round((commonStats / totalStats) * 100) : 100;

    return {
      statsA: matchesA,
      statsB: matchesB,
      inAnotB: [...new Set(inAnotB)],
      inBnotA: [...new Set(inBnotA)],
      statConsistency
    };
  }, [outputA, outputB]);

  const lineDiff = useMemo(() => {
    const linesA = outputA.split("\n");
    const linesB = outputB.split("\n");
    const maxLen = Math.max(linesA.length, linesB.length);
    const lines = [];

    for (let i = 0; i < maxLen; i++) {
      const a = linesA[i] ?? "";
      const b = linesB[i] ?? "";
      const isIdentical = a === b;
      lines.push({
        lineNum: i + 1,
        textA: a,
        textB: b,
        isIdentical
      });
    }

    return lines;
  }, [outputA, outputB]);

  const stats = (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-text-muted text-xs">Semantic Overlap</p>
        <p className="text-accent font-mono font-bold text-lg">{diffWords.jaccardScore}%</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Numerical Match</p>
        <p className={`font-mono font-bold ${discrepancies.statConsistency < 80 ? "text-warning" : "text-success"}`}>
          {discrepancies.statConsistency}%
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Mismatched Stats</p>
        <p className="text-warning font-mono">{discrepancies.inAnotB.length + discrepancies.inBnotA.length} items</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Diff Lines</p>
        <p className="text-text-primary font-mono">
          {lineDiff.filter((l) => !l.isIdentical).length} / {lineDiff.length}
        </p>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="llm-diff-comparator" stats={stats}>
      <div className="card p-6 space-y-6 font-mono">
        {/* Presets */}
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2">
            Sample Comparison Scenarios
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadPreset("financial")}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Financial Earnings
            </button>
            <button
              type="button"
              onClick={() => loadPreset("medical")}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Clinical Dosage
            </button>
            <button
              type="button"
              onClick={() => loadPreset("codeReview")}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Code Refactoring
            </button>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setViewMode("side-by-side")}
            className={viewMode === "side-by-side" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
          >
            Side-by-Side Editor
          </button>
          <button
            type="button"
            onClick={() => setViewMode("diff")}
            className={viewMode === "diff" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
          >
            Line Diff View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("discrepancies")}
            className={viewMode === "discrepancies" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
          >
            Hallucination Spotter
          </button>
        </div>

        {/* Mode Views */}
        {viewMode === "side-by-side" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={labelA}
                  onChange={(e) => setLabelA(e.target.value)}
                  className="bg-transparent text-accent font-semibold text-xs focus:outline-none w-36 font-mono"
                />
                <CopyButton text={outputA} label="Copy A" />
              </div>
              <textarea
                value={outputA}
                onChange={(e) => setOutputA(e.target.value)}
                placeholder="Paste first model output here..."
                rows={10}
                className="w-full rounded-xl border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  value={labelB}
                  onChange={(e) => setLabelB(e.target.value)}
                  className="bg-transparent text-cyan-300 font-semibold text-xs focus:outline-none w-36 font-mono"
                />
                <CopyButton text={outputB} label="Copy B" />
              </div>
              <textarea
                value={outputB}
                onChange={(e) => setOutputB(e.target.value)}
                placeholder="Paste second model output here..."
                rows={10}
                className="w-full rounded-xl border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
              />
            </div>
          </div>
        )}

        {viewMode === "diff" && (
          <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
            {lineDiff.map((line) => (
              <div
                key={line.lineNum}
                className={`p-3 rounded-xl border ${
                  line.isIdentical
                    ? "bg-bg-page border-border-subtle text-text-muted"
                    : "bg-amber-500/10 border-amber-500/30 text-text-primary"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-text-muted mb-1.5">
                  <span>Line #{line.lineNum}</span>
                  {line.isIdentical ? (
                    <span className="text-success">[Identical]</span>
                  ) : (
                    <span className="text-amber-400 font-bold">[Modified]</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-bg-card border border-border-subtle">
                    <span className="text-[10px] text-accent block mb-0.5">{labelA}:</span>
                    {line.textA || <span className="text-text-muted italic">[Empty Line]</span>}
                  </div>
                  <div className="p-2 rounded bg-bg-card border border-border-subtle">
                    <span className="text-[10px] text-cyan-300 block mb-0.5">{labelB}:</span>
                    {line.textB || <span className="text-text-muted italic">[Empty Line]</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === "discrepancies" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-border-subtle bg-bg-page space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span className="font-semibold text-accent text-xs">{labelA} Exclusive Numbers</span>
                <span className="text-xs text-text-muted font-mono">{discrepancies.inAnotB.length} items</span>
              </div>
              {discrepancies.inAnotB.length === 0 ? (
                <p className="text-text-muted text-xs text-center py-6">No exclusive numerical values found.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {discrepancies.inAnotB.map((stat, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold">
                      {stat}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-border-subtle bg-bg-page space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                <span className="font-semibold text-cyan-300 text-xs">{labelB} Exclusive Numbers</span>
                <span className="text-xs text-text-muted font-mono">{discrepancies.inBnotA.length} items</span>
              </div>
              {discrepancies.inBnotA.length === 0 ? (
                <p className="text-text-muted text-xs text-center py-6">No exclusive numerical values found.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {discrepancies.inBnotA.map((stat, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
                      {stat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
