"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Mode = "encode" | "decode";

export default function Base64Client() {
  const [mode, setMode] = useState<Mode>("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [urlSafe, setUrlSafe] = useState(false);
  const [error, setError] = useState("");

  const handleConvert = () => {
    setError("");
    if (!input.trim()) {
      setError("Please enter some text to process.");
      return;
    }

    try {
      if (mode === "encode") {
        const encoded = btoa(
          encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1) =>
            String.fromCharCode(parseInt(p1, 16))
          )
        );
        setOutput(
          urlSafe
            ? encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
            : encoded
        );
      } else {
        let normalized = input.trim();
        if (urlSafe) {
          normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
          while (normalized.length % 4) normalized += "=";
        }
        const decoded = decodeURIComponent(
          Array.from(atob(normalized))
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        setOutput(decoded);
      }
    } catch {
      setError(
        mode === "decode"
          ? "Invalid Base64 input string."
          : "Encoding failed."
      );
    }
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Current Mode:</span>
        <span className="text-accent font-bold uppercase">{mode}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Size:</span>
        <span className="text-text-primary">{input.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Output Size:</span>
        <span className="text-text-primary">{output ? `${output.length} chars` : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Ratio:</span>
        <span className="text-text-primary">
          {input.length && output.length
            ? `${Math.round((output.length / input.length) * 100)}%`
            : "—"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="base64" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Mode Selector & Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 p-1 bg-bg-page rounded-lg border border-border-subtle">
            {(["encode", "decode"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setOutput("");
                  setError("");
                }}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors capitalize ${
                  mode === m
                    ? "bg-accent text-bg-page"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <span>URL-Safe Base64 (RFC 4648)</span>
          </label>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">
              {mode === "encode" ? "Plaintext Input" : "Base64 Input"}
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
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder={
              mode === "encode"
                ? "Enter UTF-8 plaintext to encode..."
                : "Paste Base64 string to decode..."
            }
            rows={6}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Convert Action */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleConvert}
            disabled={!input.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {mode === "encode" ? "Encode to Base64" : "Decode from Base64"}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Output Area */}
        {output && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                {mode === "encode" ? "Base64 Result" : "Decoded Plaintext"}
              </span>
              <CopyButton text={output} label="Copy Result" />
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
