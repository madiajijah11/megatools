"use client";

import { useState } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const statPanel = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Additions</p>
        <p className="text-success font-mono">{stats ? `+${stats.additions}` : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Deletions</p>
        <p className="text-error font-mono">{stats ? `-${stats.deletions}` : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Unchanged</p>
        <p className="text-text-primary font-mono">{stats ? stats.unchanged : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Total</p>
        <p className="text-text-primary font-mono">{stats ? stats.additions + stats.deletions + stats.unchanged : "—"}</p>
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
              <span className="gradient-text">Text Diff Checker</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Compare two texts and see the differences highlighted line by line.
            </p>
          </div>

          {/* Inputs */}
          <div className="mb-4 grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Original
              </label>
              <textarea
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="Paste the original text here..."
                className="input-field min-h-[200px] sm:min-h-[260px] resize-y font-mono text-sm"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Modified
              </label>
              <textarea
                value={modified}
                onChange={(e) => setModified(e.target.value)}
                placeholder="Paste the modified text here..."
                className="input-field min-h-[200px] sm:min-h-[260px] resize-y font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Compare button */}
          <div className="mb-4 flex justify-center">
            <button
              onClick={handleCompare}
              disabled={!original && !modified}
              className="btn-primary w-full sm:w-auto px-8"
            >
              Compare
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mb-4 flex flex-wrap justify-center gap-4 text-sm">
              <span className="rounded-lg bg-success/10 px-3 py-1 text-success">
                +{stats.additions} added
              </span>
              <span className="rounded-lg bg-error/10 px-3 py-1 text-error">
                -{stats.deletions} removed
              </span>
              <span className="rounded-lg bg-bg-page px-3 py-1 text-text-muted">
                {stats.unchanged} unchanged
              </span>
            </div>
          )}

          {/* Diff output */}
          {diff && (
            <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-page">
              <pre className="p-4 text-sm font-mono leading-relaxed">
                {diff.map((line, i) => (
                  <div
                    key={i}
                    className={`px-2 py-0.5 break-all ${
                      line.type === "added"
                        ? "bg-success/10 text-success"
                        : line.type === "removed"
                          ? "bg-error/10 text-error"
                          : "text-text-primary"
                    }`}
                  >
                    <span className="mr-3 inline-block w-6 text-right text-text-muted select-none">
                      {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                    </span>
                    {line.content}
                  </div>
                ))}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="text-diff" stats={statPanel} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl hover:bg-accent/90 transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="text-diff" stats={statPanel} />
      </MobileInfoDrawer>
    </div>
  );
}
