"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Single</p>
        <p className="text-text-primary font-mono">
          {singleUUID ? "Ready" : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Bulk Count</p>
        <p className="text-text-primary font-mono">{bulkUUIDs ? bulkUUIDs.split("\n").length : "—"}</p>
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
              <span className="gradient-text">UUID Generator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Generate UUID v4 identifiers instantly. One click to copy.
            </p>
          </div>

          {/* Single UUID */}
          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Generated UUID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={singleUUID}
                readOnly
                placeholder="Click Generate..."
                className="input-field flex-1 min-w-0 font-mono"
              />
              <button
                onClick={handleCopySingle}
                disabled={!singleUUID}
                className="btn-secondary shrink-0 px-5"
              >
                {copied === "single" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleGenerateSingle}
                className="btn-primary w-full sm:w-auto px-8"
              >
                Generate New
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-8 border-t border-border-subtle" />

          {/* Bulk generate */}
          <div>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Bulk Generate
            </label>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <label className="text-sm text-text-secondary">Count:</label>
              <input
                type="number"
                min={1}
                max={100}
                value={bulkCount}
                onChange={(e) => setBulkCount(Number(e.target.value))}
                className="input-field w-24"
              />
              <button
                onClick={handleGenerateBulk}
                className="btn-primary px-6"
              >
                Generate
              </button>
              <button
                onClick={handleCopyBulk}
                disabled={!bulkUUIDs}
                className="btn-secondary px-5"
              >
                {copied === "bulk" ? "Copied!" : "Copy All"}
              </button>
            </div>
            <textarea
              value={bulkUUIDs}
              readOnly
              placeholder="Generated UUIDs will appear here..."
              className="input-field min-h-[200px] sm:min-h-[260px] resize-y font-mono text-sm"
            />
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="uuid-generator" stats={stats} />
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
        <InfoPanel toolId="uuid-generator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
