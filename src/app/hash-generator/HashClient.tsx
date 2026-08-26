"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

async function digestHex(algo: string, bytes: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest(algo, bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function HashClient() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const computeHashes = useCallback(async (text: string) => {
    if (!text) {
      setHashes({});
      return;
    }
    const bytes = new TextEncoder().encode(text);
    const entries = await Promise.all(
      ALGORITHMS.map(async (algo) => [algo, await digestHex(algo, bytes)] as const)
    );
    setHashes(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => computeHashes(input), 150);
    return () => clearTimeout(t);
  }, [input, computeHashes]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Input</p>
        <p className="text-text-primary font-mono">
          {input ? `${new TextEncoder().encode(input).length} B` : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Digests</p>
        <p className="text-text-primary font-mono">{Object.keys(hashes).length}/4</p>
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
              <span className="gradient-text">Hash Generator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Compute SHA hashes from text. Everything stays in your browser.
            </p>
          </div>

          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Input text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="input-field min-h-[120px] resize-y font-mono text-sm"
          />

          <div className="mt-6 space-y-3">
            {ALGORITHMS.map((algo) => (
              <div key={algo} className="flex flex-wrap items-center gap-2">
                <span className="w-20 shrink-0 text-sm font-semibold text-accent">
                  {algo.toLowerCase()}
                </span>
                <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary">
                  {hashes[algo] ?? <span className="text-text-muted">—</span>}
                </code>
                <CopyButton text={hashes[algo] ?? ""} label="copy" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="hash-generator" stats={stats} />
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
        <InfoPanel toolId="hash-generator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
