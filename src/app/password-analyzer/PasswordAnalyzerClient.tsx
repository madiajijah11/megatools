"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

function calculateEntropy(pwd: string) {
  if (!pwd) {
    return {
      entropy: 0,
      poolSize: 0,
      hasLower: false,
      hasUpper: false,
      hasDigits: false,
      hasSymbols: false,
      crackTimeOnline: "Instant",
      crackTimeOffline: "Instant",
      score: 0,
      scoreLabel: "Empty",
      warnings: ["Password is empty"],
    };
  }

  const hasLower = /[a-z]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);
  const hasDigits = /[0-9]/.test(pwd);
  const hasSymbols = /[^a-zA-Z0-9]/.test(pwd);

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigits) poolSize += 10;
  if (hasSymbols) poolSize += 33;

  const entropy = Math.round(pwd.length * Math.log2(poolSize || 1));
  const totalCombinations = Math.pow(poolSize || 1, pwd.length);

  // Time to crack at 100 Billion guesses/sec (Modern 8x RTX 4090 GPU hashcat rig)
  const secondsOffline = totalCombinations / (100 * 1e9 * 2); // Average 50% search
  // Online throttled at 100 requests / second
  const secondsOnline = totalCombinations / (100 * 2);

  const formatTime = (secs: number) => {
    if (secs < 0.001) return "Instant (< 1ms)";
    if (secs < 1) return "< 1 second";
    if (secs < 60) return `${Math.round(secs)} seconds`;
    if (secs < 3600) return `${Math.round(secs / 60)} minutes`;
    if (secs < 86400) return `${Math.round(secs / 3600)} hours`;
    if (secs < 31536000) return `${Math.round(secs / 86400)} days`;
    if (secs < 31536000 * 1000) return `${Math.round(secs / 31536000)} years`;
    if (secs < 31536000 * 1e6) return `${Math.round(secs / (31536000 * 1000))} thousand years`;
    if (secs < 31536000 * 1e9) return `${Math.round(secs / (31536000 * 1e6))} million years`;
    return `${(secs / (31536000 * 1e9)).toExponential(2)} billion years`;
  };

  const warnings: string[] = [];
  if (pwd.length < 8) warnings.push("Critically short length (less than 8 characters)");
  else if (pwd.length < 12) warnings.push("Length is below the recommended 12+ characters");

  if (!hasLower || !hasUpper) warnings.push("Missing mixed case (lowercase & uppercase)");
  if (!hasDigits) warnings.push("No numbers included");
  if (!hasSymbols) warnings.push("No special symbols included");
  if (/(.)\1{2,}/.test(pwd)) warnings.push("Repeated character patterns detected");
  if (/1234|abcd|qwerty|password|admin/i.test(pwd)) warnings.push("Predictable dictionary sequence detected");

  let score = 0;
  let scoreLabel = "Very Weak";
  if (entropy < 28) {
    score = 20;
    scoreLabel = "Very Weak";
  } else if (entropy < 45) {
    score = 40;
    scoreLabel = "Weak";
  } else if (entropy < 65) {
    score = 65;
    scoreLabel = "Moderate";
  } else if (entropy < 90) {
    score = 85;
    scoreLabel = "Strong";
  } else {
    score = 100;
    scoreLabel = "Very Strong";
  }

  return {
    entropy,
    poolSize,
    hasLower,
    hasUpper,
    hasDigits,
    hasSymbols,
    crackTimeOnline: formatTime(secondsOnline),
    crackTimeOffline: formatTime(secondsOffline),
    score,
    scoreLabel,
    warnings,
  };
}

