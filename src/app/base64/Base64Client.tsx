"use client";

import { useState } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type Mode = "encode" | "decode";

export default function Base64Client() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleConvert = () => {
    setError("");
    setOutput("");

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

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Input</p>
        <p className="text-text-primary font-mono">{new Blob([input]).size} B</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Output</p>
        <p className="text-text-primary font-mono">{new Blob([output]).size} B</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Ratio</p>
        <p className="text-text-primary font-mono">
          {input.length > 0 && output.length > 0
            ? `${Math.round((output.length / input.length) * 100)}%`
            : "—"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Base64 Encode/Decode</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Encode text to Base64 or decode Base64 back to readable text.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex justify-center gap-1 rounded-xl border border-border-subtle p-1 w-fit mx-auto">
            {(["encode", "decode"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setOutput("");
                }}
                className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors capitalize ${
                  mode === m
                    ? "bg-accent text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-text-secondary">
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
              className="input-field min-h-[120px] sm:min-h-[180px] resize-y"
              spellCheck={false}
            />
          </div>

          {/* Convert button */}
          <div className="mb-4 flex justify-center">
            <button
              onClick={handleConvert}
              disabled={!input.trim()}
              className="btn-primary w-full sm:w-auto px-8"
            >
              Convert
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error text-center">
              {error}
            </div>
          )}

          {/* Output */}
          {output && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">
                  {mode === "encode" ? "Encoded Output" : "Decoded Output"}
                </label>
                <CopyButton text={output} />
              </div>
              <textarea
                value={output}
                readOnly
                className="output-field min-h-[120px] sm:min-h-[180px] resize-y"
              />
            </div>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="base64" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl hover:bg-accent/90 transition-colors"
      >
        💡
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="base64" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
