"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface HashResult {
  algorithm: string;
  hash: string;
  bits: number;
}

const ALGORITHMS = [
  { name: "SHA-256", bits: 256 },
  { name: "SHA-512", bits: 512 },
  { name: "SHA-384", bits: 384 },
  { name: "SHA-1", bits: 160 },
];

async function computeHash(
  algorithm: string,
  data: string
): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest(
    algorithm,
    encoder.encode(data)
  );
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function HashClient() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<HashResult[]>([]);
  const [uppercase, setUppercase] = useState(false);

  const calculateHashes = useCallback(async (text: string) => {
    if (!text) {
      setHashes([]);
      return;
    }

    const results = await Promise.all(
      ALGORITHMS.map(async ({ name, bits }) => {
        const hash = await computeHash(name, text);
        return { algorithm: name, hash, bits };
      })
    );

    setHashes(results);
  }, []);

  useEffect(() => {
    calculateHashes(input);
  }, [input, calculateHashes]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Size:</span>
        <span className="text-text-primary">{input.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Algorithms:</span>
        <span className="text-accent font-bold">4 Web Crypto Ciphers</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Engine:</span>
        <span className="text-success font-bold">Hardware Accelerated</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="hash-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Input Header & Textarea */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Source Text Input</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={uppercase}
                  onChange={(e) => setUppercase(e.target.checked)}
                  className="accent-accent cursor-pointer"
                />
                <span>UPPERCASE Hex</span>
              </label>
              <button
                type="button"
                onClick={() => setInput("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
            </div>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text to compute cryptographic hashes in real-time..."
            rows={5}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Hashes List */}
        <div className="pt-2 border-t border-border-subtle space-y-3">
          {ALGORITHMS.map(({ name, bits }) => {
            const found = hashes.find((h) => h.algorithm === name);
            const val = found
              ? uppercase
                ? found.hash.toUpperCase()
                : found.hash
              : "";

            return (
              <div key={name} className="p-3 rounded-lg border border-border-subtle bg-bg-page space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent">{name}</span>
                    <span className="text-[10px] text-text-muted font-mono">{bits} bits</span>
                  </div>
                  {val && <CopyButton text={val} label="Copy Hash" />}
                </div>

                <div className="font-mono text-xs text-text-primary break-all bg-bg-card p-2 rounded border border-border-subtle/50 min-h-[36px] flex items-center">
                  {val || <span className="text-text-muted italic">Awaiting input...</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToolLayout>
  );
}
