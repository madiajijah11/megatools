"use client";

import { useState, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface HarEntry {
  id: string;
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    headers: { name: string; value: string }[];
    queryString: { name: string; value: string }[];
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    headers: { name: string; value: string }[];
    content: { size: number; mimeType: string; text?: string };
    bodySize: number;
  };
  timings: {
    blocked?: number;
    dns?: number;
    connect?: number;
    ssl?: number;
    send?: number;
    wait?: number;
    receive?: number;
  };
}

const SAMPLE_HAR: { log: { entries: HarEntry[] } } = {
  log: {
    entries: [
      {
        id: "1",
        startedDateTime: "2026-09-15T08:20:00.100Z",
        time: 145,
        request: {
          method: "GET",
          url: "https://megatools-tau.vercel.app/api/v1/health",
          headers: [
            { name: "Accept", value: "application/json" },
            { name: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
          ],
          queryString: [],
          bodySize: 0,
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [
            { name: "Content-Type", value: "application/json; charset=utf-8" },
            { name: "Cache-Control", value: "s-maxage=3600, stale-while-revalidate" },
            { name: "Server", value: "Vercel" },
          ],
          content: {
            size: 420,
            mimeType: "application/json",
            text: '{"status":"healthy","uptime":382910,"region":"iad1"}',
          },
          bodySize: 420,
        },
        timings: {
          blocked: 1.2,
          dns: 14.5,
          connect: 22.1,
          ssl: 35.4,
          send: 0.8,
          wait: 52.0,
          receive: 19.0,
        },
      },
      {
        id: "2",
        startedDateTime: "2026-09-15T08:20:00.250Z",
        time: 85,
        request: {
          method: "GET",
          url: "https://megatools-tau.vercel.app/_next/static/chunks/main-app.js",
          headers: [{ name: "Accept", value: "*/*" }],
          queryString: [{ name: "v", value: "2.4.0" }],
          bodySize: 0,
        },
        response: {
          status: 200,
          statusText: "OK",
          headers: [
            { name: "Content-Type", value: "application/javascript" },
            { name: "CF-Cache-Status", value: "HIT" },
          ],
          content: { size: 148200, mimeType: "application/javascript" },
          bodySize: 45200,
        },
        timings: {
          blocked: 0.5,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 0.4,
          wait: 18.2,
          receive: 66.0,
        },
      },
      {
        id: "3",
        startedDateTime: "2026-09-15T08:20:00.320Z",
        time: 210,
        request: {
          method: "POST",
          url: "https://megatools-tau.vercel.app/api/auth/token",
          headers: [
            { name: "Content-Type", value: "application/json" },
            { name: "Authorization", value: "Bearer sk-sample-token" },
          ],
          queryString: [],
          bodySize: 128,
        },
        response: {
          status: 401,
          statusText: "Unauthorized",
          headers: [{ name: "Content-Type", value: "application/json" }],
          content: {
            size: 85,
            mimeType: "application/json",
            text: '{"error":"Invalid credentials provided"}',
          },
          bodySize: 85,
        },
        timings: {
          blocked: 2.1,
          dns: 12.0,
          connect: 28.0,
          ssl: 42.0,
          send: 1.1,
          wait: 115.0,
          receive: 9.8,
        },
      },
      {
        id: "4",
        startedDateTime: "2026-09-15T08:20:00.410Z",
        time: 62,
        request: {
          method: "GET",
          url: "https://megatools-tau.vercel.app/favicon.ico",
          headers: [],
          queryString: [],
          bodySize: 0,
        },
        response: {
          status: 304,
          statusText: "Not Modified",
          headers: [{ name: "ETag", value: '"8420-1a2b3c"' }],
          content: { size: 0, mimeType: "image/x-icon" },
          bodySize: 0,
        },
        timings: {
          blocked: 0.2,
          dns: 0,
          connect: 0,
          ssl: 0,
          send: 0.3,
          wait: 60.5,
          receive: 1.0,
        },
      },
    ],
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function HarViewerClient() {
  const [entries, setEntries] = useState<HarEntry[]>(SAMPLE_HAR.log.entries);
  const [selectedEntryId, setSelectedEntryId] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>("sample-network.har");

  const parseHarFile = useCallback((content: string, name: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.log && Array.isArray(parsed.log.entries)) {
        const mapped = parsed.log.entries.map((e: HarEntry, idx: number) => ({
          ...e,
          id: e.id || String(idx + 1),
        }));
        setEntries(mapped);
        setFileName(name);
        if (mapped.length > 0) setSelectedEntryId(mapped[0].id);
      }
    } catch {
      alert("Invalid HAR file format. Please upload a valid .har JSON export.");
    }
  }, []);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseHarFile(text, file.name);
    };
    reader.readAsText(file);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!e.request.url.toLowerCase().includes(q) && !e.request.method.toLowerCase().includes(q)) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "ALL") {
        const statusStr = String(e.response.status);
        if (!statusStr.startsWith(statusFilter[0])) return false;
      }

      // Type
      if (typeFilter !== "ALL") {
        const mime = (e.response.content?.mimeType || "").toLowerCase();
        if (typeFilter === "XHR" && !mime.includes("json") && !mime.includes("xml")) return false;
        if (typeFilter === "JS" && !mime.includes("javascript")) return false;
        if (typeFilter === "CSS" && !mime.includes("css")) return false;
        if (typeFilter === "IMG" && !mime.includes("image")) return false;
      }

      return true;
    });
  }, [entries, searchQuery, statusFilter, typeFilter]);

  const selectedEntry = useMemo(() => {
    return entries.find((e) => e.id === selectedEntryId) || entries[0] || null;
  }, [entries, selectedEntryId]);

  const maxDuration = useMemo(() => {
    return Math.max(...entries.map((e) => e.time), 1);
  }, [entries]);

  const totalTransferred = useMemo(() => {
    return entries.reduce((acc, e) => acc + (e.response.bodySize > 0 ? e.response.bodySize : e.response.content.size || 0), 0);
  }, [entries]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Requests:</span>
        <span className="text-accent font-bold">{entries.length} requests</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Transferred Data:</span>
        <span className="text-text-primary">{formatBytes(totalTransferred)}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Max Request Time:</span>
        <span className="text-warning font-bold">{Math.round(maxDuration)} ms</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Privacy:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="har-viewer" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Upload & Active File Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Active Log:</span>
            <span className="font-bold text-accent">{fileName}</span>
            <span className="text-text-muted">({entries.length} items)</span>
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/15 text-accent"
                : "border-border-subtle bg-bg-page text-text-secondary hover:border-accent hover:text-accent"
            }`}
          >
            + Upload .har File
            <input
              type="file"
              accept=".har,application/json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter URLs or HTTP methods..."
            className="flex-1 min-w-[200px] rounded-lg border border-border-subtle bg-bg-page p-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px] mr-1">Status:</span>
            {["ALL", "2xx", "3xx", "4xx", "5xx"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-0.5 rounded border text-[11px] font-mono transition-colors ${
                  statusFilter === s
                    ? "border-accent text-accent bg-accent/10 font-bold"
                    : "border-border-subtle text-text-muted hover:text-text-secondary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px] mr-1">Type:</span>
            {["ALL", "XHR", "JS", "CSS", "IMG"].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded border text-[11px] font-mono transition-colors ${
                  typeFilter === t
                    ? "border-accent text-accent bg-accent/10 font-bold"
                    : "border-border-subtle text-text-muted hover:text-text-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Waterfall Table */}
        <div className="space-y-1.5">
          <div className="h-8 px-3 bg-bg-page/60 border border-border-subtle rounded-t-lg flex items-center justify-between text-[11px] text-text-muted">
            <span className="w-16 shrink-0">Method</span>
            <span className="w-16 shrink-0">Status</span>
            <span className="flex-1 truncate mx-2">URL Resource</span>
            <span className="w-20 text-right shrink-0">Transferred</span>
            <span className="w-32 text-right shrink-0">Waterfall Timeline</span>
          </div>

          <div className="divide-y divide-border-subtle border border-border-subtle bg-bg-page rounded-b-lg max-h-[320px] overflow-y-auto text-xs">
            {filteredEntries.map((e) => {
              const isSelected = e.id === selectedEntryId;
              const is2xx = e.response.status >= 200 && e.response.status < 300;
              const is3xx = e.response.status >= 300 && e.response.status < 400;
              const is4xx = e.response.status >= 400 && e.response.status < 500;
              const is5xx = e.response.status >= 500;

              const urlName = e.request.url.split("/").pop()?.split("?")[0] || e.request.url;
              const widthPct = Math.max(4, (e.time / maxDuration) * 100);

              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedEntryId(e.id)}
                  className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-accent/15 text-text-primary"
                      : "hover:bg-bg-card text-text-secondary"
                  }`}
                >
                  <span className="w-16 shrink-0 font-bold text-accent">{e.request.method}</span>
                  <span
                    className={`w-16 shrink-0 font-bold ${
                      is2xx
                        ? "text-success"
                        : is3xx
                        ? "text-cyan-300"
                        : is4xx
                        ? "text-warning"
                        : is5xx
                        ? "text-error"
                        : "text-text-muted"
                    }`}
                  >
                    {e.response.status}
                  </span>
                  <span className="flex-1 truncate mx-2 font-mono text-[11px]" title={e.request.url}>
                    {urlName} <span className="text-text-muted text-[10px]">({e.request.url})</span>
                  </span>
                  <span className="w-20 text-right shrink-0 text-[11px] text-text-muted font-mono">
                    {formatBytes(e.response.bodySize > 0 ? e.response.bodySize : e.response.content.size || 0)}
                  </span>
                  <div className="w-32 shrink-0 flex items-center justify-end gap-1.5">
                    <div className="w-20 bg-border-subtle h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-accent h-full rounded-full transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted font-mono w-10 text-right">
                      {Math.round(e.time)}ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Request Inspector */}
        {selectedEntry && (
          <div className="pt-3 border-t border-border-subtle space-y-3">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary truncate">
                Request Details: <strong className="text-accent">{selectedEntry.request.method}</strong> {selectedEntry.request.url}
              </span>
              <CopyButton text={selectedEntry.request.url} label="Copy URL" />
            </div>

            {/* Timings Breakdown Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2 rounded bg-bg-page border border-border-subtle">
                <span className="text-text-muted text-[10px] block">DNS Lookup</span>
                <span className="font-bold text-purple-300">{selectedEntry.timings.dns || 0} ms</span>
              </div>
              <div className="p-2 rounded bg-bg-page border border-border-subtle">
                <span className="text-text-muted text-[10px] block">TCP Connect</span>
                <span className="font-bold text-amber-300">{selectedEntry.timings.connect || 0} ms</span>
              </div>
              <div className="p-2 rounded bg-bg-page border border-border-subtle">
                <span className="text-text-muted text-[10px] block">SSL Handshake</span>
                <span className="font-bold text-cyan-300">{selectedEntry.timings.ssl || 0} ms</span>
              </div>
              <div className="p-2 rounded bg-bg-page border border-border-subtle">
                <span className="text-text-muted text-[10px] block">TTFB (Wait)</span>
                <span className="font-bold text-accent">{selectedEntry.timings.wait || 0} ms</span>
              </div>
              <div className="p-2 rounded bg-bg-page border border-border-subtle">
                <span className="text-text-muted text-[10px] block">Content Download</span>
                <span className="font-bold text-success">{selectedEntry.timings.receive || 0} ms</span>
              </div>
            </div>

            {/* Response Headers */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-text-primary block">
                Response Headers ({selectedEntry.response.headers.length})
              </span>
              <div className="p-3 rounded-lg border border-border-subtle bg-bg-page text-xs space-y-1 max-h-40 overflow-y-auto">
                {selectedEntry.response.headers.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5 border-b border-border-subtle/30 last:border-0">
                    <span className="text-accent font-bold w-40 shrink-0">{h.name}:</span>
                    <span className="text-text-secondary break-all flex-1">{h.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Content Preview */}
            {selectedEntry.response.content.text && (
              <div className="space-y-1.5">
                <div className="h-8 flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">Response Payload Body</span>
                  <CopyButton text={selectedEntry.response.content.text} label="Copy Body" />
                </div>
                <pre className="p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-48 overflow-y-auto leading-relaxed">
                  {selectedEntry.response.content.text}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
