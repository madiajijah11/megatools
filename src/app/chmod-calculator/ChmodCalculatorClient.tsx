"use client";

import { useState } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type Bit = "read" | "write" | "exec";
type Perm = Record<Bit, boolean>;
type Who = "owner" | "group" | "public";

const WHO_LABELS: Record<Who, string> = {
  owner: "Owner",
  group: "Group",
  public: "Public",
};
const WHOS = Object.keys(WHO_LABELS) as Who[];
const BITS: { key: Bit; label: string; value: number }[] = [
  { key: "read", label: "Read", value: 4 },
  { key: "write", label: "Write", value: 2 },
  { key: "exec", label: "Execute", value: 1 },
];
// special bit applied to each class: setuid(owner), setgid(group), sticky(public)
const CLASS_SPECIAL = [4, 2, 1];
const SPECIAL_BITS: { mask: number; label: string }[] = [
  { mask: 4, label: "Setuid" },
  { mask: 2, label: "Setgid" },
  { mask: 1, label: "Sticky" },
];

const permValue = (p: Perm) =>
  (p.read ? 4 : 0) + (p.write ? 2 : 0) + (p.exec ? 1 : 0);

export default function ChmodCalculatorClient() {
  const [perms, setPerms] = useState<Perm[]>([
    { read: true, write: true, exec: true },
    { read: true, write: false, exec: true },
    { read: true, write: false, exec: true },
  ]);
  const [special, setSpecial] = useState(0);
  const [reverseInput, setReverseInput] = useState("");
  const [reverseError, setReverseError] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const octal =
    (special > 0 ? String(special) : "") +
    perms.map((p) => permValue(p)).join("");
  const symbolic = perms
    .map((p, i) => {
      const sp = (special & CLASS_SPECIAL[i]) !== 0;
      const last = sp
        ? p.exec
          ? i === 2
            ? "t"
            : "s"
          : i === 2
            ? "T"
            : "S"
        : p.exec
          ? "x"
          : "-";
      return `${p.read ? "r" : "-"}${p.write ? "w" : "-"}${last}`;
    })
    .join("");
  const granted =
    perms.reduce(
      (n, p) => n + (p.read ? 1 : 0) + (p.write ? 1 : 0) + (p.exec ? 1 : 0),
      0,
    ) +
    (special & 4 ? 1 : 0) +
    (special & 2 ? 1 : 0) +
    (special & 1 ? 1 : 0);

  const toggle = (i: number, bit: Bit) =>
    setPerms((ps) =>
      ps.map((p, j) => (j === i ? { ...p, [bit]: !p[bit] } : p)),
    );

  const handleReverse = (raw: string) => {
    const value = raw.trim();
    setReverseInput(value);
    if (value === "") {
      setReverseError(false);
      return;
    }
    if (!/^[0-7]{3,4}$/.test(value)) {
      setReverseError(true);
      return;
    }
    setReverseError(false);
    const digits = value.split("").map(Number);
    const base = digits.length === 4 ? digits.slice(1) : digits;
    setSpecial(digits.length === 4 ? digits[0] : 0);
    setPerms(
      base.map((d) => ({
        read: (d & 4) !== 0,
        write: (d & 2) !== 0,
        exec: (d & 1) !== 0,
      })),
    );
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Octal</p>
        <p className="text-text-primary font-mono">{octal}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Symbolic</p>
        <p className="text-text-primary font-mono">{symbolic}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Permissions set</p>
        <p className="text-text-primary font-mono">{granted}/12</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Chmod Calculator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Convert between chmod octal and symbolic notation. Everything
              stays in your browser.
            </p>
          </div>

          {/* Permission checkboxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {WHOS.map((who, i) => (
              <div
                key={who}
                className="rounded-lg border border-border-subtle bg-bg-page p-4"
              >
                <p className="text-sm font-semibold text-text-primary mb-3">
                  {WHO_LABELS[who]}
                </p>
                <div className="space-y-2">
                  {BITS.map(({ key, label, value }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={perms[i][key]}
                        onChange={() => toggle(i, key)}
                        className="accent-accent w-4 h-4"
                      />
                      <span>{label}</span>
                      <span className="ml-auto font-mono text-xs text-text-muted">
                        {value}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Special bits */}
          <div className="mt-3 rounded-lg border border-border-subtle bg-bg-page p-4">
            <p className="text-sm font-semibold text-text-primary mb-3">
              Special
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {SPECIAL_BITS.map(({ mask, label }) => (
                <label
                  key={mask}
                  className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={(special & mask) !== 0}
                    onChange={() => setSpecial((s) => s ^ mask)}
                    className="accent-accent w-4 h-4"
                  />
                  <span>{label}</span>
                  <span className="font-mono text-xs text-text-muted">
                    {mask}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Outputs */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-sm font-semibold text-accent">
                octal
              </span>
              <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary">
                {octal}
              </code>
              <CopyButton text={octal} label="copy" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-sm font-semibold text-accent">
                symbolic
              </span>
              <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary">
                {symbolic}
              </code>
              <CopyButton text={symbolic} label="copy" />
            </div>
          </div>

          {/* Reverse mode */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              From octal
            </label>
            <input
              value={reverseInput}
              onChange={(e) => handleReverse(e.target.value)}
              placeholder="e.g. 644 or 4755"
              className={`input-field font-mono max-w-xs ${reverseError ? "border-error focus:border-error" : ""}`}
              aria-invalid={reverseError}
            />
            {reverseError && (
              <p className="mt-1 text-xs text-error">
                Invalid octal — use 3–4 digits, each 0–7.
              </p>
            )}
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="chmod-calculator" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="chmod-calculator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
