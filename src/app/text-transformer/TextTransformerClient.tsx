"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0",
};

function encodeEntities(text: string): string {
  let out = "";
  for (const ch of text) {
    switch (ch) {
      case "&": out += "&amp;"; break;
      case "<": out += "&lt;"; break;
      case ">": out += "&gt;"; break;
      case '"': out += "&quot;"; break;
      case "'": out += "&#39;"; break;
      default: out += ch;
    }
  }
  return out;
}

function decodeEntities(text: string): string {
  return text.replace(/&([a-zA-Z]+|#\d+|#[xX][0-9a-fA-F]+);/g, (m, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return m;
      try {
        return String.fromCodePoint(code);
      } catch {
        return m;
      }
    }
    const named = NAMED_ENTITIES[body.toLowerCase()];
    return named !== undefined ? named : m;
  });
}

const WORD_RE = /\S+/g;
function words(s: string): number {
  return s.trim() === "" ? 0 : (s.match(WORD_RE) ?? []).length;
}

const SMALL_WORDS = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "if", "in", "nor",
  "of", "on", "or", "per", "the", "to", "v", "v.", "vs", "vs.", "via",
]);

function titleCaseWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function toTitleCase(text: string): string {
  return text.replace(/\S+/g, (word, offset: number) => {
    const lower = word.toLowerCase();
    const before = text.slice(0, offset).replace(/["')\]]+\s*$/, "").trimEnd();
    // Capitalize at start, after sentence punctuation, or mid-token (e.g. after a hyphen)
    if (before === "" || /[:.?!]\s*$/.test(before) || !before.endsWith(" ")) {
      return titleCaseWord(word);
    }
    if (SMALL_WORDS.has(lower) && !/^[a-z]\.$/.test(lower) && lower.length > 1) {
      return word.toLowerCase();
    }
    return titleCaseWord(word);
  });
}

function toSentenceCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^\s*[a-z])|([.!?\n]\s+[a-z])|(["'(]\s*[a-z])/g, (m) => m.toUpperCase());
}

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[ _\-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

type TransformFn = (text: string) => string;

const CASE_TRANSFORMS: Array<{ label: string; fn: TransformFn }> = [
  { label: "UPPERCASE", fn: (t) => t.toUpperCase() },
  { label: "lowercase", fn: (t) => t.toLowerCase() },
  { label: "Title Case", fn: toTitleCase },
  { label: "Sentence case", fn: toSentenceCase },
  {
    label: "camelCase",
    fn: (t) => splitWords(t).map((w, i) => i === 0 ? w.toLowerCase() : titleCaseWord(w)).join(""),
  },
  {
    label: "PascalCase",
    fn: (t) => splitWords(t).map(titleCaseWord).join(""),
  },
  {
    label: "snake_case",
    fn: (t) => splitWords(t).map((w) => w.toLowerCase()).join("_"),
  },
  {
    label: "kebab-case",
    fn: (t) => splitWords(t).map((w) => w.toLowerCase()).join("-"),
  },
  {
    label: "CONSTANT_CASE",
    fn: (t) => splitWords(t).map((w) => w.toUpperCase()).join("_"),
  },
  { label: "reverse", fn: (t) => Array.from(t).reverse().join("") },
];

export default function TextTransformerClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const applyTransform = useCallback((fn: TransformFn) => {
    setOutput(fn(input));
  }, [input]);

  const handleEntityEncode = useCallback(() => applyTransform(encodeEntities), [applyTransform]);
  const handleEntityDecode = useCallback(() => applyTransform(decodeEntities), [applyTransform]);
  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
  }, []);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Chars</p>
        <p className="text-text-primary font-mono">{Array.from(input).length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Words</p>
        <p className="text-text-primary font-mono">{words(input)}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Lines</p>
        <p className="text-text-primary font-mono">{input === "" ? 0 : input.split("\n").length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Output chars</p>
        <p className="text-text-primary font-mono">{Array.from(output).length}</p>
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
              <span className="gradient-text">Text Transformer</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Convert text case and encode or decode HTML entities. Everything stays in your browser.
            </p>
          </div>

          <label htmlFor="tt-input" className="mb-2 block text-sm font-medium text-text-secondary">
            Input text
          </label>
          <textarea
            id="tt-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter or paste text to transform..."
            className="input-field min-h-[120px] resize-y font-mono text-sm"
          />

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-text-muted">
            <span>
              {Array.from(input).length} chars · {words(input)} words ·{" "}
              {input === "" ? 0 : input.split("\n").length} lines
            </span>
            <button
              onClick={handleClear}
              className="shrink-0 rounded border border-border-subtle px-2 py-1 hover:border-error hover:text-error transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-text-secondary">Case transforms</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CASE_TRANSFORMS.map(({ label, fn }) => (
                <button key={label} onClick={() => applyTransform(fn)} className="btn-secondary text-sm py-2 px-3 truncate" title={label}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-text-secondary">HTML entities</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleEntityEncode} className="btn-primary text-sm py-2 px-3">
                Encode (&lt; → &amp;lt;)
              </button>
              <button onClick={handleEntityDecode} className="btn-secondary text-sm py-2 px-3">
                Decode
              </button>
            </div>
            <p className="mt-2 text-xs text-text-muted">
              Encode escapes &amp; &lt; &gt; &quot; &apos;. Decode handles the common named entities plus numeric (&#38;#NN;) and hex (&#38;#xHH;) references.
            </p>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="tt-output" className="block text-sm font-medium text-text-secondary">
                Output
              </label>
              <CopyButton text={output} label="copy" />
            </div>
            <textarea
              id="tt-output"
              readOnly
              value={output}
              placeholder="Result appears here..."
              className="output-field min-h-[120px] resize-y"
            />
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="text-transformer" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        aria-label="Tool info"
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="text-transformer" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
