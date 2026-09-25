"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build: string[];
  raw: string;
}

// SemVer 2.0.0 strict regex
const SEMVER_REGEX =
  /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

function parseSemVer(version: string): SemVer | null {
  const clean = version.trim();
  const match = clean.match(SEMVER_REGEX);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] ? match[4].split(".") : [],
    build: match[5] ? match[5].split(".") : [],
    raw: clean,
  };
}

function compareSemVer(a: SemVer, b: SemVer): number {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;

  // Normal version has higher precedence than pre-release version
  if (a.prerelease.length === 0 && b.prerelease.length > 0) return 1;
  if (a.prerelease.length > 0 && b.prerelease.length === 0) return -1;
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;

  // Compare pre-release identifiers
  const maxLen = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < maxLen; i++) {
    const pA = a.prerelease[i];
    const pB = b.prerelease[i];

    if (pA === undefined) return -1;
    if (pB === undefined) return 1;
    if (pA === pB) continue;

    const numA = /^\d+$/.test(pA) ? parseInt(pA, 10) : NaN;
    const numB = /^\d+$/.test(pB) ? parseInt(pB, 10) : NaN;

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    if (!isNaN(numA) && isNaN(numB)) return -1;
    if (isNaN(numA) && !isNaN(numB)) return 1;

    return pA.localeCompare(pB);
  }

  return 0;
}

function formatSemVer(v: SemVer): string {
  let str = `${v.major}.${v.minor}.${v.patch}`;
  if (v.prerelease.length > 0) {
    str += `-${v.prerelease.join(".")}`;
  }
  if (v.build.length > 0) {
    str += `+${v.build.join(".")}`;
  }
  return str;
}

function testSingleComparator(version: SemVer, comp: string): boolean {
  const trimmed = comp.trim();
  if (!trimmed || trimmed === "*" || trimmed === "x" || trimmed === "X") return true;

  // Caret ^
  if (trimmed.startsWith("^")) {
    const target = parseSemVer(trimmed.slice(1));
    if (!target) return false;
    if (compareSemVer(version, target) < 0) return false;

    // ^0.0.x: fixed at patch level
    if (target.major === 0 && target.minor === 0) {
      return version.major === 0 && version.minor === 0 && version.patch === target.patch;
    }
    // ^0.x.x: fixed at minor level
    if (target.major === 0) {
      return version.major === 0 && version.minor === target.minor;
    }
    // ^x.x.x: fixed at major level
    return version.major === target.major;
  }

  // Tilde ~
  if (trimmed.startsWith("~")) {
    const target = parseSemVer(trimmed.slice(1));
    if (!target) return false;
    if (compareSemVer(version, target) < 0) return false;
    return version.major === target.major && version.minor === target.minor;
  }

  // Operators >=, <=, >, <, =
  const opMatch = trimmed.match(/^([><]=?|=)\s*(.+)$/);
  if (opMatch) {
    const op = opMatch[1];
    const target = parseSemVer(opMatch[2]);
    if (!target) return false;
    const diff = compareSemVer(version, target);
    if (op === ">=") return diff >= 0;
    if (op === "<=") return diff <= 0;
    if (op === ">") return diff > 0;
    if (op === "<") return diff < 0;
    if (op === "=") return diff === 0;
  }

  // Hyphen range: A - B
  if (trimmed.includes(" - ")) {
    const [fromStr, toStr] = trimmed.split(" - ");
    const from = parseSemVer(fromStr);
    const to = parseSemVer(toStr);
    if (!from || !to) return false;
    return compareSemVer(version, from) >= 0 && compareSemVer(version, to) <= 0;
  }

  // Exact version match
  const exact = parseSemVer(trimmed);
  if (exact) {
    return compareSemVer(version, exact) === 0;
  }

  return false;
}

function testSemVerRange(versionStr: string, rangeStr: string): { satisfied: boolean; explanation: string } {
  const version = parseSemVer(versionStr);
  if (!version) {
    return { satisfied: false, explanation: "Target version is not a valid SemVer format" };
  }

  const trimmedRange = rangeStr.trim();
  if (!trimmedRange) {
    return { satisfied: true, explanation: "Empty range matches all valid versions (*)" };
  }

  // Support logical OR: ||
  const orSets = trimmedRange.split(/\s*\|\|\s*/);
  const matchedSet = orSets.some((orClause) => {
    // AND clauses separated by whitespace
    const andClauses = orClause.trim().split(/\s+(?=[><=~^]|\d)/);
    return andClauses.every((comp) => testSingleComparator(version, comp));
  });

  return {
    satisfied: matchedSet,
    explanation: matchedSet
      ? `Version ${versionStr} satisfies range "${rangeStr}"`
      : `Version ${versionStr} does NOT satisfy range "${rangeStr}"`,
  };
}

