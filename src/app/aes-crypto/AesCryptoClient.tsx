"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Mode = "encrypt" | "decrypt";

async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(buf: Uint8Array): string {
  let str = "";
  for (let i = 0; i < buf.length; i++) str += String.fromCharCode(buf[i]);
  return btoa(str);
}

function fromBase64(b64: string): Uint8Array {
  const str = atob(b64);
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i);
  return buf;
}

export default function AesCryptoClient() {
  const [mode, setMode] = useState<Mode>("encrypt");
  const [passphrase, setPassphrase] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleProcess = useCallback(async () => {
    if (busy) return;
    if (!passphrase) {
      setError("Please provide a passphrase.");
      return;
    }
    if (!input) {
      setError("Please provide input text.");
      return;
    }

    setBusy(true);
    setError("");
    setOutput("");
    try {
      if (mode === "encrypt") {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await deriveKey(passphrase, salt);
        const enc = new TextEncoder();
        const encrypted = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          key,
          enc.encode(input)
        );

        const full = new Uint8Array(
          salt.length + iv.length + encrypted.byteLength
        );
        full.set(salt, 0);
        full.set(iv, salt.length);
        full.set(new Uint8Array(encrypted), salt.length + iv.length);

        setOutput(toBase64(full));
      } else {
        const full = fromBase64(input.trim());
        if (full.length < 16 + 12 + 16) {
          throw new Error("Ciphertext too short or invalid.");
        }
        const salt = full.slice(0, 16);
        const iv = full.slice(16, 28);
        const data = full.slice(28);

        const key = await deriveKey(passphrase, salt);
        const decrypted = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key,
          data
        );
        const dec = new TextDecoder();
        setOutput(dec.decode(decrypted));
      }
    } catch {
      setError("Decryption failed — incorrect passphrase or corrupted ciphertext.");
    } finally {
      setBusy(false);
    }
  }, [mode, passphrase, input, busy]);

  const outputBytes = output ? new TextEncoder().encode(output).length : 0;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Algorithm:</span>
        <span className="text-accent font-bold">AES-256-GCM</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">KDF:</span>
        <span className="text-text-primary">PBKDF2 (100k rounds)</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Size:</span>
        <span className="text-text-primary">{input.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Output Bytes:</span>
        <span className="text-success font-bold">{outputBytes} B</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="aes-crypto" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Mode Selector */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 p-1 bg-bg-page rounded-lg border border-border-subtle text-xs">
            {(["encrypt", "decrypt"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setOutput("");
                  setError("");
                }}
                className={`px-3 py-1 rounded font-bold transition-colors capitalize ${
                  mode === m ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-text-muted">AES-GCM (256-bit)</span>
        </div>

        {/* Passphrase Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-primary block">
            Encryption Secret Passphrase
          </label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => {
              setPassphrase(e.target.value);
              setError("");
            }}
            placeholder="Enter a strong passphrase for key derivation..."
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Input Textarea */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">
              {mode === "encrypt" ? "Plaintext to Encrypt" : "Base64 Ciphertext to Decrypt"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setError("");
                }}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
              <CopyButton text={input} label="Copy" />
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder={
              mode === "encrypt"
                ? "Enter confidential message or plaintext..."
                : "Paste Base64-encoded encrypted string..."
            }
            rows={6}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleProcess}
            disabled={busy || !input.trim() || !passphrase}
            className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? "Processing..." : mode === "encrypt" ? "Encrypt Payload" : "Decrypt Payload"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Output Area */}
        {output && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                {mode === "encrypt" ? "Encrypted Ciphertext (Base64)" : "Decrypted Plaintext Result"}
              </span>
              <CopyButton text={output} label="Copy Result" />
            </div>
            <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
