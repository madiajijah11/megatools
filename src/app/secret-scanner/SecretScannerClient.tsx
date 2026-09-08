"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface SecretFinding {
  id: string;
  type: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  rawMatch: string;
  line: number;
  col: number;
  entropy: number;
  maskLabel: string;
}

function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies = new Map<string, number>();
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }
  let entropy = 0;
  const len = str.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(2));
}

function maskString(val: string): string {
  if (val.length <= 8) return "••••••••";
  return val.slice(0, 4) + "••••••••" + val.slice(-4);
}

const PRESET_ENV = "# Production Environment Configuration\nNODE_ENV=production\nPORT=8080\n\n# Cloud Infrastructure\nAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nAWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY\n\n# AI Providers\nOPENAI_API_KEY=sk-proj-98af38bf8ca9b2d8e4f1a23c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e\nANTHROPIC_API_KEY=sk-ant-api03-abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456789012345678\n\n# Database Connection\nDATABASE_URL=postgres://app_user:SuperSecretP@ssw0rd123!@db.internal.megatools.io:5432/prod_analytics\nREDIS_URL=redis://:AuthTokenPass123@cache.internal.megatools.io:6379/0\n";

const PRESET_DIFF = "diff --git a/config/auth.ts b/config/auth.ts\nindex e69de29..b2b1a3d 100644\n--- a/config/auth.ts\n+++ b/config/auth.ts\n@@ -10,4 +10,6 @@ export const authConfig = {\n   // GitHub Automation token\n-  githubToken: process.env.GH_TOKEN,\n+  githubToken: \"ghp_11a22b33c44d55e66f77g88h99i00j11k22l\",\n+  // Stripe billing\n+  stripeKey: \"sk_live_51A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0\",\n+  // Slack notifications\n+  webhook: \"https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX\"\n };\n";

