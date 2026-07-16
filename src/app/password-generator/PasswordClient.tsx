"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

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
    return { label: "Weak", color: "bg-error", width: "w-1/4" };
  }

  const score = enabled + Math.floor(length / 12);

  if (score <= 2) {
    return { label: "Weak", color: "bg-error", width: "w-1/4" };
  }
  if (score <= 3) {
    return { label: "Medium", color: "bg-warning", width: "w-2/4" };
  }
  if (score <= 4) {
    return { label: "Strong", color: "bg-success", width: "w-3/4" };
  }
  return { label: "Very Strong", color: "bg-success", width: "w-full" };
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Length</p>
        <p className="text-text-primary font-mono">{length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Strength</p>
        <p className="text-text-primary font-mono">{strength.label}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Char Sets</p>
        <p className="text-text-primary font-mono">
          {Object.values(options).filter(Boolean).length}
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
        ← Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Password Generator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Create strong, random passwords with custom options. Everything stays
              in your browser.
            </p>
          </div>

          {/* Password output */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Generated Password
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={password}
                readOnly
                placeholder="Click Generate..."
                className="input-field flex-1 min-w-0 font-mono"
              />
              <button
                onClick={handleCopy}
                disabled={!password}
                className="btn-secondary shrink-0 px-5"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Strength indicator */}
          {password && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Strength</span>
                <span className="font-medium text-text-primary">{strength.label}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-bg-page border border-border-subtle overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`}
                />
              </div>
            </div>
          )}

          {/* Length slider */}
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Length</span>
              <span className="font-medium text-text-primary">{length}</span>
            </div>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-3 accent-accent touch-none"
            />
            <div className="mt-1 flex justify-between text-xs text-text-muted">
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
                    ? "border-accent/60 bg-accent-soft text-text-primary"
                    : "border-border-subtle text-text-secondary hover:border-accent/30"
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
                      ? "border-accent bg-accent text-white"
                      : "border-border-subtle bg-bg-page"
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
              className="btn-primary w-full sm:w-auto px-8"
            >
              Generate Password
            </button>
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="password-generator" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl hover:bg-accent/90 transition-colors"
      >
        💡
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="password-generator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
