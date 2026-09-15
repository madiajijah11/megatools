"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type IndentSize = 2 | 4 | "tab";

export default function JSONClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<IndentSize>(2);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<
    | null
    | { valid: true; keys: number; depth: number }
    | { valid: false; error: string }
  >(null);

  const getIndent = () => (indent === "tab" ? "\t" : indent);

  const handleFormat = () => {
    setError("");
    setValidation(null);
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, getIndent()));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleMinify = () => {
    setError("");
    setValidation(null);
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getDepth = (obj: unknown, current = 0): number => {
    if (typeof obj !== "object" || obj === null) return current;
    const values = Object.values(obj);
    if (values.length === 0) return current + 1;
    return Math.max(...values.map((v) => getDepth(v, current + 1)));
  };

  const getKeyCount = (obj: unknown): number => {
    if (typeof obj !== "object" || obj === null) return 0;
    const keys = Object.keys(obj);
    return (
      keys.length +
      Object.values(obj).reduce<number>((acc, v) => acc + getKeyCount(v), 0)
    );
  };

  const handleValidate = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setValidation({
        valid: true,
        keys: getKeyCount(parsed),
        depth: getDepth(parsed),
      });
    } catch (err) {
      setValidation({ valid: false, error: (err as Error).message });
    }
  };

  const isValid =
    validation?.valid === true
      ? true
      : validation?.valid === false || error
      ? false
      : null;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Size:</span>
        <span className="text-text-primary">{input.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Output Size:</span>
        <span className="text-text-primary">{output ? `${output.length} chars` : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">JSON Validation:</span>
        <span className={isValid === true ? "text-success font-bold" : isValid === false ? "text-error font-bold" : "text-text-muted"}>
          {isValid === true ? "VALID" : isValid === false ? "INVALID" : "—"}
        </span>
      </div>
      {validation && "keys" in validation && (
        <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
          <span className="text-text-muted">Structure:</span>
          <span className="text-accent font-bold">{validation.keys} keys · depth {validation.depth}</span>
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout toolId="json-formatter" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <button
              onClick={handleFormat}
              disabled={!input.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Format
            </button>
            <button
              onClick={handleMinify}
              disabled={!input.trim()}
              className="px-3.5 py-1.5 rounded-lg border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Minify
            </button>
            <button
              onClick={handleValidate}
              disabled={!input.trim()}
              className="px-3.5 py-1.5 rounded-lg border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Validate
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Indent:</span>
            {([2, 4, "tab"] as IndentSize[]).map((size) => (
              <button
                key={String(size)}
                onClick={() => setIndent(size)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  indent === size
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border-subtle text-text-muted hover:text-text-secondary"
                }`}
              >
                {size === "tab" ? "Tab" : `${size} spaces`}
              </button>
            ))}
          </div>
        </div>

        {/* Input Header & Textarea */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Input JSON</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setError("");
                  setValidation(null);
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
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
              setValidation(null);
            }}
            placeholder='Paste raw JSON here, e.g. {"name":"MegaTools","clientSide":true}'
            rows={8}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            <span className="font-bold block mb-0.5">Parse Error:</span>
            {error}
          </div>
        )}

        {/* Validation Notification */}
        {validation && (
          <div
            className={`p-3 rounded-lg border text-xs ${
              validation.valid
                ? "border-success/30 bg-success/10 text-success"
                : "border-error/30 bg-error/10 text-error"
            }`}
          >
            {validation.valid ? (
              <span>✓ Valid JSON — {validation.keys} total keys, max depth of {validation.depth}.</span>
            ) : (
              <span>✗ Invalid JSON — {validation.error}</span>
            )}
          </div>
        )}

        {/* Output Area */}
        {output && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Formatted JSON Result</span>
              <CopyButton text={output} label="Copy Result" />
            </div>
            <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-80 overflow-y-auto leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
