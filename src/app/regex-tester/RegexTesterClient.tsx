"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

const FLAGS = [
  { flag: "g", desc: "global" },
  { flag: "i", desc: "ignore case" },
  { flag: "m", desc: "multiline" },
  { flag: "s", desc: "dot all" },
  { flag: "u", desc: "unicode" },
] as const;

interface MatchResult {
  index: number;
  match: string;
  groups: (string | undefined)[];
}

export default function RegexTesterClient() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { error, matches } = useMemo(() => {
    if (!pattern || !text) return { error: null as string | null, matches: [] as MatchResult[] };
    let re: RegExp;
    try {
      re = new RegExp(pattern, flags);
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Invalid regex", matches: [] };
    }
    try {
      const out: MatchResult[] = [];
      if (flags.includes("g")) {
        for (const m of text.matchAll(re)) {
          out.push({ index: m.index ?? 0, match: m[0], groups: m.slice(1) });
        }
      } else {
        const m = re.exec(text);
        if (m) out.push({ index: m.index, match: m[0], groups: m.slice(1) });
      }
      return { error: null, matches: out };
    } catch {
      return { error: null, matches: [] };
    }
  }, [pattern, flags, text]);

  // Build highlighted segments manually — no dangerouslySetInnerHTML.
  const segments: Array<{ text: string; hit: boolean }> = useMemo(() => {
    if (!text || error || matches.length === 0) return [{ text, hit: false }];
    const segs: Array<{ text: string; hit: boolean }> = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.index > cursor) segs.push({ text: text.slice(cursor, m.index), hit: false });
      if (m.match) segs.push({ text: m.match, hit: true });
      cursor = m.index + Math.max(m.match.length, 1); // skip empty-match infinite loop
    }
    if (cursor < text.length) segs.push({ text: text.slice(cursor), hit: false });
    return segs;
  }, [text, error, matches]);

  const coveredChars = matches.reduce((n, m) => n + m.match.length, 0);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Matches</p>
        <p className="text-text-primary font-mono">{error ? "—" : matches.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Pattern Length</p>
        <p className="text-text-primary font-mono">{pattern.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Coverage</p>
        <p className="text-text-primary font-mono">
          {text ? `${Math.round((coveredChars / text.length) * 100)}%` : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Flags</p>
        <p className="text-text-primary font-mono">{flags ? `/${flags}` : "—"}</p>
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
              <span className="gradient-text">Regex Tester</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Test regular expressions live. Matches highlight as you type.
            </p>
          </div>

          {/* Pattern input */}
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Regular expression
          </label>
          <div className="flex items-stretch gap-2">
            <div className="flex flex-1 min-w-0 items-center rounded-md border border-border-subtle bg-bg-page focus-within:border-accent transition-colors">
              <span className="pl-3 font-mono text-sm text-text-muted select-none">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="\b\w+@\w+\.\w{2,}\b"
                className="input-field border-0 bg-transparent min-w-0 flex-1 font-mono shadow-none focus:ring-0"
                spellCheck={false}
              />
              <span className="pr-3 font-mono text-sm text-text-muted select-none">
                /{flags}
              </span>
            </div>
          </div>

          {/* Flags checkboxes */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {FLAGS.map(({ flag, desc }) => (
              <label
                key={flag}
                className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                <input
                  type="checkbox"
                  checked={flags.includes(flag)}
                  onChange={(e) =>
                    setFlags((f) =>
                      e.target.checked ? f + flag : f.replace(flag, "")
                    )
                  }
                  className="h-3.5 w-3.5 accent-[#7c3aed]"
                />
                <span className="font-mono font-semibold">{flag}</span>
                <span>{desc}</span>
              </label>
            ))}
          </div>

          {error && (
            <p className="mt-2 text-sm text-error font-mono">⚠ {error}</p>
          )}

          {/* Test text */}
          <label className="mb-2 mt-6 block text-sm font-medium text-text-secondary">
            Test text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type the text to run your regex against..."
            className="input-field min-h-[160px] resize-y font-mono text-sm"
            spellCheck={false}
          />

          {/* Highlighted preview */}
          <div className="mt-4">
            <p className="mb-2 text-xs text-text-muted">Highlighted matches</p>
            <div className="output-field min-h-[60px] whitespace-pre-wrap break-words text-sm leading-relaxed">
              {segments.map((s, i) =>
                s.hit ? (
                  <mark key={i} className="bg-accent text-bg-page rounded-sm">
                    {s.text}
                  </mark>
                ) : (
                  <span key={i}>{s.text}</span>
                )
              )}
            </div>
          </div>

          {/* Matches list */}
          {!error && matches.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs text-text-muted">
                Matches ({matches.length})
              </p>
              <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="rounded border border-border-subtle bg-bg-page px-3 py-2"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-mono text-xs text-text-muted">#{i}</span>
                      <code className="min-w-0 break-all font-mono text-sm text-text-primary">
                        {m.match || <span className="text-text-muted">(empty)</span>}
                      </code>
                      <span className="ml-auto shrink-0 font-mono text-xs text-text-muted">
                        @ {m.index}
                      </span>
                    </div>
                    {m.groups.map((g, gi) => (
                      <div key={gi} className="mt-1 pl-4 text-xs">
                        <span className="font-mono text-accent">[{gi + 1}]</span>{" "}
                        <code className="break-all font-mono text-text-secondary">
                          {g === undefined ? "—" : g || "(empty)"}
                        </code>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="regex-tester" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="regex-tester" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
