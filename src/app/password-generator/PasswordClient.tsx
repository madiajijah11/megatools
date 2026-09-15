"use client";

import { useState, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const SIMILAR = "il1Lo0O";

export default function PasswordClient() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);

  const generate = useCallback(() => {
    let chars = "";
    if (useUpper) chars += UPPERCASE;
    if (useLower) chars += LOWERCASE;
    if (useNumbers) chars += NUMBERS;
    if (useSymbols) chars += SYMBOLS;

    if (excludeSimilar) {
      chars = chars
        .split("")
        .filter((c) => !SIMILAR.includes(c))
        .join("");
    }

    if (!chars) {
      setPassword("");
      return;
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const result = Array.from(array)
      .map((x) => chars[x % chars.length])
      .join("");

    setPassword(result);
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeSimilar]);

  const calculateEntropy = () => {
    let poolSize = 0;
    if (useUpper) poolSize += 26;
    if (useLower) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSymbols) poolSize += SYMBOLS.length;
    if (excludeSimilar) poolSize -= 7;
    if (poolSize <= 0) return 0;
    return Math.round(length * Math.log2(poolSize));
  };

  const getStrength = () => {
    const entropy = calculateEntropy();
    if (entropy >= 80)
      return { label: "Very Strong", color: "bg-success", text: "text-success", width: "w-full" };
    if (entropy >= 60)
      return { label: "Strong", color: "bg-accent", text: "text-accent", width: "w-3/4" };
    if (entropy >= 40)
      return { label: "Moderate", color: "bg-warning", text: "text-warning", width: "w-1/2" };
    return { label: "Weak", color: "bg-error", text: "text-error", width: "w-1/4" };
  };

  const strength = getStrength();
  const entropy = calculateEntropy();

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Length:</span>
        <span className="text-text-primary">{length} characters</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Entropy:</span>
        <span className="text-accent font-bold">~{entropy} bits</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Strength:</span>
        <span className={`font-bold ${strength.text}`}>{strength.label}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">CSPRNG:</span>
        <span className="text-success font-bold">Web Crypto API</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="password-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Password Display Field */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Generated Password</span>
            <CopyButton text={password} label="Copy Password" />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={password || "Click Generate to create secure password..."}
              placeholder="Click Generate to create password"
              className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Strength meter bar */}
          {password && (
            <div className="space-y-1 pt-1">
              <div className="h-1.5 w-full rounded-full bg-border-subtle overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-muted">
                <span>Strength: <strong className={strength.text}>{strength.label}</strong></span>
                <span>{entropy} bits of entropy</span>
              </div>
            </div>
          )}
        </div>

        {/* Password Length Slider */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Password Length</span>
            <span className="font-bold text-accent">{length} chars</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer h-1.5 bg-border-subtle rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-text-muted">
            <span>8 (Min)</span>
            <span>16 (Standard)</span>
            <span>32 (High)</span>
            <span>64 (Paranoid)</span>
          </div>
        </div>

        {/* Character Set Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle text-xs">
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={useUpper}
              onChange={(e) => setUseUpper(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <span>Uppercase Letters (A-Z)</span>
          </label>
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={useLower}
              onChange={(e) => setUseLower(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <span>Lowercase Letters (a-z)</span>
          </label>
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={useNumbers}
              onChange={(e) => setUseNumbers(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <span>Numbers (0-9)</span>
          </label>
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={useSymbols}
              onChange={(e) => setUseSymbols(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <span>Special Symbols (!@#$%)</span>
          </label>
          <label className="flex items-center gap-2 text-text-secondary cursor-pointer sm:col-span-2">
            <input
              type="checkbox"
              checked={excludeSimilar}
              onChange={(e) => setExcludeSimilar(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <span>Exclude Ambiguous Characters (i, l, 1, L, o, 0, O)</span>
          </label>
        </div>

        {/* Generate Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={generate}
            className="w-full py-2.5 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
          >
            Generate Secure Password
          </button>
        </div>
      </div>
    </ToolLayout>
  );
}
