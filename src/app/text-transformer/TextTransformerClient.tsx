"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type TransformFn = (text: string) => string;

interface TransformOption {
  label: string;
  fn: TransformFn;
}

const TRANSFORMS: TransformOption[] = [
  { label: "UPPERCASE", fn: (t) => t.toUpperCase() },
  { label: "lowercase", fn: (t) => t.toLowerCase() },
  {
    label: "Title Case",
    fn: (t) =>
      t.replace(
        /\w\S*/g,
        (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase()
      ),
  },
  {
    label: "Sentence case",
    fn: (t) =>
      t.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase()),
  },
  {
    label: "camelCase",
    fn: (t) =>
      t
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
        .replace(/^[^a-zA-Z]+/, ""),
  },
  {
    label: "PascalCase",
    fn: (t) =>
      t
        .toLowerCase()
        .replace(/(^|[^a-zA-Z0-9]+)(.)/g, (_, __, c) => c.toUpperCase()),
  },
  {
    label: "snake_case",
    fn: (t) =>
      t
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, ""),
  },
  {
    label: "kebab-case",
    fn: (t) =>
      t
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
  },
  {
    label: "CONSTANT_CASE",
    fn: (t) =>
      t
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, ""),
  },
  {
    label: "dot.case",
    fn: (t) =>
      t
        .replace(/([a-z])([A-Z])/g, "$1.$2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, ""),
  },
  {
    label: "path/case",
    fn: (t) =>
      t
        .replace(/([a-z])([A-Z])/g, "$1/$2")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "/")
        .replace(/^\/+|\/+$/g, ""),
  },
  {
    label: "aLtErNaTiNg",
    fn: (t) =>
      Array.from(t)
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join(""),
  },
  {
    label: "Slugify",
    fn: (t) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-"),
  },
  {
    label: "Trim whitespace",
    fn: (t) =>
      t
        .split("\n")
        .map((l) => l.trim())
        .join("\n"),
  },
  {
    label: "Remove empty lines",
    fn: (t) =>
      t
        .split("\n")
        .filter((l) => l.trim() !== "")
        .join("\n"),
  },
  { label: "reverse", fn: (t) => Array.from(t).reverse().join("") },
];

export default function TextTransformerClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleTransform = useCallback(
    (fn: TransformFn) => {
      setOutput(fn(input));
    },
    [input]
  );

  const charCount = input.length;
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const lineCount = input ? input.split("\n").length : 0;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Characters:</span>
        <span className="text-accent font-bold">{charCount}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Words:</span>
        <span className="text-text-primary">{wordCount}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Lines:</span>
        <span className="text-text-primary">{lineCount}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Transforms:</span>
        <span className="text-success font-bold">{TRANSFORMS.length} presets</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="text-transformer" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Transform Preset Buttons Grid */}
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2">
            Select Case Transformation
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TRANSFORMS.map((tf) => (
              <button
                key={tf.label}
                type="button"
                onClick={() => handleTransform(tf.fn)}
                disabled={!input}
                className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Source Text</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setOutput("");
                }}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
              <CopyButton text={input} label="Copy" />
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text to transform into camelCase, snake_case, Title Case, UPPERCASE, etc..."
            rows={7}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Output Textarea */}
        {output && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Transformed Output</span>
              <CopyButton text={output} label="Copy Output" />
            </div>
            <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
