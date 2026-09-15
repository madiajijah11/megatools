"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface MatchResult {
  match: string;
  index: number;
  groups: string[];
}

const FLAGS = ["g", "i", "m", "s", "u"] as const;
type Flag = (typeof FLAGS)[number];

const SAMPLE_PATTERN = "\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b";
const SAMPLE_TEXT = "Contact our security team at security@megatools.dev or developer support at support@megatools.dev for API access.";

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState(SAMPLE_PATTERN);
  const [flags, setFlags] = useState<Set<Flag>>(new Set(["g", "i"]));
  const [text, setText] = useState(SAMPLE_TEXT);

  const toggleFlag = (f: Flag) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const flagStr = useMemo(() => Array.from(flags).join(""), [flags]);

  const { error, matches } = useMemo(() => {
    if (!pattern || !text) return { error: null, matches: [] as MatchResult[] };
    try {
      const re = new RegExp(pattern, flagStr);
      if (!re.global) {
        const m = re.exec(text);
        if (!m) return { error: null, matches: [] };
        return {
          error: null,
          matches: [
            {
              match: m[0],
              index: m.index,
              groups: m.slice(1),
            },
          ],
        };
      }
      const out: MatchResult[] = [];
      let m: RegExpExecArray | null;
      let lastIndex = -1;
      while ((m = re.exec(text)) !== null) {
        if (m.index === lastIndex) {
          re.lastIndex++;
          continue;
        }
        lastIndex = m.index;
        out.push({
          match: m[0],
          index: m.index,
          groups: m.slice(1),
        });
      }
      return { error: null, matches: out };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Invalid regex pattern", matches: [] };
    }
  }, [pattern, flagStr, text]);

  const segments = useMemo(() => {
    if (!text || error || matches.length === 0) return [{ text, hit: false }];
    const out: { text: string; hit: boolean }[] = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.index > cursor) {
        out.push({ text: text.slice(cursor, m.index), hit: false });
      }
      out.push({ text: m.match, hit: true });
      cursor = m.index + m.match.length;
    }
    if (cursor < text.length) {
      out.push({ text: text.slice(cursor), hit: false });
    }
    return out;
  }, [text, error, matches]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Matches:</span>
        <span className="text-accent font-bold">{error ? "—" : matches.length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Active Flags:</span>
        <span className="text-text-primary">/{flagStr || "none"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Syntax:</span>
        <span className={error ? "text-error font-bold" : "text-success font-bold"}>
          {error ? "SYNTAX ERROR" : "VALID REGEX"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="regex-tester" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Pattern Input & Flags */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-primary block">
            Regular Expression Pattern
          </label>
          <div className="flex items-center rounded-lg border border-border-subtle bg-bg-page px-3 py-1 focus-within:border-accent">
            <span className="font-mono text-sm text-text-muted select-none">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g. \b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
              className="w-full bg-transparent border-0 p-2 font-mono text-xs text-text-primary focus:outline-none"
            />
            <span className="font-mono text-sm text-text-muted select-none">/{flagStr}</span>
          </div>

          {/* Flags Toggles */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="text-text-muted">Flags:</span>
            {FLAGS.map((flag) => {
              const checked = flags.has(flag);
              const descriptions: Record<Flag, string> = {
                g: "global",
                i: "ignoreCase",
                m: "multiline",
                s: "dotAll",
                u: "unicode",
              };
              return (
                <label key={flag} className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFlag(flag)}
                    className="accent-accent cursor-pointer"
                  />
                  <span>
                    <strong>{flag}</strong> ({descriptions[flag]})
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            ⚠ {error}
          </div>
        )}

        {/* Test String Input */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Test String Payload</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setText("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
              <CopyButton text={text} label="Copy" />
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter test text to evaluate regex matches..."
            rows={5}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Highlighted Match Visualizer */}
        {!error && text && (
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                Match Highlighting ({matches.length} Matches Found)
              </span>
            </div>
            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto">
              {segments.map((seg, i) =>
                seg.hit ? (
                  <mark
                    key={i}
                    className="rounded bg-accent/25 px-1 py-0.5 font-bold text-accent border border-accent/40"
                  >
                    {seg.text}
                  </mark>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              )}
            </div>
          </div>
        )}

        {/* Captured Groups Breakdown */}
        {!error && matches.length > 0 && (
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <span className="font-semibold text-text-primary text-xs block">
              Capture Groups & Indexes
            </span>
            <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
              {matches.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded border border-border-subtle bg-bg-page flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-text-muted">#{idx + 1}</span>
                    <span className="text-accent font-bold truncate">&quot;{m.match}&quot;</span>
                    <span className="text-[10px] text-text-muted">(pos {m.index})</span>
                  </div>
                  {m.groups.length > 0 && (
                    <span className="text-[10px] text-cyan-300">
                      Groups: [{m.groups.join(", ")}]
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
