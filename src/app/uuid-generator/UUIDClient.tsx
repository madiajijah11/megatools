"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

function generateV4(): string {
  return crypto.randomUUID();
}

export default function UUIDClient() {
  const [uuid, setUuid] = useState("");
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkUuids, setBulkUuids] = useState<string[]>([]);
  const [uppercase, setUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);

  const formatUuid = useCallback(
    (id: string) => {
      let result = id;
      if (noHyphens) result = result.replace(/-/g, "");
      if (uppercase) result = result.toUpperCase();
      return result;
    },
    [noHyphens, uppercase]
  );

  const handleGenerateSingle = () => {
    setUuid(formatUuid(generateV4()));
  };

  const handleGenerateBulk = () => {
    const list = Array.from({ length: bulkCount }, () =>
      formatUuid(generateV4())
    );
    setBulkUuids(list);
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">UUID Version:</span>
        <span className="text-accent font-bold">RFC 4122 v4</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Format:</span>
        <span className="text-text-primary">
          {noHyphens ? "Compact (32 hex)" : "Canonical (8-4-4-4-12)"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Casing:</span>
        <span className="text-text-primary">{uppercase ? "UPPERCASE" : "lowercase"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Entropy:</span>
        <span className="text-success font-bold">122 random bits</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="uuid-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Formatting Options */}
        <div className="flex flex-wrap items-center gap-6 pb-3 border-b border-border-subtle text-xs">
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <span>UPPERCASE Output</span>
          </label>
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={noHyphens}
              onChange={(e) => setNoHyphens(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <span>Remove Hyphens (Hex only)</span>
          </label>
        </div>

        {/* Single UUID Generator */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Single UUID v4</span>
            <CopyButton text={uuid} label="Copy UUID" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={uuid || "Click Generate to create UUID..."}
              placeholder="Click Generate to create UUID..."
              className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={handleGenerateSingle}
              className="px-5 py-2.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors shrink-0"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Bulk UUID Generator */}
        <div className="pt-3 border-t border-border-subtle space-y-3">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Bulk UUID Generator</span>
            {bulkUuids.length > 0 && (
              <CopyButton text={bulkUuids.join("\n")} label="Copy All UUIDs" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-text-muted">Quantity:</span>
            {[5, 10, 25, 50, 100].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setBulkCount(count)}
                className={`px-2.5 py-1 rounded border text-xs font-mono transition-colors ${
                  bulkCount === count
                    ? "border-accent text-accent bg-accent/10 font-bold"
                    : "border-border-subtle text-text-secondary hover:text-text-primary"
                }`}
              >
                {count}
              </button>
            ))}
            <button
              type="button"
              onClick={handleGenerateBulk}
              className="ml-auto px-4 py-1.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
            >
              Generate {bulkCount} UUIDs
            </button>
          </div>

          {bulkUuids.length > 0 && (
            <textarea
              readOnly
              value={bulkUuids.join("\n")}
              rows={Math.min(10, bulkUuids.length)}
              className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary focus:outline-none resize-y leading-relaxed"
            />
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
