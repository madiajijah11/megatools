"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface CidrResult {
  ip: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: "A" | "B" | "C" | "D" | "E";
  scope: "Private" | "Public" | "Loopback" | "Link-Local" | "Multicast" | "Reserved";
}

function parseCidr(raw: string): CidrResult | null {
  const trimmed = raw.trim();
  const match = trimmed.match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/
  );
  if (!match) return null;

  const octets = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
  ];
  if (octets.some((o) => o < 0 || o > 255)) return null;

  const prefix = match[5] === undefined ? 32 : Number(match[5]);
  if (prefix < 0 || prefix > 32) return null;

  const ipInt =
    ((octets[0] << 24) >>> 0) +
    ((octets[1] << 16) >>> 0) +
    ((octets[2] << 8) >>> 0) +
    (octets[3] >>> 0);

  const maskInt =
    prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
  const wildcardInt = (~maskInt) >>> 0;

  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const toIpStr = (int: number): string =>
    [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255,
    ].join(".");

  const totalHosts = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);
  const usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

  const firstHost =
    prefix === 32
      ? toIpStr(networkInt)
      : prefix === 31
      ? toIpStr(networkInt)
      : toIpStr((networkInt + 1) >>> 0);

  const lastHost =
    prefix === 32
      ? toIpStr(networkInt)
      : prefix === 31
      ? toIpStr(broadcastInt)
      : toIpStr((broadcastInt - 1) >>> 0);

  const firstOctet = octets[0];
  let ipClass: CidrResult["ipClass"] = "C";
  if (firstOctet < 128) ipClass = "A";
  else if (firstOctet < 192) ipClass = "B";
  else if (firstOctet < 224) ipClass = "C";
  else if (firstOctet < 240) ipClass = "D";
  else ipClass = "E";

  let scope: CidrResult["scope"] = "Public";
  if (firstOctet === 10) scope = "Private";
  else if (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) scope = "Private";
  else if (firstOctet === 192 && octets[1] === 168) scope = "Private";
  else if (firstOctet === 127) scope = "Loopback";
  else if (firstOctet === 169 && octets[1] === 254) scope = "Link-Local";
  else if (firstOctet >= 224 && firstOctet < 240) scope = "Multicast";
  else if (firstOctet >= 240) scope = "Reserved";

  return {
    ip: toIpStr(ipInt),
    prefix,
    netmask: toIpStr(maskInt),
    wildcard: toIpStr(wildcardInt),
    network: toIpStr(networkInt),
    broadcast: toIpStr(broadcastInt),
    firstHost,
    lastHost,
    totalHosts,
    usableHosts,
    ipClass,
    scope,
  };
}

const PRESETS = [
  "192.168.1.0/24",
  "10.0.0.0/8",
  "172.16.0.0/16",
  "192.168.0.1/30",
];

export default function CidrCalculatorClient() {
  const [input, setInput] = useState("192.168.1.0/24");
  const [debounced, setDebounced] = useState(input);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(input), 150);
    return () => clearTimeout(timer);
  }, [input]);

  const result = useMemo(() => parseCidr(debounced), [debounced]);
  const error = debounced.trim() !== "" && !result;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total IPs:</span>
        <span className="text-accent font-bold">
          {result ? result.totalHosts.toLocaleString() : "—"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Usable Hosts:</span>
        <span className="text-success font-bold">
          {result ? result.usableHosts.toLocaleString() : "—"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Classification:</span>
        <span className="text-text-primary">
          {result ? `Class ${result.ipClass} (${result.scope})` : "—"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="cidr-calculator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
          <span className="text-xs text-text-muted">Common Subnet Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setInput(p)}
                className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                [{p}]
              </button>
            ))}
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-1.5">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">IPv4 CIDR Block / IP Address</span>
            <button
              type="button"
              onClick={() => setInput("")}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
            >
              [Clear]
            </button>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. 192.168.1.0/24 or 10.0.0.1/16..."
            className={`w-full rounded-lg border bg-bg-page p-3 font-mono text-sm text-text-primary focus:outline-none ${
              error ? "border-error" : "border-border-subtle focus:border-accent"
            }`}
          />
          {error && (
            <p className="text-xs text-error">Invalid IPv4 CIDR notation. Use standard A.B.C.D/N format.</p>
          )}
        </div>

        {/* Subnet Calculation Breakdown */}
        {result && (
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Subnet Allocation Details</span>
              <CopyButton
                text={`Network: ${result.network}/${result.prefix}\nNetmask: ${result.netmask}\nHost Range: ${result.firstHost} - ${result.lastHost}\nBroadcast: ${result.broadcast}\nUsable Hosts: ${result.usableHosts}`}
                label="Copy Summary"
              />
            </div>

            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page space-y-2 text-xs">
              {[
                { label: "Network Address", value: `${result.network}/${result.prefix}` },
                { label: "Subnet Mask", value: result.netmask },
                { label: "Wildcard Mask", value: result.wildcard },
                { label: "Usable Host Range", value: `${result.firstHost} — ${result.lastHost}` },
                { label: "Broadcast Address", value: result.broadcast },
                { label: "Usable Hosts", value: result.usableHosts.toLocaleString() },
                { label: "Total IP Addresses", value: result.totalHosts.toLocaleString() },
                { label: "IP Type & Scope", value: `Class ${result.ipClass} · ${result.scope}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-border-subtle/40 last:border-0">
                  <span className="text-text-muted w-36 shrink-0">{label}:</span>
                  <span className="text-text-primary font-bold break-all flex-1">{value}</span>
                  <CopyButton text={value} label="Copy" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
