"use client";

import { useState } from "react";
import Link from "next/link";

type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export default function JSONClient() {
  const [input, setInput] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    setValidation(null);
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setValidation({ valid: false, error: (err as Error).message });
    }
  };

  const handleMinify = () => {
    setValidation(null);
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
    } catch (err) {
      setValidation({ valid: false, error: (err as Error).message });
    }
  };

  const handleValidate = () => {
    try {
      JSON.parse(input);
      setValidation({ valid: true });
    } catch (err) {
      setValidation({ valid: false, error: (err as Error).message });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <span className="gradient-text">JSON Formatter</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-mega-muted">
            Format, minify, and validate JSON data instantly in your browser.
          </p>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-mega-muted">
            JSON Input
          </label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setValidation(null);
            }}
            placeholder='{"key": "value"}'
            className="w-full h-48 sm:h-80 rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text placeholder-mega-muted/40 outline-none transition-colors focus:border-mega-accent resize-y break-all"
            spellCheck={false}
          />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:justify-center gap-2 sm:gap-3">
          <button
            onClick={handleFormat}
            disabled={!input}
            className="rounded-xl bg-mega-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Format
          </button>
          <button
            onClick={handleMinify}
            disabled={!input}
            className="rounded-xl bg-mega-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Minify
          </button>
          <button
            onClick={handleValidate}
            disabled={!input}
            className="rounded-xl bg-mega-accent px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Validate
          </button>
          <button
            onClick={handleCopy}
            disabled={!input}
            className="rounded-xl border border-mega-border px-6 py-2.5 text-sm font-medium text-mega-muted transition-colors hover:border-mega-accent/50 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Validation result */}
        {validation && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm text-center ${
              validation.valid
                ? "border-green-800 bg-green-950/40 text-green-400"
                : "border-red-800 bg-red-950/40 text-red-400"
            }`}
          >
            {validation.valid ? (
              "Valid JSON"
            ) : (
              <>
                <span className="font-medium">Invalid JSON:</span>{" "}
                {validation.error}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
