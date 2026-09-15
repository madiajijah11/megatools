"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useEffect, useCallback } from "react";
import CopyButton from "@/components/CopyButton";

type HashAlgorithm = "SHA-256" | "SHA-512" | "SHA-384" | "SHA-1";

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  return bufferToBase64(buffer)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export default function HmacGeneratorClient() {
  const [message, setMessage] = useState("Hello, MegaTools security webhook payload!");
  const [secret, setSecret] = useState("my-super-secret-key-12345");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("SHA-256");
  const [hexOutput, setHexOutput] = useState("");
  const [base64Output, setBase64Output] = useState("");
  const [base64UrlOutput, setBase64UrlOutput] = useState("");
  const [expectedSignature, setExpectedSignature] = useState("");
  const generateRandomKey = () => {
    const arr = new Uint8Array(32);
    window.crypto.getRandomValues(arr);
    setSecret(bufferToHex(arr.buffer));
  };

  const calculateHmac = useCallback(async () => {
    if (!message || !secret) {
      setHexOutput("");
      setBase64Output("");
      setBase64UrlOutput("");
      return;
    }

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const msgData = encoder.encode(message);

      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: { name: algorithm } },
        false,
        ["sign"]
      );

      const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, msgData);
      setHexOutput(bufferToHex(signature));
      setBase64Output(bufferToBase64(signature));
      setBase64UrlOutput(bufferToBase64Url(signature));
    } catch (err) {
      console.error(err);
    }
  }, [message, secret, algorithm]);

  useEffect(() => {
    calculateHmac();
  }, [calculateHmac]);

  const isVerified = expectedSignature.trim()
    ? expectedSignature.trim().toLowerCase() === hexOutput.toLowerCase() ||
      expectedSignature.trim() === base64Output ||
      expectedSignature.trim() === base64UrlOutput
    : null;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Algorithm</p>
        <p className="text-accent font-mono font-bold">{algorithm}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Output Length</p>
        <p className="text-text-primary font-mono">{hexOutput.length / 2} bytes</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Signature Match</p>
        <p
          className={`font-mono text-xs font-bold ${
            isVerified === null ? "text-text-muted" : isVerified ? "text-success" : "text-error"
          }`}
        >
          {isVerified === null ? "NO INPUT" : isVerified ? "MATCH" : "MISMATCH"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Provider</p>
        <p className="text-text-muted font-mono text-xs">Web Crypto API</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="hmac-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Algorithm Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-bg-page rounded-lg border border-border-subtle">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              Hash Algorithm:
            </label>
            <div className="flex items-center gap-1.5 bg-bg-card p-1 rounded-lg border border-border-subtle">
              {(["SHA-256", "SHA-512", "SHA-384", "SHA-1"] as const).map((algo) => (
                <button
                  key={algo}
                  type="button"
                  onClick={() => setAlgorithm(algo)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    algorithm === algo
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>

          {/* Secret Key Input */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Secret Key:
              </label>
              <button
                type="button"
                onClick={generateRandomKey}
                className="text-xs font-mono text-text-muted hover:text-accent transition-colors"
              >
                [Generate 256-bit Key]
              </button>
            </div>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter secret key..."
              className="w-full rounded-lg bg-bg-page border border-border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Message Payload */}
          <div className="mb-6">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary block mb-2">
              Message Payload:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter payload data..."
              rows={5}
              className="w-full rounded-lg bg-bg-page border border-border-subtle p-3 font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-y"
              spellCheck={false}
            />
          </div>

          {/* Results Box */}
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-text-secondary uppercase">Hex Digest:</span>
                <CopyButton text={hexOutput} />
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg font-mono text-xs text-accent break-all select-all">
                {hexOutput || "—"}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-text-secondary uppercase">Base64:</span>
                <CopyButton text={base64Output} />
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg font-mono text-xs text-text-primary break-all select-all">
                {base64Output || "—"}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-text-secondary uppercase">Base64URL:</span>
                <CopyButton text={base64UrlOutput} />
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg font-mono text-xs text-text-primary break-all select-all">
                {base64UrlOutput || "—"}
              </div>
            </div>
          </div>

          {/* Verification Box */}
          <div className="p-4 bg-bg-page rounded-lg border border-border-subtle">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary block mb-2">
              Verify Webhook Signature (Paste received signature):
            </label>
            <input
              type="text"
              value={expectedSignature}
              onChange={(e) => setExpectedSignature(e.target.value)}
              placeholder="Paste signature to verify..."
              className="w-full rounded-lg bg-bg-card border border-border-subtle p-3 font-mono text-xs text-text-primary focus:border-accent focus:outline-none mb-2"
            />
            {expectedSignature && (
              <div
                className={`p-2 rounded font-mono text-xs text-center font-bold ${
                  isVerified
                    ? "bg-success/10 text-success border border-success/30"
                    : "bg-error/10 text-error border border-error/30"
                }`}
              >
                {isVerified ? "✓ SIGNATURE VALID & MATCHED" : "✗ SIGNATURE MISMATCH"}
              </div>
            )}
          </div>
      </div>
    </ToolLayout>
  );
}