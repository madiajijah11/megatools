"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useEffect } from "react";
import CopyButton from "@/components/CopyButton";

type KeyType = "RSA-2048" | "RSA-4096" | "ECDSA-P256" | "ECDSA-P384";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function formatPem(base64: string, label: string): string {
  const lines: string[] = [`-----BEGIN ${label}-----`];
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64));
  }
  lines.push(`-----END ${label}-----`);
  return lines.join("\n");
}

async function computeFingerprint(spkiBuffer: ArrayBuffer): Promise<string> {
  const hash = await window.crypto.subtle.digest("SHA-256", spkiBuffer);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":");
}

export default function KeypairGeneratorClient() {
  const [keyType, setKeyType] = useState<KeyType>("RSA-2048");
  const [publicKeyPem, setPublicKeyPem] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [generating, setGenerating] = useState(false);
  const generateKeys = async () => {
    setGenerating(true);
    try {
      let keyPair: CryptoKeyPair;

      if (keyType.startsWith("RSA")) {
        const modulusLength = keyType === "RSA-4096" ? 4096 : 2048;
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: "RSA-OAEP",
            modulusLength,
            publicExponent: new Uint8Array([1, 0, 1]), // 65537
            hash: "SHA-256",
          },
          true,
          ["encrypt", "decrypt"]
        );
      } else {
        const namedCurve = keyType === "ECDSA-P384" ? "P-384" : "P-256";
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: "ECDSA",
            namedCurve,
          },
          true,
          ["sign", "verify"]
        );
      }

      const spki = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

      const pubPem = formatPem(arrayBufferToBase64(spki), "PUBLIC KEY");
      const privPem = formatPem(arrayBufferToBase64(pkcs8), "PRIVATE KEY");
      const fp = await computeFingerprint(spki);

      setPublicKeyPem(pubPem);
      setPrivateKeyPem(privPem);
      setFingerprint(fp);
    } catch (err) {
      console.error("Key generation failed", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    generateKeys();
  }, [keyType]);

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Algorithm</p>
        <p className="text-accent font-mono font-bold text-xs">{keyType}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Security</p>
        <p className="text-text-primary font-mono text-xs">Client-Side Native</p>
      </div>
      <div className="col-span-2">
        <p className="text-text-muted text-xs">SHA-256 Fingerprint</p>
        <p className="text-text-secondary font-mono text-[10px] break-all">{fingerprint || "—"}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="keypair-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Type Selector & Regenerate */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-bg-page rounded-lg border border-border-subtle">
            <div className="flex flex-wrap items-center gap-1.5 bg-bg-card p-1 rounded-lg border border-border-subtle">
              {(
                [
                  { id: "RSA-2048", label: "RSA 2048-bit" },
                  { id: "RSA-4096", label: "RSA 4096-bit" },
                  { id: "ECDSA-P256", label: "ECDSA (P-256)" },
                  { id: "ECDSA-P384", label: "ECDSA (P-384)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setKeyType(tab.id)}
                  className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                    keyType === tab.id
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={generateKeys}
              disabled={generating}
              className="px-4 py-1.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {generating ? "Generating..." : "Regenerate Keys"}
            </button>
          </div>

          {/* Key Displays */}
          <div className="space-y-6">
            {/* Public Key */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Public Key (SPKI PEM):
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => downloadFile(publicKeyPem, "public_key.pem")}
                    className="text-xs font-mono text-text-muted hover:text-accent"
                  >
                    [Download .pem]
                  </button>
                  <CopyButton text={publicKeyPem} />
                </div>
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg font-mono text-xs text-accent overflow-x-auto">
                <pre>{publicKeyPem || "Generating public key..."}</pre>
              </div>
            </div>

            {/* Private Key */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-warning">
                  Private Key (PKCS#8 PEM — Keep Secret):
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => downloadFile(privateKeyPem, "private_key.pem")}
                    className="text-xs font-mono text-text-muted hover:text-warning"
                  >
                    [Download .pem]
                  </button>
                  <CopyButton text={privateKeyPem} />
                </div>
              </div>
              <div className="p-3 bg-bg-page border border-warning/30 rounded-lg font-mono text-xs text-text-primary overflow-x-auto">
                <pre>{privateKeyPem || "Generating private key..."}</pre>
              </div>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}