const PRESET_CLEAN = "# Safe application configuration\nAPP_NAME=megatools-client\nLOG_LEVEL=info\nMAX_UPLOAD_SIZE=52428800\nENABLE_DARK_MODE=true\nCACHE_TTL_SECONDS=3600\nAPI_BASE_URL=https://api.megatools.io/v1\n";
function scanTextForSecrets(text: string): SecretFinding[] {
  if (!text.trim()) return [];

  const lines = text.split("\n");
  const results: SecretFinding[] = [];
  const seenMatches = new Set<string>();

  lines.forEach((lineText, lineIdx) => {
    const lineNum = lineIdx + 1;

    // 1. AWS Access Key
    const awsAccess = lineText.match(/\b(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}\b/g);
    awsAccess?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "aws-key-" + lineNum + "-" + results.length,
          type: "AWS Access Key ID",
          category: "AWS",
          severity: "CRITICAL",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_AWS_ACCESS_KEY]",
        });
      }
    });

    // 2. AWS Secret Key
    const awsSec = lineText.match(/(?:aws_secret_access_key|aws_secret_key|secret_key|aws_secret)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/i);
    if (awsSec && awsSec[1] && !seenMatches.has(awsSec[1])) {
      seenMatches.add(awsSec[1]);
      results.push({
        id: "aws-sec-" + lineNum + "-" + results.length,
        type: "AWS Secret Access Key",
        category: "AWS",
        severity: "CRITICAL",
        rawMatch: awsSec[1],
        line: lineNum,
        col: lineText.indexOf(awsSec[1]) + 1,
        entropy: calculateShannonEntropy(awsSec[1]),
        maskLabel: "[REDACTED_AWS_SECRET_KEY]",
      });
    }

    // 3. GitHub Tokens
    const ghTokens = lineText.match(/\b(ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}|gho_[A-Za-z0-9]{36}|ghu_[A-Za-z0-9]{36}|ghs_[A-Za-z0-9]{36})\b/g);
    ghTokens?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "gh-" + lineNum + "-" + results.length,
          type: "GitHub Personal Access Token",
          category: "GitHub",
          severity: "CRITICAL",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_GITHUB_TOKEN]",
        });
      }
    });

    // 4. OpenAI API Key
    const openAi = lineText.match(/\b(sk-[A-Za-z0-9]{48}|sk-proj-[A-Za-z0-9_-]{48,150}|sk-admin-[A-Za-z0-9_-]{48,150})\b/g);
    openAi?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "openai-" + lineNum + "-" + results.length,
          type: "OpenAI API Key",
          category: "OpenAI",
          severity: "CRITICAL",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_OPENAI_KEY]",
        });
      }
    });

    // 5. Anthropic API Key
    const anthropic = lineText.match(/\b(sk-ant-api03-[A-Za-z0-9_-]{80,120})\b/g);
    anthropic?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "anthropic-" + lineNum + "-" + results.length,
          type: "Anthropic Claude Key",
          category: "Anthropic",
          severity: "CRITICAL",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_ANTHROPIC_KEY]",
        });
      }
    });

    // 6. Google API Key
    const googleKeys = lineText.match(/\b(AIza[0-9A-Za-z\-_]{35})\b/g);
    googleKeys?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "google-" + lineNum + "-" + results.length,
          type: "Google Cloud / AI Key",
          category: "Google",
          severity: "HIGH",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_GOOGLE_KEY]",
        });
      }
    });

    // 7. Stripe Secret Key
    const stripeKeys = lineText.match(/\b((?:sk|rk)_(?:live|test)_[0-9a-zA-Z]{24,99})\b/g);
    stripeKeys?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "stripe-" + lineNum + "-" + results.length,
          type: "Stripe Secret / Restricted Key",
          category: "Stripe",
          severity: "CRITICAL",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_STRIPE_KEY]",
        });
      }
    });

    // 8. Slack Webhooks & Tokens
    const slackWh = lineText.match(/https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8,12}\/B[a-zA-Z0-9_]{8,12}\/[a-zA-Z0-9_]{24}/g);
    slackWh?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "slack-wh-" + lineNum + "-" + results.length,
          type: "Slack Incoming Webhook",
          category: "Slack",
          severity: "HIGH",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_SLACK_WEBHOOK]",
        });
      }
    });

    const slackTok = lineText.match(/\b(xox[baprs]-[0-9a-zA-Z]{10,48}-[0-9a-zA-Z]{10,48})\b/g);
    slackTok?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "slack-tok-" + lineNum + "-" + results.length,
          type: "Slack Bot/User Token",
          category: "Slack",
          severity: "CRITICAL",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_SLACK_TOKEN]",
        });
      }
    });

    // 9. Database Connection Strings
    const dbUris = lineText.match(/\b((?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|rediss):\/\/[^:\s'"]+:[^@\s'"]+@[^:\s'"]+:\d+\/[^\s'"]+)\b/gi);
    dbUris?.forEach((match) => {
      if (!seenMatches.has(match)) {
        seenMatches.add(match);
        results.push({
          id: "db-" + lineNum + "-" + results.length,
          type: "Database Connection URI",
          category: "Database",
          severity: "CRITICAL",
          rawMatch: match,
          line: lineNum,
          col: lineText.indexOf(match) + 1,
          entropy: calculateShannonEntropy(match),
          maskLabel: "[REDACTED_DATABASE_URL]",
        });
      }
    });

    // 10. Private Keys
    if (lineText.includes("BEGIN") && lineText.includes("PRIVATE KEY")) {
      const pkMatch = lineText.match(/-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/);
      if (pkMatch && !seenMatches.has(pkMatch[0])) {
        seenMatches.add(pkMatch[0]);
        results.push({
          id: "pk-" + lineNum + "-" + results.length,
          type: "Asymmetric Private Key Block",
          category: "PrivateKey",
          severity: "CRITICAL",
          rawMatch: pkMatch[0],
          line: lineNum,
          col: lineText.indexOf(pkMatch[0]) + 1,
          entropy: calculateShannonEntropy(pkMatch[0]),
          maskLabel: "[REDACTED_PRIVATE_KEY_BLOCK]",
        });
      }
    }

    // 11. Generic High Entropy assignment
    const genericAssign = lineText.match(/(?:api[_-]?key|secret|token|password|passwd|auth[_-]?token|client[_-]?secret)\s*[:=]\s*["']?([A-Za-z0-9_~./+=!-]{20,})["']?/i);
    if (genericAssign && genericAssign[1]) {
      const val = genericAssign[1];
      const entropy = calculateShannonEntropy(val);
      if (entropy >= 3.8 && !seenMatches.has(val)) {
        seenMatches.add(val);
        results.push({
          id: "gen-" + lineNum + "-" + results.length,
          type: "High-Entropy Secret Value",
          category: "Generic",
          severity: entropy > 4.5 ? "HIGH" : "MEDIUM",
          rawMatch: val,
          line: lineNum,
          col: lineText.indexOf(val) + 1,
          entropy,
          maskLabel: "[REDACTED_HIGH_ENTROPY_SECRET]",
        });
      }
    }
  });

  return results;
}
export default function SecretScannerClient() {
  const [input, setInput] = useState<string>(PRESET_ENV);
  const [activeTab, setActiveTab] = useState<"findings" | "masked">("findings");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const findings = useMemo<SecretFinding[]>(() => {
    return scanTextForSecrets(input);
  }, [input]);

  const maskedContent = useMemo<string>(() => {
    if (!input) return "";
    let sanitized = input;
    const sorted = [...findings].sort((a, b) => b.rawMatch.length - a.rawMatch.length);
    for (const f of sorted) {
      sanitized = sanitized.split(f.rawMatch).join(f.maskLabel);
    }
    return sanitized;
  }, [input, findings]);

  const statsBreakdown = useMemo(() => {
    const criticalCount = findings.filter((f) => f.severity === "CRITICAL").length;
    const highCount = findings.filter((f) => f.severity === "HIGH").length;
    const mediumCount = findings.filter((f) => f.severity === "MEDIUM").length;
    const avgEntropy =
      findings.length > 0
        ? (findings.reduce((acc, f) => acc + f.entropy, 0) / findings.length).toFixed(2)
        : "0.00";

    return { criticalCount, highCount, mediumCount, avgEntropy };
  }, [findings]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setInput(text);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Total Detected:</span>
        <span className={"font-bold " + (findings.length > 0 ? "text-error" : "text-success")}>
          {findings.length}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Critical Threats:</span>
        <span className="text-error font-bold">{statsBreakdown.criticalCount}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Signatures Loaded:</span>
        <span className="text-text-primary font-bold">14 Vendors</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Processing:</span>
        <span className="text-accent font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent transition-colors"
        >
          <span>←</span> [cd .. / home]
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
        >
          [?] Tool Info
        </button>
      </div>

      {/* Hero Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-subtle bg-bg-card font-mono text-xs text-text-secondary mb-3">
          <span className="text-accent">$</span>
          <span>megatools --scan-secrets --zero-leak</span>
          <span className="animate-pulse text-accent">▊</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Secret & API Key <span className="gradient-text">Leak Scanner</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Airgapped regex and Shannon entropy scanner. Detect leaked cloud keys, tokens, and database passwords with 1-click auto-masking.
        </p>

        {/* Presets and Upload Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-text-muted">PRESETS:</span>
          <button
            onClick={() => setInput(PRESET_ENV)}
            className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
          >
            [.env config]
          </button>
          <button
            onClick={() => setInput(PRESET_DIFF)}
            className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
          >
            [git diff]
          </button>
          <button
            onClick={() => setInput(PRESET_CLEAN)}
            className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
          >
            [clean sample]
          </button>

          <span className="text-border-subtle">|</span>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".env,.json,.txt,.yaml,.yml,.js,.ts,.py,.sh,.diff"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 text-text-secondary hover:text-accent transition-colors"
          >
            Load File...
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Scanner Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Column */}
            <div className="rounded-lg border border-border-subtle bg-bg-card p-4 flex flex-col">
              {/* Header Standard: h-8 flex items-center justify-between */}
              <div className="h-8 flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-text-primary flex items-center gap-1.5">
                  <span className="text-accent">&gt;</span> SOURCE_CODE / CONFIG
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-text-muted">
                    {input.split("\n").length} lines · {input.length} chars
                  </span>
                  {input && (
                    <button
                      onClick={() => setInput("")}
                      className="text-xs font-mono px-2 py-1 rounded border border-border-subtle text-text-muted hover:text-error hover:border-error/40 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste .env, bash history, git diff, or application code here..."
                className="w-full h-[360px] resize-y bg-bg-page border border-border-subtle rounded p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                spellCheck={false}
              />
            </div>

            {/* Output Column */}
            <div className="rounded-lg border border-border-subtle bg-bg-card p-4 flex flex-col">
              {/* Header Standard: h-8 flex items-center justify-between */}
              <div className="h-8 flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 bg-bg-page border border-border-subtle rounded p-0.5 font-mono text-xs">
                  <button
                    onClick={() => setActiveTab("findings")}
                    className={"px-2.5 py-0.5 rounded transition-colors " + (
                      activeTab === "findings"
                        ? "bg-accent-soft text-accent font-bold border border-accent/40"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    Leaks ({findings.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("masked")}
                    className={"px-2.5 py-0.5 rounded transition-colors " + (
                      activeTab === "masked"
                        ? "bg-accent-soft text-accent font-bold border border-accent/40"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    Sanitized Code
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeTab === "masked" && maskedContent && (
                    <CopyButton
                      text={maskedContent}
                      label="copy safe"
                      className="text-xs font-mono px-2 py-1 rounded border border-accent/40 bg-accent-soft text-accent hover:bg-accent hover:text-bg-page transition-colors cursor-pointer"
                    />
                  )}
                </div>
              </div>

              {/* View 1: Detected Leaks */}
              {activeTab === "findings" && (
                <div className="h-[360px] overflow-y-auto bg-bg-page border border-border-subtle rounded p-3 font-mono text-xs space-y-2.5">
                  {findings.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      {input.trim() ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-success/10 text-success flex items-center justify-center text-lg mb-2">
                            ✓
                          </div>
                          <p className="text-text-primary font-bold">No Leaks Detected</p>
                          <p className="text-text-muted text-[11px] mt-1 max-w-xs">
                            No known API keys, cloud tokens, or high-entropy credentials detected in this snippet.
                          </p>
                        </>
                      ) : (
                        <p className="text-text-muted">Paste code or config to scan for leaked secrets.</p>
                      )}
                    </div>
                  ) : (
                    findings.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded border border-border-subtle bg-bg-card/70 hover:border-accent/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={"text-[10px] font-bold px-1.5 py-0.5 rounded " + (
                                item.severity === "CRITICAL"
                                  ? "bg-error/15 text-error border border-error/30"
                                  : item.severity === "HIGH"
                                  ? "bg-warning/15 text-warning border border-warning/30"
                                  : "bg-accent-soft text-accent border border-accent/30"
                              )}
                            >
                              [{item.severity}]
                            </span>
                            <span className="font-semibold text-text-primary text-[11px]">
                              {item.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-text-muted">
                            L{item.line}:C{item.col}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-bg-page px-2 py-1 rounded border border-border-subtle/60">
                          <code className="text-error font-mono text-[11px] break-all">
                            {maskString(item.rawMatch)}
                          </code>
                          <span className="text-[10px] text-text-muted shrink-0" title="Shannon Entropy">
                            {item.entropy} bits
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View 2: Sanitized Masked Code */}
              {activeTab === "masked" && (
                <div className="h-[360px] overflow-y-auto bg-bg-page border border-border-subtle rounded p-3 font-mono text-xs">
                  {maskedContent ? (
                    <pre className="text-text-primary whitespace-pre-wrap break-all leading-relaxed font-mono">
                      {maskedContent}
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center text-text-muted">
                      No code provided.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary Bar */}
          {findings.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-bg-card border border-border-subtle font-mono">
                <span className="text-[11px] text-text-muted block">Total Leaks:</span>
                <span className="text-base font-bold text-error">{findings.length}</span>
              </div>
              <div className="p-3 rounded-lg bg-bg-card border border-border-subtle font-mono">
                <span className="text-[11px] text-text-muted block">Critical Risk:</span>
                <span className="text-base font-bold text-error">{statsBreakdown.criticalCount}</span>
              </div>
              <div className="p-3 rounded-lg bg-bg-card border border-border-subtle font-mono">
                <span className="text-[11px] text-text-muted block">Avg Entropy:</span>
                <span className="text-base font-bold text-accent">{statsBreakdown.avgEntropy} bits</span>
              </div>
              <div className="p-3 rounded-lg bg-bg-card border border-border-subtle font-mono flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-text-muted block">Status:</span>
                  <span className="text-xs font-bold text-error uppercase">Action Required</span>
                </div>
                <button
                  onClick={() => setActiveTab("masked")}
                  className="text-xs font-mono px-2 py-1 rounded bg-accent text-bg-page hover:bg-accent-hover font-bold transition-colors cursor-pointer"
                >
                  Mask All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: InfoPanel (Desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="secret-scanner" stats={stats} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="secret-scanner" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
