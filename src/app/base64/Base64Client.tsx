"use client";

import { useState } from "react";
import Link from "next/link";

type Mode = "encode" | "decode";

export default function Base64Client() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    setError("");
    setOutput("");
    setCopied(false);

    if (!input.trim()) {
      setError("Please enter some text.");
      return;
    }

    try {
      if (mode === "encode") {
        const bytes = new TextEncoder().encode(input);
        const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
        setOutput(btoa(binary));
      } else {
        const binary = atob(input);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        setOutput(new TextDecoder().decode(bytes));
      }
    } catch {
      setError(
        mode === "decode"
          ? "Invalid Base64 string. Check your input."
          : "Encoding failed."
      );
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
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
            <span className="gradient-text">Base64 Encode/Decode</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-mega-muted">
            Encode text to Base64 or decode Base64 back to readable text.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 sm:mb-6 flex justify-center gap-1 rounded-xl border border-mega-border p-1 w-fit mx-auto">
          {(["encode", "decode"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                setOutput("");
                setCopied(false);
              }}
              className={`rounded-lg px-4 sm:px-6 py-2 text-sm font-medium transition-colors capitalize ${
                mode === m
                  ? "bg-mega-accent text-white"
                  : "text-mega-muted hover:text-white"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-mega-muted">
            {mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
          </label>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
              setOutput("");
            }}
            placeholder={
              mode === "encode"
                ? "Enter text to encode..."
                : "Paste Base64 string here..."
            }
            className="w-full h-32 sm:h-48 rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text placeholder-mega-muted/40 outline-none transition-colors focus:border-mega-accent resize-y break-all"
            spellCheck={false}
          />
        </div>

        {/* Convert button */}
        <div className="mb-4 flex justify-center">
          <button
            onClick={handleConvert}
            disabled={!input.trim()}
            className="w-full sm:w-auto rounded-xl bg-mega-accent px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Convert
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-mega-muted">
                {mode === "encode" ? "Encoded Output" : "Decoded Output"}
              </label>
              <button
                onClick={handleCopy}
                className="rounded-xl border border-mega-border px-5 py-2.5 text-sm font-medium text-mega-muted transition-colors hover:border-mega-accent/50 hover:text-white"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              className="w-full h-32 sm:h-48 rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text outline-none resize-y break-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}