export default function SemverCalculatorClient() {
  const [versionInput, setVersionInput] = useState("1.4.2");
  const [rangeInput, setRangeInput] = useState("^1.4.0");

  const [sortListInput, setSortListInput] = useState(
    "2.0.0-rc.1\n1.0.0\n1.2.3\n1.2.0-beta.2\n1.2.0-beta.1\n1.2.0\n0.9.5\n2.0.0"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const parsed = useMemo(() => parseSemVer(versionInput), [versionInput]);
  const rangeResult = useMemo(() => testSemVerRange(versionInput, rangeInput), [versionInput, rangeInput]);

  const sortedList = useMemo(() => {
    const lines = sortListInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const parsedItems = lines
      .map((line) => ({ raw: line, parsed: parseSemVer(line) }))
      .filter((item): item is { raw: string; parsed: SemVer } => item.parsed !== null);

    parsedItems.sort((a, b) => {
      const diff = compareSemVer(a.parsed, b.parsed);
      return sortOrder === "asc" ? diff : -diff;
    });

    return parsedItems.map((item) => item.raw).join("\n");
  }, [sortListInput, sortOrder]);

  const handleBump = (type: "major" | "minor" | "patch" | "alpha" | "beta" | "rc" | "release") => {
    if (!parsed) return;
    const v: SemVer = {
      major: parsed.major,
      minor: parsed.minor,
      patch: parsed.patch,
      prerelease: [...parsed.prerelease],
      build: [],
      raw: "",
    };

    if (type === "major") {
      v.major += 1;
      v.minor = 0;
      v.patch = 0;
      v.prerelease = [];
    } else if (type === "minor") {
      v.minor += 1;
      v.patch = 0;
      v.prerelease = [];
    } else if (type === "patch") {
      v.patch += 1;
      v.prerelease = [];
    } else if (type === "release") {
      v.prerelease = [];
    } else {
      // Pre-release alpha, beta, rc
      if (v.prerelease.length > 0 && v.prerelease[0] === type) {
        const last = v.prerelease[1];
        const nextNum = last && /^\d+$/.test(last) ? parseInt(last, 10) + 1 : 1;
        v.prerelease = [type, nextNum.toString()];
      } else {
        v.prerelease = [type, "1"];
      }
    }

    const nextStr = formatSemVer(v);
    setVersionInput(nextStr);
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Status:</span>
        <span className={parsed ? "text-success font-bold" : "text-error font-bold"}>
          {parsed ? "Valid SemVer 2.0" : "Invalid Syntax"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Range Match:</span>
        <span className={rangeResult.satisfied ? "text-accent font-bold" : "text-warning font-bold"}>
          {rangeResult.satisfied ? "Satisfied" : "Unsatisfied"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Execution:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="semver-calculator" stats={stats}>
      <div className="space-y-6">
        {/* Version Inspector & Bumping Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Version Input & Bumping Panel */}
          <div className="lg:col-span-7 rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Current Version</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVersionInput("1.0.0")}
                  className="text-xs text-text-muted hover:text-accent transition-colors px-2 py-0.5 rounded border border-border-subtle"
                >
                  [Reset 1.0.0]
                </button>
                <CopyButton text={versionInput} label="Copy" />
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={versionInput}
                onChange={(e) => setVersionInput(e.target.value.trim())}
                placeholder="e.g. 1.2.3 or 2.0.0-rc.1"
                className="w-full rounded-lg border border-border-subtle bg-bg-page px-3 py-2 text-sm text-text-primary font-mono focus:border-accent focus:outline-none"
              />
            </div>

            {/* Quick Bump Actions */}
            <div className="space-y-2 pt-2 border-t border-border-subtle/50">
              <span className="text-xs text-text-muted">1-Click Version Bumping:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleBump("major")}
                  disabled={!parsed}
                  className="text-xs px-2.5 py-1 rounded border border-border-subtle bg-bg-page hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
                >
                  [+Major]
                </button>
                <button
                  type="button"
                  onClick={() => handleBump("minor")}
                  disabled={!parsed}
                  className="text-xs px-2.5 py-1 rounded border border-border-subtle bg-bg-page hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
                >
                  [+Minor]
                </button>
                <button
                  type="button"
                  onClick={() => handleBump("patch")}
                  disabled={!parsed}
                  className="text-xs px-2.5 py-1 rounded border border-border-subtle bg-bg-page hover:border-accent hover:text-accent disabled:opacity-40 transition-colors"
                >
                  [+Patch]
                </button>
                <button
                  type="button"
                  onClick={() => handleBump("alpha")}
                  disabled={!parsed}
                  className="text-xs px-2.5 py-1 rounded border border-border-subtle bg-bg-page hover:border-warning hover:text-warning disabled:opacity-40 transition-colors"
                >
                  [+alpha]
                </button>
                <button
                  type="button"
                  onClick={() => handleBump("beta")}
                  disabled={!parsed}
                  className="text-xs px-2.5 py-1 rounded border border-border-subtle bg-bg-page hover:border-warning hover:text-warning disabled:opacity-40 transition-colors"
                >
                  [+beta]
                </button>
                <button
                  type="button"
                  onClick={() => handleBump("rc")}
                  disabled={!parsed}
                  className="text-xs px-2.5 py-1 rounded border border-border-subtle bg-bg-page hover:border-warning hover:text-warning disabled:opacity-40 transition-colors"
                >
                  [+rc]
                </button>
                <button
                  type="button"
                  onClick={() => handleBump("release")}
                  disabled={!parsed || parsed.prerelease.length === 0}
                  className="text-xs px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-success hover:border-success disabled:opacity-40 transition-colors"
                >
                  [Strip Pre-release]
                </button>
              </div>
            </div>
          </div>

          {/* AST Breakdown Panel */}
          <div className="lg:col-span-5 rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 font-mono flex flex-col justify-between">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-accent">SemVer 2.0 Breakdown</span>
              <span className="text-text-muted text-[11px]">{parsed ? "Conforming" : "Invalid"}</span>
            </div>

            {parsed ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border-subtle/50">
                  <span className="text-text-muted">Major (Breaking):</span>
                  <span className="text-accent font-bold">{parsed.major}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle/50">
                  <span className="text-text-muted">Minor (Feature):</span>
                  <span className="text-text-primary font-bold">{parsed.minor}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle/50">
                  <span className="text-text-muted">Patch (Bugfix):</span>
                  <span className="text-text-primary font-bold">{parsed.patch}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle/50">
                  <span className="text-text-muted">Pre-release:</span>
                  <span className="text-warning font-bold">
                    {parsed.prerelease.length > 0 ? parsed.prerelease.join(".") : "none"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Build Metadata:</span>
                  <span className="text-text-muted">
                    {parsed.build.length > 0 ? parsed.build.join(".") : "none"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded border border-error/40 bg-error/10 text-error text-xs">
                ⚠️ Value is not a valid Semantic Version 2.0.0 string.
              </div>
            )}
          </div>
        </div>

        {/* Range Tester Panel */}
        <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">SemVer Range Tester</span>
            <div className="flex items-center gap-1.5">
              {["^1.2.0", "~1.4.0", ">=1.0.0 <2.0.0", "^1.0.0 || ^2.0.0"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRangeInput(preset)}
                  className="text-[11px] px-2 py-0.5 rounded border border-border-subtle bg-bg-page hover:border-accent hover:text-accent transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Range Expression (npm / Cargo / Composer)</label>
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. ^1.2.0, ~2.0.0, >=1.0.0 <2.5.0, or || expressions"
                className="w-full rounded border border-border-subtle bg-bg-page px-3 py-2 text-xs text-text-primary font-mono focus:border-accent focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text-muted">Evaluation Result</label>
              <div
                className={`p-2 rounded border flex items-center justify-between text-xs font-bold ${
                  rangeResult.satisfied
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-error/40 bg-error/10 text-error"
                }`}
              >
                <span>{rangeResult.satisfied ? "✔ MATCHES RANGE" : "✖ DOES NOT MATCH"}</span>
                <span className="text-[11px] font-normal opacity-90">{rangeResult.explanation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Batch SemVer Sorter */}
        <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Multi-Version Precedence Sorter</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="text-xs px-2 py-0.5 rounded border border-border-subtle hover:border-accent hover:text-accent transition-colors"
              >
                [{sortOrder === "desc" ? "Sort: Highest First ↓" : "Sort: Lowest First ↑"}]
              </button>
              <CopyButton text={sortedList} label="Copy Sorted" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">Input Versions (one per line):</label>
              <textarea
                value={sortListInput}
                onChange={(e) => setSortListInput(e.target.value)}
                rows={6}
                className="w-full rounded border border-border-subtle bg-bg-page p-3 text-xs text-text-primary font-mono focus:border-accent focus:outline-none resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">SemVer Precedence Sorted Result:</label>
              <textarea
                readOnly
                value={sortedList}
                rows={6}
                className="w-full rounded border border-border-subtle bg-bg-page p-3 text-xs text-accent font-mono focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
