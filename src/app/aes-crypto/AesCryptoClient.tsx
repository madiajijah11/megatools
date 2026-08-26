"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const PBKDF2_ITERATIONS = 150000;

async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase) as unknown as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromBase64(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

type Mode = "encrypt" | "decrypt";

export default function AesCryptoClient() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [passphrase, setPassphrase] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleRun = useCallback(async () => {
    if (!passphrase || !input || busy) return;
    setBusy(true);
    setError("");
    setOutput("");
    try {
      if (mode === "encrypt") {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(passphrase, iv);
        const buf = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv as unknown as BufferSource },
          key,
          new TextEncoder().encode(input) as unknown as BufferSource
        );
        setOutput(`${toBase64(iv)}:${toBase64(new Uint8Array(buf))}`);
      } else {
        const parts = input.split(":");
        if (parts.length !== 2) throw new Error("bad format");
        const iv = fromBase64(parts[0].trim());
        if (iv.length !== 12) throw new Error("bad IV");
        const ciphertext = fromBase64(parts[1].trim());
        const key = await deriveKey(passphrase, iv);
        const buf = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: iv as unknown as BufferSource },
          key,
          ciphertext as unknown as BufferSource
        );
        setOutput(new TextDecoder().decode(buf));
      }
    } catch {
      setError("wrong passphrase or corrupted data");
    } finally {
      setBusy(false);
    }
  }, [mode, passphrase, input, busy]);

  const outputBytes = output ? new TextEncoder().encode(output).length : 0;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Mode</p>
        <p className="text-text-primary font-mono capitalize">{mode}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Output Size</p>
        <p className="text-text-primary font-mono">
          {output ? `${outputBytes} B` : "—"}
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
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">AES Encrypt / Decrypt</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              AES-256-GCM with PBKDF2. Everything stays in your browser.
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg border border-border-subtle bg-bg-page p-1">
              {(["encrypt", "decrypt"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setOutput("");
                    setError("");
                  }}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                    mode === m
                      ? "bg-accent text-white font-semibold"
                      : "text-text-secondary hover:text-accent"
                  }`}
                >
                  {m === "encrypt" ? "Encrypt" : "Decrypt"}
                </button>
              ))}
            </div>
          </div>

          {/* Passphrase */}
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Passphrase
          </label>
          <div className="flex gap-2">
            <input
              type={showPass ? "text" : "password"}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase..."
              autoComplete="off"
              className="input-field flex-1 min-w-0 font-mono"
            />
            <button
              onClick={() => setShowPass((s) => !s)}
              className="btn-secondary px-3 text-sm shrink-0"
              aria-label={showPass ? "Hide passphrase" : "Show passphrase"}
            >
              {showPass ? "🙈" : "👁"}
            </button>
          </div>

          {/* Input */}
          <label className="mt-6 mb-2 block text-sm font-medium text-text-secondary">
            {mode === "encrypt" ? "Plaintext" : "Ciphertext (iv:base64)"}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encrypt"
                ? "Enter text to encrypt..."
                : "Paste encrypted string..."
            }
            className="input-field min-h-[120px] resize-y font-mono text-sm break-all"
          />

          <button
            onClick={handleRun}
            disabled={!passphrase || !input || busy}
            className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy
              ? "Working..."
              : mode === "encrypt"
                ? "🔒 Encrypt"
                : "🔓 Decrypt"}
          </button>

          {error && (
            <p className="mt-3 text-sm text-error text-center">{error}</p>
          )}

          {/* Output */}
          {(output || !error) && (
            <>
              <label className="mt-6 mb-2 block text-sm font-medium text-text-secondary">
                Output
              </label>
              <div className="flex items-start gap-2">
                <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary min-h-[42px]">
                  {output || <span className="text-text-muted">—</span>}
                </code>
                <CopyButton text={output} label="copy" />
              </div>
            </>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="aes-crypto" stats={stats} />
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
        <InfoPanel toolId="aes-crypto" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
