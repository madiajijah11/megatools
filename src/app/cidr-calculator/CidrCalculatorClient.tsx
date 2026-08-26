"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface CidrInfo {
  network: string;
  broadcast: string;
  netmask: string;
  wildcard: string;
  firstHost: string;
  lastHost: string;
  totalAddresses: number;
  usableHosts: string;
  ipClass: string;
  scope: "Private" | "Public";
}

function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

function parseCidr(input: string): CidrInfo | null {
  const m = input.trim().match(
    /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/
  );
  if (!m) return null;
  const octets = [m[1], m[2], m[3], m[4]].map(Number);
  const prefix = Number(m[5]);
  if (octets.some((o) => o < 0 || o > 255)) return null;
  if (prefix > 32) return null;

  const ip =
    (((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (ip & mask) >>> 0;
  const hostBits = 32 - prefix;
  const total = Math.pow(2, hostBits);
  const broadcast = (network + total - 1) >>> 0;
  const usable = total - 2;

  // RFC1918
  const isPrivate =
    (octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168));

  let cls: string;
  if (octets[0] < 128) cls = "A";
  else if (octets[0] < 192) cls = "B";
  else if (octets[0] < 224) cls = "C";
  else if (octets[0] < 240) cls = "D";
  else cls = "E";

  return {
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    netmask: intToIp(mask),
    wildcard: intToIp(~mask >>> 0),
    firstHost:
      prefix >= 31 ? intToIp(network) : intToIp((network + 1) >>> 0),
    lastHost:
      prefix >= 31 ? intToIp(broadcast) : intToIp((broadcast - 1) >>> 0),
    totalAddresses: total,
    usableHosts:
      prefix === 32 ? "1" : prefix === 31 ? "2" : usable.toLocaleString(),
    ipClass: cls,
    scope: isPrivate ? "Private" : "Public",
  };
}

export default function CidrCalculatorClient() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input), 150);
    return () => clearTimeout(t);
  }, [input]);

  const result = useMemo(() => parseCidr(debounced), [debounced]);
  const error = debounced.trim() !== "" && !result;

  const rows: [string, string][] = result
    ? [
        ["Network address", result.network],
        ["Broadcast address", result.broadcast],
        ["Netmask", result.netmask],
        ["Wildcard mask", result.wildcard],
        ["First usable host", result.firstHost],
        ["Last usable host", result.lastHost],
        ["Total addresses", result.totalAddresses.toLocaleString()],
        ["Usable hosts", result.usableHosts],
        ["IP class", `Class ${result.ipClass}`],
      ]
    : [];

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Total addresses</p>
        <p className="text-text-primary font-mono">
          {result ? result.totalAddresses.toLocaleString() : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Usable hosts</p>
        <p className="text-text-primary font-mono">
          {result ? result.usableHosts : "—"}
        </p>
      </div>
      <div className="col-span-2">
        <p className="text-text-muted text-xs">Type</p>
        <p className="text-text-primary font-mono">
          {result ? `${result.scope} · Class ${result.ipClass}` : "—"}
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
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">CIDR Calculator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              IPv4 subnet calculator. Everything stays in your browser.
            </p>
          </div>

          <label
            htmlFor="cidr-input"
            className="mb-2 block text-sm font-medium text-text-secondary"
          >
            CIDR notation
          </label>
          <input
            id="cidr-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="192.168.1.0/24"
            spellCheck={false}
            className="input-field font-mono text-sm"
          />
          {error && (
            <p className="mt-2 text-sm text-error">
              Invalid CIDR — use the form x.x.x.x/p with octets 0–255 and
              prefix 0–32.
            </p>
          )}

          {rows.length > 0 && (
            <div className="mt-6 space-y-3">
              {rows.map(([label, value]) => (
                <div key={label} className="flex flex-wrap items-center gap-2">
                  <span className="w-40 shrink-0 text-sm font-semibold text-accent">
                    {label}
                  </span>
                  <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary">
                    {value}
                  </code>
                  <CopyButton text={value.replace(/\s*\(.*\)$/, "")} label="copy" />
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-40 shrink-0 text-sm font-semibold text-accent">
                  Scope
                </span>
                <code
                  className={`min-w-0 flex-1 break-all rounded border bg-bg-page px-3 py-2 text-xs sm:text-sm ${
                    result!.scope === "Private"
                      ? "border-warning/40 text-warning"
                      : "border-success/40 text-success"
                  }`}
                >
                  {result!.scope}
                </code>
                <CopyButton text={result!.scope} label="copy" />
              </div>
            </div>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="cidr-calculator" stats={stats} />
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
        <InfoPanel toolId="cidr-calculator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
