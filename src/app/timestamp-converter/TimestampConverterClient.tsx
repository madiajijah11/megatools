"use client";

import { useState, useEffect, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(d: Date): {
  iso: string;
  utc: string;
  local: string;
  relative: string;
} {
  const iso = d.toISOString();
  const utc = d.toUTCString();
  const local =
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    " " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds());

  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  let relative: string;
  const abs = Math.abs(diffSec);
  if (abs < 60) {
    relative = `${abs}s ${diffSec >= 0 ? "ago" : "from now"}`;
  } else if (abs < 3600) {
    relative = `${Math.round(abs / 60)}m ${diffSec >= 0 ? "ago" : "from now"}`;
  } else if (abs < 86400) {
    relative = `${Math.round(abs / 3600)}h ${diffSec >= 0 ? "ago" : "from now"}`;
  } else {
    relative = `${Math.round(abs / 86400)}d ${diffSec >= 0 ? "ago" : "from now"}`;
  }

  return { iso, utc, local, relative };
}

export default function TimestampConverterClient() {
  const [now, setNow] = useState<number>(0);
  const [input, setInput] = useState<string>("");
  const [dateInput, setDateInput] = useState<string>("");

  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const parsed = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    if (isNaN(num)) {
      return { error: "Not a valid numeric timestamp (seconds or ms)." };
    }
    const ms = trimmed.length <= 11 ? num * 1000 : num;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return { error: "Timestamp out of range." };

    return {
      d,
      seconds: Math.floor(ms / 1000),
      millis: ms,
      unit: trimmed.length <= 11 ? "seconds" : "milliseconds",
      ...formatDate(d),
    };
  }, [input]);

  const fromDateResult = useMemo(() => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return { error: "Invalid date format." };
    const sec = Math.floor(d.getTime() / 1000);
    const ms = d.getTime();
    return { d, sec, ms, ...formatDate(d) };
  }, [dateInput]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Current Unix Sec:</span>
        <span className="text-accent font-bold">{now}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Unit:</span>
        <span className="text-text-primary">{parsed && !("error" in parsed) ? parsed.unit : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Time Delta:</span>
        <span className="text-success font-bold">{parsed && !("error" in parsed) ? parsed.relative : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Precision:</span>
        <span className="text-text-primary">Millisecond accurate</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="timestamp-converter" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Live Unix Epoch Ticker */}
        <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-text-muted block text-[11px]">Current Epoch Unix Timestamp:</span>
            <span className="text-lg font-bold text-accent">{now}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInput(String(now))}
              className="px-3 py-1 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
            >
              Use Current Time
            </button>
            <CopyButton text={String(now)} label="Copy Epoch" />
          </div>
        </div>

        {/* Timestamp to Date Converter */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Unix Timestamp → Human Date</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInput("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
            </div>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter seconds (e.g. 1700000000) or milliseconds (e.g. 1700000000000)..."
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          {parsed && "error" in parsed && (
            <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
              {parsed.error}
            </div>
          )}

          {parsed && !("error" in parsed) && (
            <div className="p-3 rounded-lg border border-border-subtle bg-bg-page space-y-2 text-xs">
              {[
                { label: "ISO 8601", value: parsed.iso },
                { label: "UTC Date", value: parsed.utc },
                { label: "Local Time", value: parsed.local },
                { label: "Relative", value: parsed.relative },
                { label: "Seconds", value: String(parsed.seconds) },
                { label: "Milliseconds", value: String(parsed.millis) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-1 border-b border-border-subtle/40 last:border-0">
                  <span className="text-text-muted w-24 shrink-0">{label}:</span>
                  <span className="text-text-primary font-bold break-all flex-1">{value}</span>
                  <CopyButton text={value} label="Copy" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date to Timestamp Converter */}
        <div className="space-y-3 pt-3 border-t border-border-subtle">
          <span className="font-semibold text-text-primary text-xs block">
            Human Date / String → Unix Timestamp
          </span>
          <input
            type="text"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            placeholder="e.g. 2026-09-04T12:00:00Z or September 4, 2026..."
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />

          {fromDateResult && "error" in fromDateResult && (
            <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
              {fromDateResult.error}
            </div>
          )}

          {fromDateResult && !("error" in fromDateResult) && (
            <div className="p-3 rounded-lg border border-border-subtle bg-bg-page space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-border-subtle/40">
                <span className="text-text-muted w-24">Seconds:</span>
                <span className="text-accent font-bold flex-1">{fromDateResult.sec}</span>
                <CopyButton text={String(fromDateResult.sec)} label="Copy" />
              </div>
              <div className="flex items-center justify-between py-1 border-b border-border-subtle/40">
                <span className="text-text-muted w-24">Milliseconds:</span>
                <span className="text-text-primary font-bold flex-1">{fromDateResult.ms}</span>
                <CopyButton text={String(fromDateResult.ms)} label="Copy" />
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-text-muted w-24">UTC Date:</span>
                <span className="text-text-primary flex-1">{fromDateResult.utc}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