export default function PasswordAnalyzerClient() {
  const [password, setPassword] = useState("Tr0ub4dor&3_secure!");
  const [showPassword, setShowPassword] = useState(true);
  const analysis = useMemo(() => calculateEntropy(password), [password]);

  const getScoreColor = () => {
    if (analysis.score <= 20) return "text-error bg-error";
    if (analysis.score <= 40) return "text-warning bg-warning";
    if (analysis.score <= 65) return "text-accent bg-accent";
    return "text-success bg-success";
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Entropy</p>
        <p className="text-accent font-mono font-bold">{analysis.entropy} bits</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Pool Size</p>
        <p className="text-text-primary font-mono">{analysis.poolSize} chars</p>
      </div>
      <div className="col-span-2">
        <p className="text-text-muted text-xs">GPU Rig Crack Time</p>
        <p className="text-text-secondary font-mono text-xs truncate">{analysis.crackTimeOffline}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="password-analyzer" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Password Input Box */}
          <div className="relative mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Target Password:
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-mono text-text-muted hover:text-text-primary"
                >
                  [{showPassword ? "Hide" : "Show"}]
                </button>
                <CopyButton text={password} />
              </div>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type password to evaluate..."
              className="w-full rounded-lg bg-bg-page border border-border-subtle p-4 font-mono text-lg text-text-primary focus:border-accent focus:outline-none"
              spellCheck={false}
            />

            {/* Strength Bar */}
            <div className="mt-3 w-full bg-bg-page rounded-full h-2 overflow-hidden border border-border-subtle">
              <div
                className={`h-full transition-all duration-300 ${getScoreColor().split(" ")[1]}`}
                style={{ width: `${analysis.score}%` }}
              />
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="p-4 bg-bg-page border border-border-subtle rounded-lg text-center">
              <p className="text-xs text-text-muted font-mono uppercase">Shannon Entropy</p>
              <p className="text-2xl font-bold font-mono text-accent mt-1">{analysis.entropy} <span className="text-xs font-normal text-text-muted">bits</span></p>
            </div>
            <div className="p-4 bg-bg-page border border-border-subtle rounded-lg text-center">
              <p className="text-xs text-text-muted font-mono uppercase">Strength Rating</p>
              <p className={`text-2xl font-bold font-mono mt-1 ${getScoreColor().split(" ")[0]}`}>
                {analysis.scoreLabel}
              </p>
            </div>
            <div className="p-4 bg-bg-page border border-border-subtle rounded-lg text-center">
              <p className="text-xs text-text-muted font-mono uppercase">Character Length</p>
              <p className="text-2xl font-bold font-mono text-text-primary mt-1">{password.length}</p>
            </div>
          </div>

          {/* Character Pool Checklist */}
          <div className="mb-6 p-4 rounded-lg bg-bg-page border border-border-subtle">
            <p className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-3">
              Character Pool Breakdown:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className={`p-2 rounded border font-mono text-xs flex items-center justify-between ${analysis.hasLower ? "border-success/30 bg-success/10 text-success" : "border-border-subtle text-text-muted"}`}>
                <span>Lowercase (a-z)</span>
                <span>{analysis.hasLower ? "✓" : "✗"}</span>
              </div>
              <div className={`p-2 rounded border font-mono text-xs flex items-center justify-between ${analysis.hasUpper ? "border-success/30 bg-success/10 text-success" : "border-border-subtle text-text-muted"}`}>
                <span>Uppercase (A-Z)</span>
                <span>{analysis.hasUpper ? "✓" : "✗"}</span>
              </div>
              <div className={`p-2 rounded border font-mono text-xs flex items-center justify-between ${analysis.hasDigits ? "border-success/30 bg-success/10 text-success" : "border-border-subtle text-text-muted"}`}>
                <span>Numbers (0-9)</span>
                <span>{analysis.hasDigits ? "✓" : "✗"}</span>
              </div>
              <div className={`p-2 rounded border font-mono text-xs flex items-center justify-between ${analysis.hasSymbols ? "border-success/30 bg-success/10 text-success" : "border-border-subtle text-text-muted"}`}>
                <span>Symbols (!@#)</span>
                <span>{analysis.hasSymbols ? "✓" : "✗"}</span>
              </div>
            </div>
          </div>

          {/* Cracking Time Estimates */}
          <div className="mb-6 p-4 rounded-lg bg-bg-page border border-border-subtle">
            <p className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-3">
              Estimated Brute-Force Crack Times:
            </p>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-bg-card border border-border-subtle">
                <span className="text-text-secondary">Dedicated GPU Cluster (100B H/s):</span>
                <span className="text-accent font-bold">{analysis.crackTimeOffline}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-bg-card border border-border-subtle">
                <span className="text-text-secondary">Throttled Web Login (100 req/s):</span>
                <span className="text-text-primary">{analysis.crackTimeOnline}</span>
              </div>
            </div>
          </div>

          {/* Security Warnings */}
          {analysis.warnings.length > 0 && (
            <div className="p-4 rounded-lg bg-bg-page border border-warning/30">
              <p className="text-xs font-mono uppercase text-warning font-semibold mb-2">
                Security Recommendations:
              </p>
              <ul className="space-y-1 text-xs text-text-secondary font-mono">
                {analysis.warnings.map((w, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-warning">⚠</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </ToolLayout>
  );
}