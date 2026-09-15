"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

type DecodedState =
  | { status: "empty" }
  | {
      status: "valid";
      header: Record<string, unknown>;
      payload: Record<string, unknown>;
      signatureHex: string;
    }
  | { status: "invalid"; error: string };

const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFudGlncmF2aXR5IFVzZXIiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTk5OTk5OTk5OX0.4pcPyMD09olUV_AlFac2sQWbDu10YGGaQioKHjGoGoU";

export default function JwtDecoderClient() {
  const [token, setToken] = useState(SAMPLE_JWT);
  const [decoded, setDecoded] = useState<DecodedState>({ status: "empty" });

  useEffect(() => {
    const trimmed = token.trim();
    if (!trimmed) {
      setDecoded({ status: "empty" });
      return;
    }

    const parts = trimmed.split(".");
    if (parts.length !== 3) {
      setDecoded({
        status: "invalid",
        error: "Invalid format — a standard JWT must have 3 dot-separated parts (header.payload.signature).",
      });
      return;
    }

    try {
      const headerStr = base64UrlDecode(parts[0]);
      const payloadStr = base64UrlDecode(parts[1]);

      let header: Record<string, unknown>;
      let payload: Record<string, unknown>;

      try {
        header = JSON.parse(headerStr);
        payload = JSON.parse(payloadStr);
      } catch {
        setDecoded({
          status: "invalid",
          error: "JSON parse error — header or payload are not valid JSON objects.",
        });
        return;
      }

      const sigBinary = atob(parts[2].replace(/-/g, "+").replace(/_/g, "/"));
      const sigHex = Array.from(sigBinary)
        .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("");

      setDecoded({
        status: "valid",
        header,
        payload,
        signatureHex: sigHex,
      });
    } catch {
      setDecoded({
        status: "invalid",
        error: "Malformed Base64URL string.",
      });
    }
  }, [token]);

  const expInfo = useMemo(() => {
    if (decoded.status !== "valid" || typeof decoded.payload.exp !== "number") {
      return null;
    }
    const expSec = decoded.payload.exp;
    const expDate = new Date(expSec * 1000);
    const now = new Date();
    const isExpired = now.getTime() > expDate.getTime();
    return {
      expired: isExpired,
      date: expDate.toLocaleString(),
    };
  }, [decoded]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Algorithm:</span>
        <span className="text-accent font-bold">
          {decoded.status === "valid" ? String(decoded.header.alg || "none") : "—"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Type:</span>
        <span className="text-text-primary">
          {decoded.status === "valid" ? String(decoded.header.typ || "JWT") : "—"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Token Status:</span>
        <span
          className={`font-bold ${
            decoded.status === "valid"
              ? "text-success"
              : decoded.status === "invalid"
              ? "text-error"
              : "text-text-muted"
          }`}
        >
          {decoded.status === "valid"
            ? "VALID FORMAT"
            : decoded.status === "invalid"
            ? "INVALID FORMAT"
            : "EMPTY"}
        </span>
      </div>
      {expInfo && (
        <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
          <span className="text-text-muted">Expiration:</span>
          <span className={expInfo.expired ? "text-error font-bold" : "text-success font-bold"}>
            {expInfo.expired ? "EXPIRED" : "ACTIVE"}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <ToolLayout toolId="jwt-decoder" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Token Input Area */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Raw Encoded JWT</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setToken("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
              <CopyButton text={token} label="Copy Token" />
            </div>
          </div>
          <textarea
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste JWT string (header.payload.signature)..."
            rows={4}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Error Notification */}
        {decoded.status === "invalid" && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {decoded.error}
          </div>
        )}

        {/* Decoded Sections */}
        {decoded.status === "valid" && (
          <div className="pt-2 border-t border-border-subtle space-y-4">
            {/* Expiry Pill */}
            {expInfo && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  expInfo.expired
                    ? "border-error/30 bg-error/10 text-error"
                    : "border-success/30 bg-success/10 text-success"
                }`}
              >
                <span className="font-bold">
                  {expInfo.expired ? "✗ Token has Expired" : "✓ Token is Currently Active"}
                </span>
                <span>{expInfo.date}</span>
              </div>
            )}

            {/* Header JSON */}
            <div className="space-y-1.5">
              <div className="h-8 flex items-center justify-between text-xs">
                <span className="font-semibold text-accent">Decoded Header (Algorithm & Token Type)</span>
                <CopyButton text={JSON.stringify(decoded.header, null, 2)} label="Copy Header" />
              </div>
              <pre className="p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </div>

            {/* Payload JSON */}
            <div className="space-y-1.5">
              <div className="h-8 flex items-center justify-between text-xs">
                <span className="font-semibold text-cyan-300">Decoded Payload (Claims & Data)</span>
                <CopyButton text={JSON.stringify(decoded.payload, null, 2)} label="Copy Payload" />
              </div>
              <pre className="p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
            </div>

            {/* Signature Hex */}
            <div className="space-y-1.5">
              <div className="h-8 flex items-center justify-between text-xs">
                <span className="font-semibold text-text-muted">Signature Hex Bytes</span>
                <CopyButton text={decoded.signatureHex} label="Copy Signature" />
              </div>
              <div className="p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-secondary break-all">
                {decoded.signatureHex || "(empty signature)"}
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
