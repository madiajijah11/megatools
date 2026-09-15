"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

function expandIPv6(ip: string): string[] | null {
  let clean = ip.trim().toLowerCase();
  if (!clean) return null;

  // Handle IPv4-mapped IPv6 like ::ffff:192.168.1.1
  if (clean.includes(".")) {
    const lastColon = clean.lastIndexOf(":");
    const v4Part = clean.slice(lastColon + 1);
    const v4Octets = v4Part.split(".").map(Number);
    if (v4Octets.length !== 4 || v4Octets.some((o) => isNaN(o) || o < 0 || o > 255)) {
      return null;
    }
    const hex1 = ((v4Octets[0] << 8) | v4Octets[1]).toString(16).padStart(4, "0");
    const hex2 = ((v4Octets[2] << 8) | v4Octets[3]).toString(16).padStart(4, "0");
    clean = clean.slice(0, lastColon) + `:${hex1}:${hex2}`;
  }

  const parts = clean.split("::");
  if (parts.length > 2) return null;

  let head = parts[0] ? parts[0].split(":") : [];
  let tail = parts[1] ? parts[1].split(":") : [];

  if (parts.length === 1) {
    if (head.length !== 8) return null;
  } else {
    const missing = 8 - (head.length + tail.length);
    if (missing < 0) return null;
    const zeros = Array(missing).fill("0000");
    head = [...head, ...zeros, ...tail];
  }

  const result: string[] = [];
  for (const group of head) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    result.push(group.padStart(4, "0"));
  }

  return result.length === 8 ? result : null;
}

function compressIPv6(groups: string[]): string {
  const shortGroups = groups.map((g) => parseInt(g, 16).toString(16));

  // Find longest run of zeros
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  for (let i = 0; i < shortGroups.length; i++) {
    if (shortGroups[i] === "0") {
      if (curStart === -1) {
        curStart = i;
        curLen = 1;
      } else {
        curLen++;
      }
    } else {
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
      curStart = -1;
      curLen = 0;
    }
  }
  if (curLen > bestLen) {
    bestStart = curStart;
    bestLen = curLen;
  }

  if (bestLen > 1) {
    const left = shortGroups.slice(0, bestStart).join(":");
    const right = shortGroups.slice(bestStart + bestLen).join(":");
    return `${left}::${right}`;
  }

  return shortGroups.join(":");
}

function getScope(expanded: string[]): string {
  const firstGroup = parseInt(expanded[0], 16);
  const hex = expanded.join("");

  if (hex === "00000000000000000000000000000001") return "Loopback (::1/128)";
  if (hex === "00000000000000000000000000000000") return "Unspecified (::/128)";
  if (hex.startsWith("00000000000000000000ffff")) return "IPv4-mapped (::ffff:0:0/96)";
  if (firstGroup >= 0xfe80 && firstGroup <= 0xfebf) return "Link-Local Unicast (fe80::/10)";
  if (firstGroup >= 0xfc00 && firstGroup <= 0xfdff) return "Unique Local (fc00::/7)";
  if (firstGroup >= 0xff00 && firstGroup <= 0xffff) return "Multicast (ff00::/8)";
  if (firstGroup >= 0x2000 && firstGroup <= 0x3fff) return "Global Unicast (2000::/3)";

  return "Reserved / Unassigned";
}

function getReverseDns(expanded: string[], prefix: number): string {
  const nibbles = expanded.join("").split("");
  const neededNibbles = Math.ceil(prefix / 4);
  return (
    nibbles
      .slice(0, neededNibbles)
      .reverse()
      .join(".") + ".ip6.arpa"
  );
}

