"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Role = "owner" | "group" | "others";
type Perm = "read" | "write" | "execute";

interface Permissions {
  owner: { read: boolean; write: boolean; execute: boolean };
  group: { read: boolean; write: boolean; execute: boolean };
  others: { read: boolean; write: boolean; execute: boolean };
  special: { setuid: boolean; setgid: boolean; sticky: boolean };
}

const PRESETS = [
  { label: "755 (Exec/Web)", octal: "0755" },
  { label: "644 (Read File)", octal: "0644" },
  { label: "700 (Private)", octal: "0700" },
  { label: "600 (Secret/Key)", octal: "0600" },
  { label: "777 (Full Access)", octal: "0777" },
];

export default function ChmodCalculatorClient() {
  const [perms, setPerms] = useState<Permissions>({
    owner: { read: true, write: true, execute: true },
    group: { read: true, write: false, execute: true },
    others: { read: true, write: false, execute: true },
    special: { setuid: false, setgid: false, sticky: false },
  });
  const [reverseInput, setReverseInput] = useState("");
  const [reverseError, setReverseError] = useState(false);

  const toggle = (role: Role, perm: Perm) => {
    setPerms((prev) => ({
      ...prev,
      [role]: { ...prev[role], [perm]: !prev[role][perm] },
    }));
  };

  const toggleSpecial = (key: "setuid" | "setgid" | "sticky") => {
    setPerms((prev) => ({
      ...prev,
      special: { ...prev.special, [key]: !prev.special[key] },
    }));
  };

  const getOctalDigit = (r: { read: boolean; write: boolean; execute: boolean }) =>
    (r.read ? 4 : 0) + (r.write ? 2 : 0) + (r.execute ? 1 : 0);

  const specialDigit =
    (perms.special.setuid ? 4 : 0) +
    (perms.special.setgid ? 2 : 0) +
    (perms.special.sticky ? 1 : 0);

  const standardOctal = `${getOctalDigit(perms.owner)}${getOctalDigit(perms.group)}${getOctalDigit(perms.others)}`;
  const octal = `${specialDigit}${standardOctal}`;

  const getSymbolic = () => {
    let o = perms.owner.execute
      ? perms.special.setuid
        ? "s"
        : "x"
      : perms.special.setuid
      ? "S"
      : "-";
    let g = perms.group.execute
      ? perms.special.setgid
        ? "s"
        : "x"
      : perms.special.setgid
      ? "S"
      : "-";
    let ot = perms.others.execute
      ? perms.special.sticky
        ? "t"
        : "x"
      : perms.special.sticky
      ? "T"
      : "-";

    return (
      (perms.owner.read ? "r" : "-") +
      (perms.owner.write ? "w" : "-") +
      o +
      (perms.group.read ? "r" : "-") +
      (perms.group.write ? "w" : "-") +
      g +
      (perms.others.read ? "r" : "-") +
      (perms.others.write ? "w" : "-") +
      ot
    );
  };

  const handleApplyOctal = (oct: string) => {
    let clean = oct.replace(/^0+/, "");
    if (clean.length === 3) clean = "0" + clean;
    if (clean.length !== 4) return;

    const s = parseInt(clean[0], 8);
    const u = parseInt(clean[1], 8);
    const g = parseInt(clean[2], 8);
    const o = parseInt(clean[3], 8);

    setPerms({
      special: {
        setuid: Boolean(s & 4),
        setgid: Boolean(s & 2),
        sticky: Boolean(s & 1),
      },
      owner: { read: Boolean(u & 4), write: Boolean(u & 2), execute: Boolean(u & 1) },
      group: { read: Boolean(g & 4), write: Boolean(g & 2), execute: Boolean(g & 1) },
      others: { read: Boolean(o & 4), write: Boolean(o & 2), execute: Boolean(o & 1) },
    });
  };

  const handleReverse = (val: string) => {
    setReverseInput(val);
    const trimmed = val.trim();
    if (/^[0-7]{3,4}$/.test(trimmed)) {
      handleApplyOctal(trimmed.padStart(4, "0"));
      setReverseError(false);
    } else if (trimmed) {
      setReverseError(true);
    } else {
      setReverseError(false);
    }
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Octal Notation:</span>
        <span className="text-accent font-bold">{octal} ({standardOctal})</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Symbolic:</span>
        <span className="text-text-primary">{getSymbolic()}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Special Bits:</span>
        <span className={specialDigit > 0 ? "text-warning font-bold" : "text-text-muted"}>
          {specialDigit > 0 ? `Active (${specialDigit})` : "None"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="chmod-calculator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
          <span className="text-xs text-text-muted">Quick Linux Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.octal}
                type="button"
                onClick={() => handleApplyOctal(p.octal)}
                className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                [{p.label}]
              </button>
            ))}
          </div>
        </div>

        {/* Calculated Results Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between">
            <div>
              <span className="text-text-muted text-[10px] block">Octal Chmod Mode:</span>
              <span className="text-xl font-bold text-accent">{octal}</span>
            </div>
            <CopyButton text={`chmod ${octal} filename`} label="Copy chmod" />
          </div>

          <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between">
            <div>
              <span className="text-text-muted text-[10px] block">Symbolic Notation:</span>
              <span className="text-xl font-bold text-text-primary">{getSymbolic()}</span>
            </div>
            <CopyButton text={getSymbolic()} label="Copy Symbol" />
          </div>
        </div>

        {/* Permissions Interactive Matrix Grid */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <span className="text-xs font-semibold text-text-primary block">
            Permission Bits Matrix
          </span>

          <div className="grid grid-cols-3 gap-3">
            {(["owner", "group", "others"] as Role[]).map((role) => (
              <div key={role} className="p-3 rounded-lg border border-border-subtle bg-bg-page space-y-2">
                <span className="text-xs font-bold text-accent uppercase block border-b border-border-subtle pb-1">
                  {role}
                </span>

                {(["read", "write", "execute"] as Perm[]).map((perm) => (
                  <label key={perm} className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer capitalize">
                    <input
                      type="checkbox"
                      checked={perms[role][perm]}
                      onChange={() => toggle(role, perm)}
                      className="accent-accent cursor-pointer"
                    />
                    <span>{perm} ({perm === "read" ? "4" : perm === "write" ? "2" : "1"})</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Special Sticky / SUID / SGID bits */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <span className="text-xs font-semibold text-text-primary block">
            Special Permissions (SUID / SGID / Sticky)
          </span>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer p-2.5 rounded bg-bg-page border border-border-subtle">
              <input
                type="checkbox"
                checked={perms.special.setuid}
                onChange={() => toggleSpecial("setuid")}
                className="accent-accent cursor-pointer"
              />
              <span>SetUID (4)</span>
            </label>
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer p-2.5 rounded bg-bg-page border border-border-subtle">
              <input
                type="checkbox"
                checked={perms.special.setgid}
                onChange={() => toggleSpecial("setgid")}
                className="accent-accent cursor-pointer"
              />
              <span>SetGID (2)</span>
            </label>
            <label className="flex items-center gap-2 text-text-secondary cursor-pointer p-2.5 rounded bg-bg-page border border-border-subtle">
              <input
                type="checkbox"
                checked={perms.special.sticky}
                onChange={() => toggleSpecial("sticky")}
                className="accent-accent cursor-pointer"
              />
              <span>Sticky Bit (1)</span>
            </label>
          </div>
        </div>

        {/* Reverse Octal Input */}
        <div className="pt-2 border-t border-border-subtle space-y-1.5">
          <label className="text-xs font-semibold text-text-primary block">
            Type Octal to Inspect (e.g. 755 or 0644)
          </label>
          <input
            type="text"
            value={reverseInput}
            onChange={(e) => handleReverse(e.target.value)}
            placeholder="Type 755, 644, 700 to update matrix..."
            className={`w-full rounded-lg border bg-bg-page p-2.5 font-mono text-xs text-text-primary focus:outline-none ${
              reverseError ? "border-error" : "border-border-subtle focus:border-accent"
            }`}
          />
          {reverseError && (
            <span className="text-[11px] text-error">Invalid octal permission format.</span>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
