"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useEffect, useMemo, useRef } from "react";
import CopyButton from "@/components/CopyButton";

interface BreachResult {
  status: "idle" | "loading" | "safe" | "breached" | "error";
  breachCount: number;
  hash: string;
  prefix: string;
  suffix: string;
  errorMsg?: string;
  latencyMs?: number;
}

async function sha1Hex(str: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-1", enc.encode(str));
  const arr = Array.from(new Uint8Array(buf));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

const COMMON_PRESETS = [
  "password123",
  "admin2024!",
  "P@ssw0rd1",
  "qwerty12345",
  "kX#9vL$2mQ!zP7rW",
];
export default function PwnedCheckerClient() {
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [result, setResult] = useState<BreachResult>({
    status: "idle",
    breachCount: 0,
    hash: "",
    prefix: "",
    suffix: "",
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!password) {
      setResult({
        status: "idle",
        breachCount: 0,
        hash: "",
        prefix: "",
        suffix: "",
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        setResult((prev) => ({ ...prev, status: "loading" }));
        const t0 = performance.now();
        const hash = await sha1Hex(password);
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);

        const res = await fetch("https://api.pwnedpasswords.com/range/" + prefix, {
          signal: controller.signal,
          headers: {
            "Add-Padding": "true",
          },
        });

        if (!res.ok) {
          throw new Error("HTTP " + res.status + ": Failed to query HIBP database.");
        }

        const text = await res.text();
        const latencyMs = Math.round(performance.now() - t0);
        const lines = text.split("\n");
        let count = 0;

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const [hashSuffix, rawCount] = trimmed.split(":");
          if (hashSuffix && hashSuffix.toUpperCase() === suffix) {
            count = parseInt(rawCount, 10) || 0;
            break;
          }
        }

        setResult({
          status: count > 0 ? "breached" : "safe",
          breachCount: count,
          hash,
          prefix,
          suffix,
          latencyMs,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setResult({
          status: "error",
          breachCount: 0,
          hash: "",
          prefix: "",
          suffix: "",
          errorMsg: err instanceof Error ? err.message : "Network error contacting HIBP.",
        });
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [password]);

  const severityBadge = useMemo(() => {
    if (result.status !== "breached") return null;
    const c = result.breachCount;
    if (c > 100000) {
      return {
        label: "EXTREME THREAT",
        color: "bg-error text-bg-page border-error font-bold",
        desc: "Found in wordlists & massive credential stuffing databases.",
      };
    }
    if (c > 1000) {
      return {
        label: "HIGH THREAT",
        color: "bg-error/20 text-error border-error/40",
        desc: "Frequently seen in public database leaks and dump repositories.",
      };
    }
    return {
      label: "COMPROMISED",
      color: "bg-warning/20 text-warning border-warning/40",
      desc: "Appeared in at least one breach. Should not be used.",
    };
  }, [result]);

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Privacy Mode:</span>
        <span className="text-accent font-bold">k-Anonymity</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Transmitted:</span>
        <span className="text-success font-bold">5-hex prefix only</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Plaintext Leak:</span>
        <span className="text-success font-bold">0% (Mathematically impossible)</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Database:</span>
        <span className="text-text-primary font-bold">800M+ Passwords</span>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="pwned-checker" stats={stats}>
      <div className="space-y-4 font-mono">
        <div className="rounded-lg border border-border-subtle bg-bg-card p-5 space-y-5">
            {/* Input Header standard: h-8 flex items-center justify-between */}
            <div className="h-8 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> PASSWORD_INPUT
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-mono px-2 py-1 rounded border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
                {password && (
                  <button
                    onClick={() => setPassword("")}
                    className="text-xs font-mono px-2 py-1 rounded border border-border-subtle text-text-muted hover:text-error hover:border-error/40 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Input Element */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to check against 800M+ breach records..."
                className="w-full bg-bg-page border border-border-subtle rounded-lg px-4 py-3 font-mono text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* k-Anonymity Cryptographic Pipeline Breakdown */}
            {password && result.hash && (
              <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-[11px]">k-Anonymity Transmission Payload:</span>
                  <span className="text-text-muted text-[11px]">
                    {result.latencyMs ? result.latencyMs + "ms latency" : "computing..."}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded border border-accent/40 bg-accent-soft px-2 py-1">
                    <span className="text-accent font-bold">{result.prefix}</span>
                    <span className="text-[10px] text-accent/70 ml-1.5">[Sent to HIBP]</span>
                  </div>
                  <span className="text-text-muted">+</span>
                  <div className="flex items-center rounded border border-border-subtle bg-bg-card px-2 py-1">
                    <span className="text-text-secondary">{result.suffix}</span>
                    <span className="text-[10px] text-text-muted ml-1.5">[Matched locally]</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Feedback Card */}
            {result.status === "loading" && (
              <div className="p-6 rounded-lg border border-border-subtle bg-bg-page text-center font-mono text-xs">
                <div className="inline-block w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin mb-2" />
                <p className="text-text-primary">Hashing with Web Crypto & querying HIBP prefix index...</p>
              </div>
            )}

            {result.status === "error" && (
              <div className="p-4 rounded-lg border border-error/40 bg-error/10 font-mono text-xs text-error">
                <p className="font-bold">Error Querying HIBP Database</p>
                <p className="mt-1 text-text-secondary">{result.errorMsg}</p>
              </div>
            )}

            {result.status === "safe" && (
              <div className="p-6 rounded-lg border border-success/40 bg-success/10 font-mono space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <span className="text-base font-bold">NO BREACHES FOUND</span>
                </div>
                <p className="text-xs text-text-primary leading-relaxed">
                  This password was <span className="font-bold text-success">not found</span> in any known publicly leaked data dumps (800+ million passwords).
                </p>
                <p className="text-[11px] text-text-muted">
                  Note: A zero-breach result indicates it hasn&apos;t leaked in public dumps yet, but ensure it still meets strength requirements (12+ characters, mixed case, symbols).
                </p>
              </div>
            )}

            {result.status === "breached" && severityBadge && (
              <div className="p-6 rounded-lg border border-error/40 bg-error/10 font-mono space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-error">
                    <div className="w-6 h-6 rounded-full bg-error/20 flex items-center justify-center font-bold">
                      ⚠
                    </div>
                    <span className="text-base font-bold">PASSWORD BREACHED</span>
                  </div>
                  <span className={"text-xs px-2.5 py-1 rounded border " + severityBadge.color}>
                    {severityBadge.label}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-bg-card border border-border-subtle">
                  <span className="text-[11px] text-text-muted block">Exposure Frequency:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-bold text-error">
                      {result.breachCount.toLocaleString()}
                    </span>
                    <span className="text-xs text-text-secondary">times detected in leaks</span>
                  </div>
                  <p className="text-xs text-text-muted mt-2">{severityBadge.desc}</p>
                </div>

                <div className="text-xs text-text-primary space-y-1">
                  <p className="font-bold text-warning">Recommended Immediate Actions:</p>
                  <ul className="list-disc list-inside text-text-secondary space-y-0.5 text-[11px]">
                    <li>Never use this password on any account or service.</li>
                    <li>If currently in use anywhere, change it immediately.</li>
                    <li>Enable Two-Factor Authentication (2FA) on all critical platforms.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
      </div>
    </ToolLayout>
  );
}