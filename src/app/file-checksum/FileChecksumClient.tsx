"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface ChecksumResult {
  algo: string;
  hash: string;
  bits: number;
}

const ALGORITHMS = [
  { name: "SHA-256", bits: 256 },
  { name: "SHA-512", bits: 512 },
  { name: "SHA-384", bits: 384 },
  { name: "SHA-1", bits: 160 },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function FileChecksumClient() {
  const [file, setFile] = useState<File | null>(null);
  const [checksums, setChecksums] = useState<ChecksumResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verifyHash, setVerifyHash] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeChecksums = useCallback(async (selectedFile: File) => {
    setIsProcessing(true);
    setError(null);
    setChecksums([]);
    setProgress(10);

    try {
      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsArrayBuffer(selectedFile);
      });

      setProgress(40);

      const results: ChecksumResult[] = [];
      for (let i = 0; i < ALGORITHMS.length; i++) {
        const { name, bits } = ALGORITHMS[i];
        const hashBuf = await crypto.subtle.digest(name, buffer);
        const hashHex = Array.from(new Uint8Array(hashBuf))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        results.push({ algo: name, hash: hashHex, bits });
        setProgress(40 + Math.round(((i + 1) / ALGORITHMS.length) * 60));
      }

      setChecksums(results);
    } catch (err) {
      setError(`Hashing error: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      computeChecksums(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      computeChecksums(dropped);
    }
  };

  const cleanVerify = verifyHash.trim().toLowerCase();
  const matchResult = cleanVerify
    ? checksums.some((c) => c.hash.toLowerCase() === cleanVerify)
    : null;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Selected File:</span>
        <span className="text-accent font-bold truncate max-w-[140px]">
          {file ? file.name : "None"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">File Size:</span>
        <span className="text-text-primary">{file ? formatBytes(file.size) : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Verification:</span>
        <span
          className={`font-bold ${
            matchResult === true
              ? "text-success"
              : matchResult === false
              ? "text-error"
              : "text-text-muted"
          }`}
        >
          {matchResult === true ? "MATCH FOUND" : matchResult === false ? "NO MATCH" : "—"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Privacy:</span>
        <span className="text-success font-bold">100% Local (0 upload)</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="file-checksum" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Upload Dropzone */}
        {!file ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border-subtle hover:border-accent/40 bg-bg-page"
            }`}
          >
            <span className="text-2xl mb-2">📁</span>
            <span className="text-sm font-semibold text-text-primary">
              Drop any file here or click to browse
            </span>
            <span className="text-xs text-text-muted mt-1">
              Supports documents, ISOs, binaries, archives of any size. Never leaves browser.
            </span>
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
        ) : (
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="text-base">📄</span>
              <span className="font-bold text-text-primary truncate">{file.name}</span>
              <span className="text-text-muted">({formatBytes(file.size)})</span>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setChecksums([]);
                setVerifyHash("");
              }}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle shrink-0"
            >
              [Change File]
            </button>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-1 pt-2">
            <div className="h-1.5 w-full rounded-full bg-border-subtle overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>Computing hardware-accelerated cryptographic digests...</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {/* Checksum Results Table */}
        {checksums.length > 0 && (
          <div className="pt-2 border-t border-border-subtle space-y-3">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Calculated Hashes</span>
              <CopyButton
                text={checksums.map((c) => `${c.algo}: ${c.hash}`).join("\n")}
                label="Copy All"
              />
            </div>

            {checksums.map((c) => {
              const isMatch =
                cleanVerify && c.hash.toLowerCase() === cleanVerify;

              return (
                <div
                  key={c.algo}
                  className={`p-3 rounded-lg border transition-colors ${
                    isMatch
                      ? "border-success bg-success/10"
                      : "border-border-subtle bg-bg-page"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-accent">{c.algo}</span>
                      <span className="text-[10px] text-text-muted">({c.bits} bits)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMatch && (
                        <span className="text-[10px] text-success font-bold">✓ EXACT MATCH</span>
                      )}
                      <CopyButton text={c.hash} label="Copy" />
                    </div>
                  </div>
                  <div className="text-xs font-mono text-text-primary break-all">
                    {c.hash}
                  </div>
                </div>
              );
            })}

            {/* Checksum Comparator / Verifier Input */}
            <div className="pt-3 border-t border-border-subtle space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">
                  Compare with Expected Checksum:
                </span>
                {matchResult !== null && (
                  <span
                    className={`font-bold ${
                      matchResult ? "text-success" : "text-error"
                    }`}
                  >
                    {matchResult ? "✓ Checksums Match!" : "✗ Checksum Mismatch"}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={verifyHash}
                onChange={(e) => setVerifyHash(e.target.value)}
                placeholder="Paste expected SHA-256, SHA-512, or SHA-1 hash to verify integrity..."
                className="w-full rounded-lg border border-border-subtle bg-bg-page p-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
