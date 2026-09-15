"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Mode = "encode" | "decode";
type Method = "component" | "full";

export default function UrlEncoderClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [method, setMethod] = useState<Method>("component");
  const [error, setError] = useState("");

  const transform = useCallback(
    (text: string, m: Mode, meth: Method) => {
      if (!text) {
        setOutput("");
        setError("");
        return;
      }
      try {
        setError("");
        if (m === "encode") {
          setOutput(meth === "component" ? encodeURIComponent(text) : encodeURI(text));
        } else {
          setOutput(meth === "component" ? decodeURIComponent(text) : decodeURI(text));
        }
      } catch {
        setOutput("");
        if (m === "decode") setError("Invalid percent-encoding sequence detected.");
      }
    },
    []
  );

  useEffect(() => {
    transform(input, mode, method);
  }, [input, mode, method, transform]);

  const delta = output.length - input.length;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Mode:</span>
        <span className="text-accent font-bold uppercase">{mode} ({method})</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Length:</span>
        <span className="text-text-primary">{input.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Output Length:</span>
        <span className="text-text-primary">{error ? "—" : `${output.length} chars`}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Delta:</span>
        <span className={delta > 0 ? "text-warning font-bold" : delta < 0 ? "text-success font-bold" : "text-text-primary"}>
          {input && !error ? (delta > 0 ? `+${delta}` : delta) : "—"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="url-encoder" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Mode Selector & Encoding Scope */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 p-1 bg-bg-page rounded-lg border border-border-subtle text-xs">
            {(["encode", "decode"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded font-bold transition-colors capitalize ${
                  mode === m ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Scope:</span>
            <button
              type="button"
              onClick={() => setMethod("component")}
              className={`px-2 py-0.5 rounded border transition-colors ${
                method === "component"
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border-subtle text-text-muted hover:text-text-secondary"
              }`}
            >
              encodeURIComponent (Query / Value)
            </button>
            <button
              type="button"
              onClick={() => setMethod("full")}
              className={`px-2 py-0.5 rounded border transition-colors ${
                method === "full"
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border-subtle text-text-muted hover:text-text-secondary"
              }`}
            >
              encodeURI (Full URL)
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">
              {mode === "encode" ? "Raw String Input" : "Encoded URL Input"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setError("");
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
            placeholder={
              mode === "encode"
                ? "Enter special characters or query string, e.g. hello world & foo=bar..."
                : "Enter percent-encoded string, e.g. hello%20world%20%26%20foo%3Dbar..."
            }
            rows={6}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                {mode === "encode" ? "Percent-Encoded Output" : "Decoded Plaintext"}
              </span>
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
