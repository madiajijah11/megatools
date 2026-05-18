"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

type DiffLine = {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNum: number;
};

function computeDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");

  // Build LCS table (longest common subsequence)
  const m = origLines.length;
  const n = modLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === modLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m;
  let j = n;
  const temp: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      temp.push({ type: "unchanged", content: origLines[i - 1], lineNum: i });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      temp.push({ type: "added", content: modLines[j - 1], lineNum: j });
      j--;
    } else {
      temp.push({ type: "removed", content: origLines[i - 1], lineNum: i });
      i--;
    }
  }

  return temp.reverse();
}

export default function DiffClient() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diff, setDiff] = useState<DiffLine[] | null>(null);

  const handleCompare = () => {
    setDiff(computeDiff(original, modified));
  };

  const stats = diff
    ? {
        additions: diff.filter((l) => l.type === "added").length,
        deletions: diff.filter((l) => l.type === "removed").length,
        unchanged: diff.filter((l) => l.type === "unchanged").length,
      }
    : null;

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-mega-muted hover:text-mega-accent-light transition-colors mb-6 sm:mb-8"
      >
        ← Back to Tools
      </Link>

      <div className="glass rounded-2xl p-4 sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Text Diff Checker</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-mega-muted">
            Compare two texts and see the differences highlighted line by line.
          </p>
        </div>

        {/* Inputs */}
        <div className="mb-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-mega-muted">
              Original
            </label>
            <textarea
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste the original text here..."
              className="w-full h-48 sm:h-64 rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text placeholder-mega-muted/40 outline-none transition-colors focus:border-mega-accent resize-y"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-mega-muted">
              Modified
            </label>
            <textarea
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              placeholder="Paste the modified text here..."
              className="w-full h-48 sm:h-64 rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text placeholder-mega-muted/40 outline-none transition-colors focus:border-mega-accent resize-y"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Compare button */}
        <div className="mb-4 flex justify-center">
          <button
            onClick={handleCompare}
            disabled={!original && !modified}
            className="w-full sm:w-auto rounded-xl bg-mega-accent px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compare
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-4 flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <span className="rounded-lg bg-green-950/40 px-2 sm:px-3 py-1 text-green-400">
              +{stats.additions} added
            </span>
            <span className="rounded-lg bg-red-950/40 px-2 sm:px-3 py-1 text-red-400">
              -{stats.deletions} removed
            </span>
            <span className="rounded-lg bg-mega-dark/50 px-2 sm:px-3 py-1 text-mega-muted">
              {stats.unchanged} unchanged
            </span>
          </div>
        )}

        {/* Diff output */}
        {diff && (
          <div className="overflow-x-auto rounded-xl border border-mega-border bg-mega-dark/50">
            <pre className="p-3 sm:p-4 text-xs sm:text-sm font-mono leading-relaxed">
              {diff.map((line, i) => (
                <div
                  key={i}
                  className={`px-1 sm:px-2 py-0.5 break-all ${
                    line.type === "added"
                      ? "bg-green-950/40 text-green-400"
                      : line.type === "removed"
                        ? "bg-red-950/40 text-red-400"
                        : "text-mega-text"
                  }`}
                >
                  <span className="mr-1 sm:mr-3 inline-block w-4 sm:w-6 text-right text-mega-muted/50 select-none">
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </span>
                  {line.content}
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
