"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useEffect, useCallback, useRef } from "react";
import CopyButton from "@/components/CopyButton";

interface RdapEvent {
  eventAction: string;
  eventDate: string;
}

interface ParsedRdapData {
  handle: string;
  domainName: string;
  status: string[];
  registeredDate?: string;
  expirationDate?: string;
  lastChangedDate?: string;
  registrarName?: string;
  nameservers: string[];
  rawJson: string;
  isIp: boolean;
  ipRange?: string;
}

const PRESET_TARGETS = [
  "google.com",
  "wikipedia.org",
  "github.com",
  "1.1.1.1",
  "8.8.8.8",
];
// Determine authoritative RDAP endpoint based on query pattern
function getRdapEndpoint(target: string): string {
  const clean = target.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  // Check if IP
  const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(clean);
  const isIpv6 = clean.includes(":");
  if (isIpv4 || isIpv6) {
    return "https://rdap.arin.net/registry/ip/" + encodeURIComponent(clean);
  }

  // TLD based routing
  const parts = clean.split(".");
  const tld = parts[parts.length - 1];

  if (tld === "com") {
    return "https://rdap.verisign.com/com/v1/domain/" + encodeURIComponent(clean);
  }
  if (tld === "net") {
    return "https://rdap.verisign.com/net/v1/domain/" + encodeURIComponent(clean);
  }
  if (tld === "org") {
    return "https://rdap.publicinterestregistry.org/rdap/domain/" + encodeURIComponent(clean);
  }

  // Generic fallback via rdap.org proxy/redirector
  return "https://rdap.verisign.com/com/v1/domain/" + encodeURIComponent(clean);
}
export default function RdapLookupClient() {
  const [query, setQuery] = useState<string>("google.com");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ParsedRdapData | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "json">("summary");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);

  const executeLookup = useCallback(async (target: string) => {
    const clean = target.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!clean) return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const isIp = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(clean) || clean.includes(":");
    const endpoint = getRdapEndpoint(clean);

    try {
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: {
          Accept: "application/rdap+json, application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Record not found in authoritative RDAP database (404).");
        }
        throw new Error("HTTP " + res.status + " returned by RDAP server.");
      }

      const json = await res.json();
      const events: RdapEvent[] = Array.isArray(json.events) ? json.events : [];

      const regEvent = events.find((e) => e.eventAction === "registration");
      const expEvent = events.find((e) => e.eventAction === "expiration");
      const lastEvent = events.find((e) => e.eventAction === "last changed" || e.eventAction === "last update of RDAP database");

      let registrarName: string | undefined = undefined;
      if (Array.isArray(json.entities)) {
        for (const ent of json.entities) {
          if (Array.isArray(ent.roles) && ent.roles.includes("registrar")) {
            registrarName = ent.vcardArray?.[1]?.find((v: unknown[]) => v[0] === "fn")?.[3] || ent.handle;
            break;
          }
        }
      }

      const nameservers: string[] = Array.isArray(json.nameservers)
        ? json.nameservers.map((n: { ldhName?: string }) => n.ldhName || "").filter(Boolean)
        : [];

      setData({
        handle: json.handle || clean,
        domainName: json.ldhName || json.name || clean,
        status: Array.isArray(json.status) ? json.status : [],
        registeredDate: regEvent?.eventDate ? regEvent.eventDate.substring(0, 10) : undefined,
        expirationDate: expEvent?.eventDate ? expEvent.eventDate.substring(0, 10) : undefined,
        lastChangedDate: lastEvent?.eventDate ? lastEvent.eventDate.substring(0, 10) : undefined,
        registrarName,
        nameservers,
        rawJson: JSON.stringify(json, null, 2),
        isIp,
        ipRange: json.startAddress && json.endAddress ? json.startAddress + " - " + json.endAddress : undefined,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to query RDAP registry.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    executeLookup("google.com");
  }, [executeLookup]);

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Protocol:</span>
        <span className="text-accent font-bold">RFC 7482 / 9082 (RDAP)</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Domain Status:</span>
        <span className={"font-bold " + (data && data.status.length > 0 ? "text-success" : "text-text-muted")}>
          {data ? data.status[0]?.split(" ")[0]?.toUpperCase() || "ACTIVE" : "IDLE"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Registrar:</span>
        <span className="text-text-primary font-bold truncate max-w-[120px]">
          {data?.registrarName || "ICANN Accredited"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Security:</span>
        <span className="text-accent font-bold">Encrypted TLS REST</span>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="rdap-lookup" stats={stats}>
      <div className="space-y-4 font-mono">
        {/* Query Bar Card */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-3 font-mono text-xs">
            <div className="h-8 flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> RDAP_REGISTRY_QUERY
              </span>
              <span className="text-text-muted text-[11px]">Direct REST API</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeLookup(query);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Domain (e.g. google.com, wikipedia.org) or IP (1.1.1.1)..."
                className="flex-1 bg-bg-page border border-border-subtle rounded px-3 py-2 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded bg-accent text-bg-page font-bold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? "Querying..." : "Query RDAP"}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 font-mono space-y-4 text-xs">
            {/* Header standard: h-8 flex items-center justify-between */}
            <div className="h-8 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-bg-page border border-border-subtle rounded p-0.5">
                <button
                  onClick={() => setActiveTab("summary")}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    activeTab === "summary"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Structured Summary
                </button>
                <button
                  onClick={() => setActiveTab("json")}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    activeTab === "json"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Raw RDAP JSON
                </button>
              </div>

              {data && (
                <div className="flex items-center gap-2">
                  <CopyButton
                    text={activeTab === "json" ? data.rawJson : JSON.stringify(data, null, 2)}
                    label="copy data"
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded bg-error/10 border border-error/30 text-error space-y-1">
                <p className="font-bold">RDAP Query Failed</p>
                <p className="text-text-secondary text-[11px]">{error}</p>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="p-8 text-center text-text-muted space-y-2">
                <div className="inline-block w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <p>Connecting to authoritative registry RDAP server...</p>
              </div>
            )}

            {/* View 1: Summary Table */}
            {!loading && data && activeTab === "summary" && (
              <div className="space-y-4">
                {/* Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded bg-bg-page border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">Registered On:</span>
                    <span className="text-sm font-bold text-accent">
                      {data.registeredDate || "Not disclosed"}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-bg-page border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">Expires On:</span>
                    <span className="text-sm font-bold text-warning">
                      {data.expirationDate || "Not disclosed"}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-bg-page border border-border-subtle">
                    <span className="text-[10px] text-text-muted block">Last Updated:</span>
                    <span className="text-sm font-bold text-text-primary">
                      {data.lastChangedDate || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Details Table */}
                <div className="p-3.5 rounded bg-bg-page border border-border-subtle space-y-2.5">
                  <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted">Registry Handle:</span>
                    <code className="text-text-primary font-bold">{data.handle}</code>
                  </div>
                  {data.registrarName && (
                    <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                      <span className="text-text-muted">Registrar:</span>
                      <span className="text-text-primary font-bold">{data.registrarName}</span>
                    </div>
                  )}
                  {data.ipRange && (
                    <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                      <span className="text-text-muted">Network CIDR Range:</span>
                      <code className="text-accent font-bold">{data.ipRange}</code>
                    </div>
                  )}
                </div>

                {/* Status Flags */}
                {data.status.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-text-muted block">Registry Status Flags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.status.map((st, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded border border-border-subtle bg-bg-page text-text-secondary text-[11px]"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nameservers */}
                {data.nameservers.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-text-muted block">Authoritative Nameservers:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.nameservers.map((ns, i) => (
                        <div
                          key={i}
                          className="p-2 rounded bg-bg-page border border-border-subtle flex items-center justify-between"
                        >
                          <span className="text-text-primary font-bold text-[11px]">{ns}</span>
                          <CopyButton text={ns} label="copy" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View 2: Raw JSON */}
            {!loading && data && activeTab === "json" && (
              <div className="h-[420px] overflow-y-auto bg-bg-page border border-border-subtle rounded p-3 text-xs">
                <pre className="text-text-primary whitespace-pre-wrap break-all leading-relaxed">
                  {data.rawJson}
                </pre>
              </div>
            )}
          </div>
      </div>
    </ToolLayout>
  );
}