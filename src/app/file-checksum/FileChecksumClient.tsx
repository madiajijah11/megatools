"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const ALGORITHMS = ["SHA-256", "SHA-512", "SHA-384", "SHA-1"] as const;

async function digestHex(algo: string, buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest(algo, buf as unknown as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function FileChecksumClient() {
  const [file, setFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<number>(0);
  const [hashing, setHashing] = useState(false);
  const [verifyInput, setVerifyInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hashFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setHashes({});
    setError(null);
    setHashing(true);
    setProgress(10);

    try {
      // Read file with progress
      const reader = new FileReader();

      const bufferPromise = new Promise<ArrayBuffer>((resolve, reject) => {
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 60) + 10;
            setProgress(pct);
          }
        };
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(new Error("Failed to read file"));
      });

      reader.readAsArrayBuffer(selectedFile);
      const buffer = await bufferPromise;

      setProgress(75);

      // Compute all digests
      const results: Record<string, string> = {};
      for (const algo of ALGORITHMS) {
        results[algo] = await digestHex(algo, buffer);
      }

      setHashes(results);
      setProgress(100);
    } catch (err) {
      setError(`Hashing error: ${(err as Error).message}`);
    } finally {
      setHashing(false);
    }
  }, []);

  const clean = verifyInput.trim().toLowerCase();
  let matchStatus: { match: boolean; algo: string | null } | null = null;
  if (clean) {
    matchStatus = { match: false, algo: null };
    for (const [algo, hashVal] of Object.entries(hashes)) {
      if (hashVal.toLowerCase() === clean) {
        matchStatus = { match: true, algo };
        break;
      }
    }
  }

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">File Size</p>
        <p className="text-text-primary font-mono">
          {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "—"}
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
              <span className="gradient-text">Large File Hasher</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Calculate SHA-256, SHA-512, and SHA-1 checksums directly in your browser.
            </p>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) hashFile(f);
              }}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-8 text-center transition-colors ${
                dragOver
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle bg-bg-page hover:border-accent"
              }`}
            >
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) hashFile(f);
                }}
              />
              <span className="font-mono text-sm text-text-secondary">
                $ drop any file here to calculate hashes
              </span>
              <span className="text-xs text-text-muted">
                100% in-browser Web Crypto · Zero server uploads
              </span>
            </label>
          ) : (
            <div className="space-y-6">
              {/* Selected file */}
              <div className="flex items-center justify-between rounded border border-border-subtle bg-bg-page p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-text-primary">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB ({file.size.toLocaleString()} bytes)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setHashes({});
                    setVerifyInput("");
                  }}
                  className="btn-secondary text-xs shrink-0"
                >
                  Hash Another File
                </button>
              </div>

              {/* Progress Bar */}
              {hashing && (
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between text-text-secondary">
                    <span>$ computing cryptographic digests...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-bg-page border border-border-subtle">
                    <div
                      className="h-full bg-accent transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Checksum List */}
              {Object.keys(hashes).length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {ALGORITHMS.map((algo) => (
                      <div key={algo} className="space-y-1">
                        <span className="text-xs font-semibold text-accent font-mono">
                          {algo.toLowerCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs font-mono text-text-primary">
                            {hashes[algo]}
                          </code>
                          <CopyButton text={hashes[algo]} label="copy" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hash Integrity Verifier */}
                  <div className="rounded border border-border-subtle bg-bg-page p-4 space-y-3">
                    <label className="text-xs font-semibold text-text-muted uppercase block">
                      Verify Checksum Integrity
                    </label>
                    <input
                      type="text"
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      placeholder="Paste expected SHA-256, SHA-512, or SHA-1 hash to compare..."
                      className="input-field text-xs font-mono"
                    />

                    {matchStatus && (
                      <div
                        className={`rounded p-2 text-xs font-mono text-center font-semibold ${
                          matchStatus.match
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-error/15 text-error border border-error/30"
                        }`}
                      >
                        {matchStatus.match
                          ? `✓ MATCH VERIFIED (${matchStatus.algo})`
                          : "✕ CHECKSUM MISMATCH (File may be altered or corrupted)"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-error text-center">{error}</p>}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="file-checksum" stats={stats} />
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
        <InfoPanel toolId="file-checksum" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
