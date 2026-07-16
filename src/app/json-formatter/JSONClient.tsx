"use client";

import { useState } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export default function JSONClient() {
  const [input, setInput] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const lines = input ? input.split("\n").length : 0;
  const chars = input.length;
  const isValid =
    validation !== null && input
      ? (() => {
          try {
            JSON.parse(input);
            return true;
          } catch {
            return false;
          }
        })()
      : null;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Lines</p>
        <p className="text-text-primary font-mono">{lines}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Characters</p>
        <p className="text-text-primary font-mono">{chars}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Valid</p>
        <p className="font-mono text-success">
          {isValid === true ? "Yes" : isValid === false ? "No" : "—"}
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
              <span className="gradient-text">JSON Formatter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Format, minify, and validate JSON data instantly in your browser.
            </p>
          </div>

          {/* Textarea */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              JSON Input
            </label>
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setValidation(null);
              }}
              placeholder='{"key": "value"}'
              className="input-field min-h-[200px] sm:min-h-[320px] resize-y font-mono text-sm"
              spellCheck={false}
            />
          </div>

          {/* Buttons */}
          <div className="mb-4 flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              onClick={handleFormat}
              disabled={!input}
              className="btn-primary px-6"
            >
              Format
            </button>
            <button
              onClick={handleMinify}
              disabled={!input}
              className="btn-secondary px-6"
            >
              Minify
            </button>
            <button
              onClick={handleValidate}
              disabled={!input}
              className="btn-secondary px-6"
            >
              Validate
            </button>
            {input && <CopyButton text={input} label="Copy" />}
          </div>

          {/* Validation result */}
          {validation && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm text-center ${
                validation.valid
                  ? "border-success/30 bg-success/5 text-success"
                  : "border-error/30 bg-error/5 text-error"
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

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="json-formatter" stats={stats} />
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
        <InfoPanel toolId="json-formatter" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
