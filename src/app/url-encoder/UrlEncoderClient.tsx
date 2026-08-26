"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type Mode = "encode" | "decode";
type Variant = "component" | "full";

const VARIANTS: Record<Variant, { encode: string; decode: string; label: string }> = {
  component: {
    encode: "encodeURIComponent",
    decode: "decodeURIComponent",
    label: "Component (encodeURIComponent)",
  },
  full: {
    encode: "encodeURI",
    decode: "decodeURI",
    label: "Full URI (encodeURI)",
  },
};

export default function UrlEncoderClient() {
  const [mode, setMode] = useState<Mode>("encode");
  const [variant, setVariant] = useState<Variant>("component");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const convert = useCallback((text: string, m: Mode, v: Variant) => {
    setError("");
    if (!text) {
      setOutput("");
      return;
    }
    try {
      const result =
        m === "encode"
          ? v === "component"
            ? encodeURIComponent(text)
            : encodeURI(text)
          : v === "component"
            ? decodeURIComponent(text)
            : decodeURI(text);
      setOutput(result);
    } catch {
      setOutput("");
      if (m === "decode") setError("invalid encoding");
    }
  }, []);

  // Live convert, debounced 150ms
  useEffect(() => {
    const t = setTimeout(() => convert(input, mode, variant), 150);
    return () => clearTimeout(t);
  }, [input, mode, variant, convert]);

  const delta = output.length - input.length;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Input</p>
        <p className="text-text-primary font-mono">{input.length} chars</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Output</p>
        <p className="text-text-primary font-mono">
          {error ? "—" : `${output.length} chars`}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Delta</p>
        <p className={`font-mono ${delta > 0 ? "text-warning" : delta < 0 ? "text-success" : "text-text-primary"}`}>
          {input && !error ? (delta > 0 ? `+${delta}` : delta) : "—"}
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
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">URL Encoder/Decoder</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Encode special characters for URLs or decode percent-encoded strings.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-4 flex justify-center gap-1 rounded-xl border border-border-subtle p-1 w-fit mx-auto">
            {(["encode", "decode"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
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

          {/* Function select */}
          <div className="mb-6 flex justify-center">
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value as Variant)}
              className="input-field w-fit cursor-pointer font-mono text-sm"
            >
              {(Object.keys(VARIANTS) as Variant[]).map((v) => (
                <option key={v} value={v}>
                  {mode === "encode" ? VARIANTS[v].encode : VARIANTS[v].decode}
                </option>
              ))}
            </select>
          </div>

          {/* Input */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              {mode === "encode" ? "Text to Encode" : "Encoded URL to Decode"}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "Enter text or URL to encode..."
                  : "Paste percent-encoded string here..."
              }
              className="input-field min-h-[120px] sm:min-h-[180px] resize-y font-mono text-sm"
              spellCheck={false}
            />
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
          <InfoPanel toolId="url-encoder" stats={stats} />
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
        <InfoPanel toolId="url-encoder" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
