"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const MS_THRESHOLD = 1e11;

function relativeTime(date: Date, now: number): string {
  const diff = date.getTime() - now;
  const abs = Math.abs(diff);
  const units: [number, string][] = [
    [31_536_000_000, "year"],
    [2_592_000_000, "month"],
    [604_800_000, "week"],
    [86_400_000, "day"],
    [3_600_000, "hour"],
    [60_000, "minute"],
    [1000, "second"],
  ];
  for (const [ms, name] of units) {
    if (abs >= ms) {
      const n = Math.round(abs / ms);
      return `${n} ${name}${n === 1 ? "" : "s"} ${diff < 0 ? "ago" : "from now"}`;
    }
  }
  return "just now";
}

export default function TimestampConverterClient() {
  const [input, setInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setNow(Date.now()));
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);

  // Section A: unix → date
  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    if (!/^-?\d+$/.test(input.trim()))
      return { error: "Not a number. Enter seconds or milliseconds." };
    let ts = Number(input.trim());
    const unit = Math.abs(ts) > MS_THRESHOLD ? "milliseconds" : "seconds";
    if (unit === "milliseconds") ts = Math.round(ts);
    else ts *= 1000;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return { error: "Timestamp out of Date range." };
    return { date: d, unit };
  }, [input]);

  // Section B: date → unix
  const reverse = useMemo(() => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return { sec: Math.floor(d.getTime() / 1000), ms: d.getTime() };
  }, [dateInput]);

  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Detected unit</p>
        <p className="text-text-primary font-mono">
          {parsed && !parsed.error ? parsed.unit : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Timezone</p>
        <p className="text-text-primary font-mono break-all">{timezone}</p>
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
        <div className="card p-6 sm:p-8 space-y-8">
          <div className="mb-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Timestamp Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Convert Unix timestamps and dates. Everything stays in your browser.
            </p>
          </div>

          {/* Section A: unix → date */}
          <section>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Unix timestamp (seconds or milliseconds — auto-detected)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 1735689600"
              className="input-field font-mono text-sm"
            />
            {input.trim() === "" ? null : parsed?.error ? (
              <p className="mt-2 text-sm text-error">{parsed.error}</p>
            ) : parsed?.date ? (
              <div className="mt-3 space-y-2">
                {(
                  [
                    ["ISO 8601 UTC", parsed.date.toISOString()],
                    [
                      "Local",
                      parsed.date.toLocaleString("en-US", {
                        timeZoneName: "long",
                      }),
                    ],
                    ["Relative", relativeTime(parsed.date, now ?? 0)],
                    [
                      "Day of week",
                      parsed.date.toLocaleDateString("en-US", {
                        weekday: "long",
                      }),
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="flex flex-wrap items-center gap-2">
                    <span className="w-28 shrink-0 text-xs sm:text-sm font-semibold text-accent">
                      {label}
                    </span>
                    <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary">
                      {value}
                    </code>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* Section B: date → unix */}
          <section>
            <label className="mb-2 block text-sm font-medium text-text-secondary">
              Date &amp; time (local)
            </label>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="input-field font-mono text-sm"
            />
            {reverse ? (
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-28 shrink-0 text-xs sm:text-sm font-semibold text-accent">
                    Seconds
                  </span>
                  <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary">
                    {reverse.sec}
                  </code>
                  <CopyButton text={String(reverse.sec)} label="copy" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-28 shrink-0 text-xs sm:text-sm font-semibold text-accent">
                    Milliseconds
                  </span>
                  <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary">
                    {reverse.ms}
                  </code>
                  <CopyButton text={String(reverse.ms)} label="copy" />
                </div>
              </div>
            ) : dateInput ? (
              <p className="mt-2 text-sm text-error">Invalid date.</p>
            ) : null}
          </section>

          {/* Section C: now */}
          <section>
            <p className="mb-2 text-sm font-medium text-text-secondary">Now</p>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-28 shrink-0 text-xs sm:text-sm font-semibold text-accent">
                  Seconds
                </span>
                <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary font-mono">
                  {now !== null ? Math.floor(now / 1000) : "…"}
                </code>
                <CopyButton
                  text={now !== null ? String(Math.floor(now / 1000)) : ""}
                  label="copy"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-28 shrink-0 text-xs sm:text-sm font-semibold text-accent">
                  Milliseconds
                </span>
                <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs sm:text-sm text-text-primary font-mono">
                  {now !== null ? now : "…"}
                </code>
                <CopyButton text={now !== null ? String(now) : ""} label="copy" />
              </div>
            </div>
          </section>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="timestamp-converter" stats={stats} />
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
        <InfoPanel toolId="timestamp-converter" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
