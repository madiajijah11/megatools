"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const SAMPLE_CODE = `/*! React v19.0.0 | MIT License | https://react.dev */
function createElement(type, props, ...children) {
  return { type, props: { ...props, children } };
}`;

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function SriHashGeneratorClient() {
  const [sourceCode, setSourceCode] = useState(SAMPLE_CODE);
  const [assetUrl, setAssetUrl] = useState("https://cdn.example.com/npm/react@19.0.0/dist/react.production.min.js");
  const [assetType, setAssetType] = useState<"script" | "style">("script");
  const [activeAlgorithm, setActiveAlgorithm] = useState<"sha384" | "sha256" | "sha512">("sha384");

  const [sha256Hash, setSha256Hash] = useState("");
  const [sha384Hash, setSha384Hash] = useState("");
  const [sha512Hash, setSha512Hash] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!sourceCode) {
      setSha256Hash("");
      setSha384Hash("");
      setSha512Hash("");
      return;
    }

    const data = new TextEncoder().encode(sourceCode);

    Promise.all([
      crypto.subtle.digest("SHA-256", data),
      crypto.subtle.digest("SHA-384", data),
      crypto.subtle.digest("SHA-512", data),
    ]).then(([d256, d384, d512]) => {
      setSha256Hash(`sha256-${bufferToBase64(d256)}`);
      setSha384Hash(`sha384-${bufferToBase64(d384)}`);
      setSha512Hash(`sha512-${bufferToBase64(d512)}`);
    });
  }, [sourceCode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".css")) {
      setAssetType("style");
    } else {
      setAssetType("script");
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === "string") {
        setSourceCode(evt.target.result);
      }
    };
    reader.readAsText(file);
  };

  const currentIntegrity = useMemo(() => {
    if (activeAlgorithm === "sha256") return sha256Hash;
    if (activeAlgorithm === "sha512") return sha512Hash;
    return sha384Hash;
  }, [activeAlgorithm, sha256Hash, sha384Hash, sha512Hash]);

  const htmlTag = useMemo(() => {
    if (assetType === "script") {
      return `<script\n  src="${assetUrl}"\n  integrity="${currentIntegrity}"\n  crossorigin="anonymous"\n></script>`;
    }
    return `<link\n  rel="stylesheet"\n  href="${assetUrl}"\n  integrity="${currentIntegrity}"\n  crossorigin="anonymous"\n/>`;
  }, [assetType, assetUrl, currentIntegrity]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Standard</p>
        <p className="text-accent font-mono text-xs font-bold">W3C SRI</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Payload Size</p>
        <p className="text-text-primary font-mono text-xs">{new TextEncoder().encode(sourceCode).length} B</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Subresource Integrity (SRI) Hash Generator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Calculate cryptographic SHA-256 / SHA-384 / SHA-512 hashes to ensure CDN scripts and styles have not been tampered with.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Input Code / File */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                    Source Code / Asset
                  </span>
                  <label className="cursor-pointer text-xs font-mono text-accent hover:text-accent-hover transition-colors">
                    <span>Upload File</span>
                    <input type="file" onChange={handleFileUpload} className="hidden" accept=".js,.css,.txt,.json,.wasm" />
                  </label>
                </div>

                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  placeholder="Paste JavaScript code, CSS stylesheets, or CDN text here..."
                  rows={10}
                  className="w-full p-3 rounded-lg bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Asset CDN URL:</label>
                    <input
                      type="text"
                      value={assetUrl}
                      onChange={(e) => setAssetUrl(e.target.value)}
                      placeholder="https://cdn.example.com/..."
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Asset Tag Type:</label>
                    <select
                      value={assetType}
                      onChange={(e) => setAssetType(e.target.value as "script" | "style")}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value="script">&lt;script src="..."&gt;</option>
                      <option value="style">&lt;link rel="stylesheet" ...&gt;</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Hashes & Generated HTML */}
            <div className="space-y-4">
              {/* Algorithm Hashes */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-3">
                <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider block">
                  Computed SRI Digests
                </span>

                {/* SHA-384 */}
                <div
                  onClick={() => setActiveAlgorithm("sha384")}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeAlgorithm === "sha384"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-bg-card border-border-subtle hover:border-text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-text-primary">
                      SHA-384 <span className="text-[10px] text-accent">(W3C Recommended)</span>
                    </span>
                    <CopyButton text={sha384Hash} />
                  </div>
                  <p className="font-mono text-[11px] break-all select-all text-text-secondary">{sha384Hash || "..."}</p>
                </div>

                {/* SHA-256 */}
                <div
                  onClick={() => setActiveAlgorithm("sha256")}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeAlgorithm === "sha256"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-bg-card border-border-subtle hover:border-text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-text-primary">SHA-256</span>
                    <CopyButton text={sha256Hash} />
                  </div>
                  <p className="font-mono text-[11px] break-all select-all text-text-secondary">{sha256Hash || "..."}</p>
                </div>

                {/* SHA-512 */}
                <div
                  onClick={() => setActiveAlgorithm("sha512")}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    activeAlgorithm === "sha512"
                      ? "bg-accent/10 border-accent text-accent"
                      : "bg-bg-card border-border-subtle hover:border-text-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-text-primary">SHA-512</span>
                    <CopyButton text={sha512Hash} />
                  </div>
                  <p className="font-mono text-[11px] break-all select-all text-text-secondary">{sha512Hash || "..."}</p>
                </div>
              </div>

              {/* Generated HTML Tag */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                    HTML Integration Snippet:
                  </span>
                  <CopyButton text={htmlTag} />
                </div>
                <div className="p-3 bg-bg-card border border-border-subtle rounded font-mono text-[11px] text-text-primary overflow-x-auto">
                  <pre className="whitespace-pre">{htmlTag}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="sri-hash-generator" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="sri-hash-generator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
