"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface DiffLine {
  type: "same" | "add" | "del";
  text: string;
  originalNum?: number;
  modifiedNum?: number;
}

function computeDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");

  const m = origLines.length;
  const n = modLines.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origLines[i - 1] === modLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === modLines[j - 1]) {
      result.unshift({
        type: "same",
        text: origLines[i - 1],
        originalNum: i,
        modifiedNum: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: "add",
        text: modLines[j - 1],
        modifiedNum: j,
      });
      j--;
    } else if (i > 0) {
      result.unshift({
        type: "del",
        text: origLines[i - 1],
        originalNum: i,
      });
      i--;
    }
  }

  return result;
}

export default function DiffClient() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [diff, setDiff] = useState<DiffLine[] | null>(null);

  const handleCompare = () => {
    setDiff(computeDiff(original, modified));
  };

  const stats = diff ? (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Additions (+):</span>
        <span className="text-success font-bold">+{diff.filter((d) => d.type === "add").length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Deletions (-):</span>
        <span className="text-error font-bold">-{diff.filter((d) => d.type === "del").length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Unchanged:</span>
        <span className="text-text-primary">{diff.filter((d) => d.type === "same").length} lines</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Lines:</span>
        <span className="text-text-primary">{diff.length}</span>
      </div>
    </div>
  ) : (
    <div className="text-xs font-mono text-text-muted">
      Enter text in both boxes and click Compare to calculate differences.
    </div>
  );

  return (
    <ToolLayout toolId="text-diff" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Input Textareas Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Original Text</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOriginal("");
                    setDiff(null);
                  }}
                  className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
                >
                  [Clear]
                </button>
                <CopyButton text={original} label="Copy" />
              </div>
            </div>
            <textarea
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="Paste original text here..."
              rows={8}
              className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>

          <div className="space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Modified Text</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModified("");
                    setDiff(null);
                  }}
                  className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
                >
                  [Clear]
                </button>
                <CopyButton text={modified} label="Copy" />
              </div>
            </div>
            <textarea
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              placeholder="Paste modified text here..."
              rows={8}
              className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCompare}
            disabled={!original && !modified}
            className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compare Text
          </button>
        </div>

        {/* Diff Output */}
        {diff && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Unified Diff View</span>
              <CopyButton
                text={diff
                  .map((d) => (d.type === "add" ? "+ " : d.type === "del" ? "- " : "  ") + d.text)
                  .join("\n")}
                label="Copy Diff"
              />
            </div>

            <div className="rounded-lg border border-border-subtle bg-bg-page overflow-x-auto text-xs font-mono max-h-96 overflow-y-auto">
              {diff.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex items-start px-3 py-1 ${
                    line.type === "add"
                      ? "bg-success/10 text-success border-l-2 border-success"
                      : line.type === "del"
                      ? "bg-error/10 text-error border-l-2 border-error"
                      : "text-text-secondary"
                  }`}
                >
                  <span className="w-6 shrink-0 text-text-muted text-[10px] select-none">
                    {line.originalNum ?? ""}
                  </span>
                  <span className="w-6 shrink-0 text-text-muted text-[10px] select-none">
                    {line.modifiedNum ?? ""}
                  </span>
                  <span className="w-4 shrink-0 font-bold select-none">
                    {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                  </span>
                  <span className="whitespace-pre-wrap break-all">{line.text || "\u00A0"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
