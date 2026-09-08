"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type DnsProvider = "cloudflare" | "google";

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "CAA", "PTR"] as const;
type RecordType = typeof RECORD_TYPES[number] | "ALL";

interface DnsAnswer {
  name: string;
  type: number;
  typeName: string;
  TTL: number;
  data: string;
}

interface LookupResult {
  status: "idle" | "loading" | "success" | "error";
  domain: string;
  statusCode: number;
  statusName: string;
  dnssecValidated: boolean;
  answers: DnsAnswer[];
  latencyMs?: number;
  errorMsg?: string;
  provider: DnsProvider;
}

const TYPE_MAP: Record<number, string> = {
  1: "A",
  28: "AAAA",
  5: "CNAME",
  15: "MX",
  16: "TXT",
  2: "NS",
  6: "SOA",
  257: "CAA",
  12: "PTR",
  33: "SRV",
};

const RCODE_MAP: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR",
  2: "SERVFAIL",
  3: "NXDOMAIN",
  4: "NOTIMP",
  5: "REFUSED",
  6: "YXDOMAIN",
  7: "YXRRSET",
  8: "NXRRSET",
  9: "NOTAUTH",
  10: "NOTZONE",
};

const PRESETS = [
  "google.com",
  "cloudflare.com",
  "github.com",
  "wikipedia.org",
  "openai.com",
];
export default function DnsLookupClient() {
  const [domain, setDomain] = useState<string>("google.com");
  const [recordType, setRecordType] = useState<RecordType>("A");
  const [provider, setProvider] = useState<DnsProvider>("cloudflare");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [result, setResult] = useState<LookupResult>({
    status: "idle",
    domain: "",
    statusCode: 0,
    statusName: "",
    dnssecValidated: false,
    answers: [],
    provider: "cloudflare",
  });

  const abortRef = useRef<AbortController | null>(null);

  const executeLookup = useCallback(async (targetDomain: string, targetType: RecordType, targetProvider: DnsProvider) => {
    const cleanDomain = targetDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!cleanDomain) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setResult((prev) => ({
      ...prev,
      status: "loading",
      domain: cleanDomain,
      provider: targetProvider,
    }));

    const t0 = performance.now();

    try {
      // Types to fetch
      const typesToFetch: string[] = targetType === "ALL" ? ["A", "AAAA", "MX", "TXT", "NS", "CNAME"] : [targetType];

      const queries = typesToFetch.map(async (t) => {
        const url =
          targetProvider === "cloudflare"
            ? "https://cloudflare-dns.com/dns-query?name=" + encodeURIComponent(cleanDomain) + "&type=" + t
            : "https://dns.google/resolve?name=" + encodeURIComponent(cleanDomain) + "&type=" + t;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: targetProvider === "cloudflare" ? { accept: "application/dns-json" } : {},
        });

        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      });

      const responses = await Promise.all(queries);
      const latencyMs = Math.round(performance.now() - t0);

      const allAnswers: DnsAnswer[] = [];
      let rcode = 0;
      let ad = false;

      for (const data of responses) {
        if (typeof data.Status === "number") rcode = data.Status;
        if (data.AD) ad = true;
        if (Array.isArray(data.Answer)) {
          for (const ans of data.Answer) {
            allAnswers.push({
              name: ans.name,
              type: ans.type,
              typeName: TYPE_MAP[ans.type] || "TYPE_" + ans.type,
              TTL: ans.TTL,
              data: ans.data,
            });
          }
        }
      }

      setResult({
        status: "success",
        domain: cleanDomain,
        statusCode: rcode,
        statusName: RCODE_MAP[rcode] || "CODE_" + rcode,
        dnssecValidated: ad,
        answers: allAnswers,
        latencyMs,
        provider: targetProvider,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setResult({
        status: "error",
        domain: cleanDomain,
        statusCode: -1,
        statusName: "FAILED",
        dnssecValidated: false,
        answers: [],
        errorMsg: err instanceof Error ? err.message : "Failed to query DoH resolver.",
        provider: targetProvider,
      });
    }
  }, []);

  // Run on initial mount
  useEffect(() => {
    executeLookup("google.com", "A", "cloudflare");
  }, [executeLookup]);

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">DoH Resolver:</span>
        <span className="text-accent font-bold capitalize">{provider}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">DNSSEC Status:</span>
        <span className={"font-bold " + (result.dnssecValidated ? "text-success" : "text-text-muted")}>
          {result.dnssecValidated ? "VALIDATED (AD)" : "INSECURE / NONE"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Query Latency:</span>
        <span className="text-success font-bold">{result.latencyMs ? result.latencyMs + "ms" : "0.0ms"}</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Privacy:</span>
        <span className="text-accent font-bold">Encrypted TLS</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent transition-colors"
        >
          <span>←</span> [cd .. / home]
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
        >
          [?] Tool Info
        </button>
      </div>

      {/* Hero Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-subtle bg-bg-card font-mono text-xs text-text-secondary mb-3">
          <span className="text-accent">$</span>
          <span>megatools --dns-lookup --doh-secure</span>
          <span className="animate-pulse text-accent">▊</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          DNS over HTTPS <span className="gradient-text">Lookup & Inspector</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Perform encrypted DNS queries directly from Cloudflare (1.1.1.1) and Google (8.8.8.8) DoH resolvers. Inspect records, TTLs, and DNSSEC validation.
        </p>

        {/* Presets Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-text-muted">PRESETS:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDomain(p);
                executeLookup(p, recordType, provider);
              }}
              className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
            >
              [{p}]
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Query Controls & Records Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Query Controls Card */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-4">
            <div className="h-8 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> DNS_QUERY_PARAMETERS
              </span>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-text-muted">RESOLVER:</span>
                <button
                  onClick={() => {
                    setProvider("cloudflare");
                    executeLookup(domain, recordType, "cloudflare");
                  }}
                  className={"px-2 py-0.5 rounded transition-colors " + (
                    provider === "cloudflare"
                      ? "border border-accent bg-accent-soft text-accent font-bold"
                      : "border border-border-subtle text-text-muted hover:text-text-primary"
                  )}
                >
                  Cloudflare
                </button>
                <button
                  onClick={() => {
                    setProvider("google");
                    executeLookup(domain, recordType, "google");
                  }}
                  className={"px-2 py-0.5 rounded transition-colors " + (
                    provider === "google"
                      ? "border border-accent bg-accent-soft text-accent font-bold"
                      : "border border-border-subtle text-text-muted hover:text-text-primary"
                  )}
                >
                  Google
                </button>
              </div>
            </div>

            {/* Input & Lookup Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeLookup(domain, recordType, provider);
              }}
              className="flex flex-wrap sm:flex-nowrap gap-2"
            >
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="domain.com (e.g. google.com, vercel.com)..."
                className="flex-1 bg-bg-page border border-border-subtle rounded px-3 py-2 font-mono text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={result.status === "loading"}
                className="text-xs font-mono px-4 py-2 rounded bg-accent text-bg-page font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 cursor-pointer shrink-0"
              >
                {result.status === "loading" ? "Querying..." : "Dig Records"}
              </button>
            </form>

            {/* Record Type Selector Badges */}
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs pt-1 border-t border-border-subtle">
              <span className="text-text-muted text-[11px] mr-1">TYPE:</span>
              <button
                onClick={() => {
                  setRecordType("ALL");
                  executeLookup(domain, "ALL", provider);
                }}
                className={"px-2 py-0.5 rounded transition-colors " + (
                  recordType === "ALL"
                    ? "border border-accent bg-accent-soft text-accent font-bold"
                    : "border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary"
                )}
              >
                ALL
              </button>
              {RECORD_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setRecordType(t);
                    executeLookup(domain, t, provider);
                  }}
                  className={"px-2 py-0.5 rounded transition-colors " + (
                    recordType === t
                      ? "border border-accent bg-accent-soft text-accent font-bold"
                      : "border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 font-mono space-y-4">
            {/* Header baseline standard */}
            <div className="h-8 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> RESOLVER_RESPONSES
              </span>
              <div className="flex items-center gap-2">
                {result.status === "success" && (
                  <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded " + (
                    result.statusCode === 0
                      ? "bg-success/15 text-success border border-success/30"
                      : "bg-error/15 text-error border border-error/30"
                  )}>
                    [{result.statusName}]
                  </span>
                )}
                {result.dnssecValidated && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/30">
                    [DNSSEC: OK]
                  </span>
                )}
              </div>
            </div>

            {/* Error view */}
            {result.status === "error" && (
              <div className="p-4 rounded bg-error/10 border border-error/30 text-xs text-error">
                <p className="font-bold">DNS Query Failed</p>
                <p className="mt-1 text-text-secondary">{result.errorMsg}</p>
              </div>
            )}

            {/* Empty view */}
            {result.status === "success" && result.answers.length === 0 && (
              <div className="p-8 rounded bg-bg-page border border-border-subtle text-center text-xs space-y-1">
                <p className="text-text-primary font-bold">No Records Returned</p>
                <p className="text-text-muted text-[11px]">
                  The resolver replied with status <code className="text-accent">{result.statusName}</code> but no <code className="text-accent">{recordType}</code> records exist for this host.
                </p>
              </div>
            )}

            {/* Records List Table */}
            {result.status === "success" && result.answers.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-muted text-[11px]">
                      <th className="py-2 px-2.5">Type</th>
                      <th className="py-2 px-2.5">Host / Subdomain</th>
                      <th className="py-2 px-2.5">TTL</th>
                      <th className="py-2 px-2.5">Data / Target Value</th>
                      <th className="py-2 px-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {result.answers.map((ans, idx) => (
                      <tr key={idx} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-2 px-2.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/30">
                            {ans.typeName}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-text-secondary">{ans.name}</td>
                        <td className="py-2 px-2.5 text-text-muted">{ans.TTL}s</td>
                        <td className="py-2 px-2.5 text-text-primary font-bold break-all">
                          {ans.data}
                        </td>
                        <td className="py-2 px-2.5 text-right">
                          <CopyButton text={ans.data} label="copy" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Info Panel Desktop */}
        <div className="hidden lg:block">
          <InfoPanel toolId="dns-lookup" stats={stats} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="dns-lookup" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
