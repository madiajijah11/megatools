"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const CHAR_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

type CharType = keyof typeof CHAR_SETS;

function generatePassword(
  length: number,
  options: Record<CharType, boolean>
): string {
  let pool = "";
  const required: string[] = [];

  for (const [key, enabled] of Object.entries(options)) {
    if (enabled) {
      const chars = CHAR_SETS[key as CharType];
      pool += chars;
      required.push(chars[Math.floor(Math.random() * chars.length)]);
    }
  }

  if (pool.length === 0) return "";

  const password: string[] = [...required];
  for (let i = password.length; i < length; i++) {
    password.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

function getStrength(
  length: number,
  options: Record<CharType, boolean>
): { label: string; color: string; width: string } {
  const enabled = Object.values(options).filter(Boolean).length;

  if (enabled === 0 || length < 6) {
    return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  }

  const score = enabled + Math.floor(length / 12);

  if (score <= 2) {
    return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  }
  if (score <= 3) {
    return { label: "Medium", color: "bg-yellow-500", width: "w-2/4" };
  }
  if (score <= 4) {
    return { label: "Strong", color: "bg-green-500", width: "w-3/4" };
  }
  return { label: "Very Strong", color: "bg-emerald-400", width: "w-full" };
}

export default function PasswordClient() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState<Record<CharType, boolean>>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    setPassword(generatePassword(length, options));
    setCopied(false);
  }, [length, options]);

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOption = (key: CharType) => {
    const enabled = Object.values(options).filter(Boolean).length;
    if (options[key] && enabled <= 1) return;
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const strength = getStrength(length, options);

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-mega-muted hover:text-mega-accent-light transition-colors mb-6 sm:mb-8"
      >
        ← Back to Tools
      </Link>

      <div className="glass rounded-2xl p-4 sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Password Generator</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-mega-muted">
            Create strong, random passwords with custom options. Everything stays
            in your browser.
          </p>
        </div>

        {/* Password output */}
        <div className="mb-4 sm:mb-6">
          <label className="mb-2 block text-sm font-medium text-mega-muted">
            Generated Password
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={password}
              readOnly
              placeholder="Click Generate..."
              className="flex-1 min-w-0 rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text placeholder-mega-muted/40 outline-none break-all"
            />
            <button
              onClick={handleCopy}
              disabled={!password}
              className="shrink-0 rounded-xl border border-mega-border px-4 sm:px-5 py-2.5 text-sm font-medium text-mega-muted transition-colors hover:border-mega-accent/50 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Strength indicator */}
        {password && (
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-mega-muted">Strength</span>
              <span className="font-medium text-mega-text">{strength.label}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-mega-dark/50 border border-mega-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
              />
            </div>
          </div>
        )}

        {/* Length slider */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-mega-muted">Length</span>
            <span className="font-medium text-mega-text">{length}</span>
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-3 accent-mega-accent touch-none"
          />
          <div className="mt-1 flex justify-between text-xs text-mega-muted/50">
            <span>4</span>
            <span>64</span>
          </div>
        </div>

        {/* Character options */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(CHAR_SETS) as CharType[]).map((key) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
                options[key]
                  ? "border-mega-accent/60 bg-mega-accent/10 text-white"
                  : "border-mega-border text-mega-muted hover:border-mega-accent/30"
              }`}
            >
              <input
                type="checkbox"
                checked={options[key]}
                onChange={() => toggleOption(key)}
                className="sr-only"
              />
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border text-xs ${
                  options[key]
                    ? "border-mega-accent bg-mega-accent text-white"
                    : "border-mega-border bg-mega-dark/50"
                }`}
              >
                {options[key] && "✓"}
              </span>
              <span className="capitalize">{key}</span>
            </label>
          ))}
        </div>

        {/* Generate button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            className="w-full sm:w-auto rounded-xl bg-mega-accent px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mega-accent-light"
          >
            Generate Password
          </button>
        </div>
      </div>
    </div>
  );
}
