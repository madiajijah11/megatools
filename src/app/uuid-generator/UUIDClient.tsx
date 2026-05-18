"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

function generateUUIDs(count: number): string[] {
  const uuids: string[] = [];
  for (let i = 0; i < count; i++) {
    uuids.push(crypto.randomUUID());
  }
  return uuids;
}

export default function UUIDClient() {
  const [singleUUID, setSingleUUID] = useState("");
  const [bulkCount, setBulkCount] = useState(10);
  const [bulkUUIDs, setBulkUUIDs] = useState("");
  const [copied, setCopied] = useState<"single" | "bulk" | null>(null);

  const handleGenerateSingle = useCallback(() => {
    setSingleUUID(crypto.randomUUID());
    setCopied(null);
  }, []);

  const handleGenerateBulk = useCallback(() => {
    const count = Math.min(Math.max(bulkCount, 1), 100);
    const uuids = generateUUIDs(count);
    setBulkUUIDs(uuids.join("\n"));
    setCopied(null);
  }, [bulkCount]);

  const handleCopySingle = async () => {
    if (!singleUUID) return;
    await navigator.clipboard.writeText(singleUUID);
    setCopied("single");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCopyBulk = async () => {
    if (!bulkUUIDs) return;
    await navigator.clipboard.writeText(bulkUUIDs);
    setCopied("bulk");
    setTimeout(() => setCopied(null), 2000);
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
            <span className="gradient-text">UUID Generator</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-mega-muted">
            Generate UUID v4 identifiers instantly. One click to copy.
          </p>
        </div>

        {/* Single UUID */}
        <div className="mb-6 sm:mb-8">
          <label className="mb-2 block text-sm font-medium text-mega-muted">
            Generated UUID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={singleUUID}
              readOnly
              placeholder="Click Generate..."
              className="flex-1 min-w-0 rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text placeholder-mega-muted/40 outline-none break-all"
            />
            <button
              onClick={handleCopySingle}
              disabled={!singleUUID}
              className="shrink-0 rounded-xl border border-mega-border px-4 sm:px-5 py-2.5 text-sm font-medium text-mega-muted transition-colors hover:border-mega-accent/50 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied === "single" ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="mt-3 flex justify-center">
            <button
              onClick={handleGenerateSingle}
              className="w-full sm:w-auto rounded-xl bg-mega-accent px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light"
            >
              Generate New
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-8 border-t border-mega-border" />

        {/* Bulk generate */}
        <div>
          <label className="mb-2 block text-sm font-medium text-mega-muted">
            Bulk Generate
          </label>
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="text-sm text-mega-muted">Count:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={bulkCount}
              onChange={(e) => setBulkCount(Number(e.target.value))}
              className="w-20 sm:w-24 rounded-xl border border-mega-border bg-mega-dark/50 px-3 sm:px-4 py-2.5 text-sm text-mega-text outline-none focus:border-mega-accent"
            />
            <button
              onClick={handleGenerateBulk}
              className="rounded-xl bg-mega-accent px-5 sm:px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light"
            >
              Generate
            </button>
            <button
              onClick={handleCopyBulk}
              disabled={!bulkUUIDs}
              className="rounded-xl border border-mega-border px-4 sm:px-5 py-2.5 text-sm font-medium text-mega-muted transition-colors hover:border-mega-accent/50 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied === "bulk" ? "Copied!" : "Copy All"}
            </button>
          </div>
          <textarea
            value={bulkUUIDs}
            readOnly
            placeholder="Generated UUIDs will appear here..."
            className="w-full h-48 sm:h-64 rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text placeholder-mega-muted/40 outline-none resize-y"
          />
        </div>
      </div>
    </div>
  );
}