export default function Ipv6CalculatorClient() {
  const [inputIp, setInputIp] = useState("2001:db8:85a3::8a2e:370:7334/64");
  const calc = useMemo(() => {
    let raw = inputIp.trim();
    let prefix = 64;

    if (raw.includes("/")) {
      const [ipPart, prefixPart] = raw.split("/");
      raw = ipPart;
      const p = parseInt(prefixPart, 10);
      if (!isNaN(p) && p >= 0 && p <= 128) {
        prefix = p;
      }
    }

    const expanded = expandIPv6(raw);
    if (!expanded) {
      return { error: "Invalid IPv6 address format", expanded: null };
    }

    const fullExpanded = expanded.join(":");
    const compressed = compressIPv6(expanded);
    const scope = getScope(expanded);
    const reverseDns = getReverseDns(expanded, prefix);

    // Subnet count
    const hostBits = 128 - prefix;
    let totalAddresses = "";
    if (hostBits <= 60) {
      totalAddresses = Math.pow(2, hostBits).toLocaleString();
    } else {
      totalAddresses = `2^${hostBits} (${(Math.pow(2, hostBits % 10) * Math.pow(10, Math.floor(hostBits * 0.30103))).toExponential(2)})`;
    }

    const subnets64 = prefix <= 64 ? Math.pow(2, 64 - prefix).toLocaleString() : "1 / (Sub-64)";

    return {
      error: null,
      expanded: fullExpanded,
      compressed,
      prefix,
      scope,
      reverseDns,
      totalAddresses,
      subnets64,
    };
  }, [inputIp]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Prefix Length</p>
        <p className="text-accent font-mono font-bold">/{calc.prefix || 64}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Status</p>
        <p className={`font-mono text-xs font-bold ${calc.error ? "text-error" : "text-success"}`}>
          {calc.error ? "SYNTAX ERR" : "VALID IPV6"}
        </p>
      </div>
      <div className="col-span-2">
        <p className="text-text-muted text-xs">Address Scope</p>
        <p className="text-text-primary font-mono text-xs truncate">{calc.scope || "—"}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="ipv6-calculator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              IPv6 / Prefix Input:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInputIp("2001:db8:abcd:0012::1/64")}
                className="text-xs text-text-muted hover:text-accent font-mono"
              >
                [Documentation]
              </button>
              <button
                type="button"
                onClick={() => setInputIp("fe80::1/10")}
                className="text-xs text-text-muted hover:text-accent font-mono"
              >
                [Link-Local]
              </button>
              <button
                type="button"
                onClick={() => setInputIp("::1/128")}
                className="text-xs text-text-muted hover:text-accent font-mono"
              >
                [Loopback]
              </button>
              <button
                type="button"
                onClick={() => setInputIp("::ffff:192.168.1.1/96")}
                className="text-xs text-text-muted hover:text-accent font-mono"
              >
                [IPv4-Mapped]
              </button>
            </div>
          </div>

          {/* Input Box */}
          <div className="mb-6">
            <input
              type="text"
              value={inputIp}
              onChange={(e) => setInputIp(e.target.value)}
              placeholder="e.g. 2001:db8::1/64"
              className={`w-full rounded-lg bg-bg-page border p-4 font-mono text-base text-text-primary focus:outline-none ${
                calc.error ? "border-error" : "border-border-subtle focus:border-accent"
              }`}
            />
            {calc.error && <p className="mt-2 text-xs font-mono text-error">{calc.error}</p>}
          </div>

          {/* Results Grid */}
          {!calc.error && (
            <div className="space-y-3">
              <div className="p-3 bg-bg-page rounded-lg border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-mono text-text-muted uppercase">Full Expanded Form (32 hex digits):</p>
                  <p className="text-xs font-mono font-bold text-accent mt-0.5 break-all">{calc.expanded}</p>
                </div>
                <CopyButton text={calc.expanded || ""} />
              </div>

              <div className="p-3 bg-bg-page rounded-lg border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-mono text-text-muted uppercase">RFC 5952 Compressed / Canonical:</p>
                  <p className="text-xs font-mono font-bold text-text-primary mt-0.5 break-all">{calc.compressed}</p>
                </div>
                <CopyButton text={calc.compressed || ""} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-bg-page rounded-lg border border-border-subtle">
                  <p className="text-[11px] font-mono text-text-muted uppercase">Address Scope:</p>
                  <p className="text-xs font-mono text-text-secondary mt-1">{calc.scope}</p>
                </div>
                <div className="p-3 bg-bg-page rounded-lg border border-border-subtle">
                  <p className="text-[11px] font-mono text-text-muted uppercase">Subnets (/64 equivalent):</p>
                  <p className="text-xs font-mono text-text-secondary mt-1">{calc.subnets64}</p>
                </div>
              </div>

              <div className="p-3 bg-bg-page rounded-lg border border-border-subtle">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-mono text-text-muted uppercase">Total Available IP Addresses in Prefix:</p>
                </div>
                <p className="text-xs font-mono text-accent mt-1 break-all">{calc.totalAddresses}</p>
              </div>

              <div className="p-3 bg-bg-page rounded-lg border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-mono text-text-muted uppercase">Reverse DNS Zone (PTR / ip6.arpa):</p>
                  <p className="text-xs font-mono text-text-secondary mt-0.5 break-all">{calc.reverseDns}</p>
                </div>
                <CopyButton text={calc.reverseDns || ""} />
              </div>
            </div>
          )}
      </div>
    </ToolLayout>
  );
}