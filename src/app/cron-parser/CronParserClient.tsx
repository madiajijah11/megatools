"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const PRESETS = [
  { label: "Every minute", cron: "* * * * *" },
  { label: "Every 5 minutes", cron: "*/5 * * * *" },
  { label: "Every 15 minutes", cron: "*/15 * * * *" },
  { label: "Every hour at minute 0", cron: "0 * * * *" },
  { label: "Daily at midnight", cron: "0 0 * * *" },
  { label: "Daily at 09:00 AM", cron: "0 9 * * *" },
  { label: "Every weekday (Mon-Fri) at 09:00", cron: "0 9 * * 1-5" },
  { label: "Every Sunday at midnight", cron: "0 0 * * 0" },
  { label: "1st of every month at midnight", cron: "0 0 1 * *" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
];

const ALIASES: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseField(field: string, min: number, max: number): Set<number> | null {
  const result = new Set<number>();
  const parts = field.split(",");

  for (const part of parts) {
    if (part === "*") {
      for (let i = min; i <= max; i++) result.add(i);
    } else if (part.startsWith("*/")) {
      const step = parseInt(part.slice(2), 10);
      if (isNaN(step) || step <= 0) return null;
      for (let i = min; i <= max; i += step) result.add(i);
    } else if (part.includes("-")) {
      const [rStart, rEndWithStep] = part.split("-");
      let step = 1;
      let rEndStr = rEndWithStep;
      if (rEndWithStep.includes("/")) {
        const [endStr, stepStr] = rEndWithStep.split("/");
        rEndStr = endStr;
        step = parseInt(stepStr, 10);
      }
      const start = parseInt(rStart, 10);
      const end = parseInt(rEndStr, 10);
      if (isNaN(start) || isNaN(end) || isNaN(step) || start > end || step <= 0) return null;
      for (let i = Math.max(min, start); i <= Math.min(max, end); i += step) {
        result.add(i);
      }
    } else {
      const val = parseInt(part, 10);
      if (isNaN(val) || val < min || val > max) return null;
      result.add(val);
    }
  }

  return result.size > 0 ? result : null;
}

function parseCronString(cron: string) {
  let expr = cron.trim();
  if (ALIASES[expr]) {
    expr = ALIASES[expr];
  }

  const parts = expr.split(/\s+/);
  if (parts.length !== 5) {
    return { error: "Cron expression must have exactly 5 fields (minute hour dom month dow)." };
  }

  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;

  const minutes = parseField(minStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const dom = parseField(domStr, 1, 31);
  const month = parseField(monthStr, 1, 12);
  const dow = parseField(dowStr, 0, 7); // 0 or 7 is Sunday

  if (!minutes) return { error: `Invalid minute field: '${minStr}' (must be 0-59)` };
  if (!hours) return { error: `Invalid hour field: '${hourStr}' (must be 0-23)` };
  if (!dom) return { error: `Invalid day-of-month field: '${domStr}' (must be 1-31)` };
  if (!month) return { error: `Invalid month field: '${monthStr}' (must be 1-12)` };
  if (!dow) return { error: `Invalid day-of-week field: '${dowStr}' (must be 0-7)` };

  // Normalize dow 7 to 0 (Sunday)
  if (dow.has(7)) {
    dow.delete(7);
    dow.add(0);
  }

  return {
    raw: expr,
    fields: { minStr, hourStr, domStr, monthStr, dowStr },
    sets: { minutes, hours, dom, month, dow },
    error: null,
  };
}

function getNextExecutions(sets: {
  minutes: Set<number>;
  hours: Set<number>;
  dom: Set<number>;
  month: Set<number>;
  dow: Set<number>;
}, count = 5): Date[] {
  const results: Date[] = [];
  const start = new Date();
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1); // Next minute

  const current = new Date(start);
  const maxIterations = 525600; // max 1 year ahead
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    const m = current.getMonth() + 1; // 1-12
    const d = current.getDate(); // 1-31
    const dayOfWeek = current.getDay(); // 0-6
    const h = current.getHours(); // 0-23
    const min = current.getMinutes(); // 0-59

    if (
      sets.month.has(m) &&
      sets.dom.has(d) &&
      sets.dow.has(dayOfWeek) &&
      sets.hours.has(h) &&
      sets.minutes.has(min)
    ) {
      results.push(new Date(current));
    }

    current.setMinutes(current.getMinutes() + 1);
  }

  return results;
}

function describeCron(fields: { minStr: string; hourStr: string; domStr: string; monthStr: string; dowStr: string }): string {
  const { minStr, hourStr, domStr, monthStr, dowStr } = fields;

  if (minStr === "*" && hourStr === "*" && domStr === "*" && monthStr === "*" && dowStr === "*") {
    return "Runs every minute, every hour, every day.";
  }

  const desc: string[] = [];

  // Minutes & Hours
  if (minStr === "0" && hourStr === "0") {
    desc.push("At 00:00 (midnight)");
  } else if (minStr.startsWith("*/")) {
    desc.push(`Every ${minStr.slice(2)} minutes`);
  } else if (minStr === "0") {
    desc.push(`At minute 0`);
  } else {
    desc.push(`At minute ${minStr}`);
  }

  if (hourStr.startsWith("*/")) {
    desc.push(`past every ${hourStr.slice(2)} hours`);
  } else if (hourStr !== "*" && hourStr !== "0") {
    desc.push(`at hour ${hourStr}:00`);
  }

  // Days
  if (domStr !== "*") {
    desc.push(`on day-of-month ${domStr}`);
  }

  // Months
  if (monthStr !== "*") {
    desc.push(`in month ${monthStr}`);
  }

  // Day of week
  if (dowStr === "1-5") {
    desc.push(`on weekdays (Mon through Fri)`);
  } else if (dowStr !== "*") {
    desc.push(`on day-of-week ${dowStr}`);
  }

  return desc.join(", ") + ".";
}

export default function CronParserClient() {
  const [cronInput, setCronInput] = useState("*/15 * * * *");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const parsed = useMemo(() => parseCronString(cronInput), [cronInput]);

  const upcomingDates = useMemo(() => {
    if (parsed.error || !parsed.sets) return [];
    return getNextExecutions(parsed.sets, 5);
  }, [parsed]);

  const description = useMemo(() => {
    if (parsed.error || !parsed.fields) return "";
    return describeCron(parsed.fields);
  }, [parsed]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Status</p>
        <p className={`font-mono font-bold ${parsed.error ? "text-error" : "text-success"}`}>
          {parsed.error ? "INVALID" : "SYNTAX OK"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Next Execution</p>
        <p className="text-text-primary font-mono text-xs">
          {upcomingDates[0] ? upcomingDates[0].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
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
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Cron Expression Generator & Parser</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Parse, describe crontab schedules in plain English, and calculate upcoming execution dates.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="mb-6">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary block mb-2">
              Common Presets:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setCronInput(p.cron)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    cronInput === p.cron
                      ? "bg-accent-soft text-accent border-accent"
                      : "bg-bg-page border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cron Expression Input */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Cron Expression (5 fields):
              </label>
              <CopyButton text={cronInput} />
            </div>
            <input
              type="text"
              value={cronInput}
              onChange={(e) => setCronInput(e.target.value)}
              placeholder="e.g. */15 * * * *"
              className={`w-full rounded-lg bg-bg-page border p-4 font-mono text-xl tracking-wider text-text-primary focus:outline-none ${
                parsed.error ? "border-error focus:border-error" : "border-border-subtle focus:border-accent"
              }`}
            />
            {parsed.error && (
              <p className="mt-2 text-xs font-mono text-error">{parsed.error}</p>
            )}
          </div>

          {/* Breakdown Segment Cards */}
          {parsed.fields && (
            <div className="grid grid-cols-5 gap-2 mb-6 text-center">
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg">
                <p className="text-[10px] text-text-muted uppercase font-mono">Minute</p>
                <p className="text-lg font-bold font-mono text-accent mt-1">{parsed.fields.minStr}</p>
                <p className="text-[10px] text-text-muted">0 - 59</p>
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg">
                <p className="text-[10px] text-text-muted uppercase font-mono">Hour</p>
                <p className="text-lg font-bold font-mono text-accent mt-1">{parsed.fields.hourStr}</p>
                <p className="text-[10px] text-text-muted">0 - 23</p>
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg">
                <p className="text-[10px] text-text-muted uppercase font-mono">Day (Month)</p>
                <p className="text-lg font-bold font-mono text-accent mt-1">{parsed.fields.domStr}</p>
                <p className="text-[10px] text-text-muted">1 - 31</p>
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg">
                <p className="text-[10px] text-text-muted uppercase font-mono">Month</p>
                <p className="text-lg font-bold font-mono text-accent mt-1">{parsed.fields.monthStr}</p>
                <p className="text-[10px] text-text-muted">1 - 12</p>
              </div>
              <div className="p-3 bg-bg-page border border-border-subtle rounded-lg">
                <p className="text-[10px] text-text-muted uppercase font-mono">Day (Week)</p>
                <p className="text-lg font-bold font-mono text-accent mt-1">{parsed.fields.dowStr}</p>
                <p className="text-[10px] text-text-muted">0 - 6 (Sun-Sat)</p>
              </div>
            </div>
          )}

          {/* Human Readable Explanation */}
          {description && (
            <div className="mb-6 p-4 rounded-lg bg-accent-soft border border-accent/20">
              <p className="text-xs uppercase font-mono text-accent font-semibold mb-1">
                Human Readable Translation
              </p>
              <p className="text-text-primary text-sm font-medium">{description}</p>
            </div>
          )}

          {/* Upcoming Execution Schedule */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-3">
              Next 5 Scheduled Executions:
            </h3>
            {upcomingDates.length > 0 ? (
              <div className="space-y-2">
                {upcomingDates.map((date, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs"
                  >
                    <span className="text-accent font-bold">#{idx + 1}</span>
                    <span className="text-text-primary">
                      {date.toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-text-secondary">
                      {date.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span className="text-text-muted text-[11px]">
                      (in {Math.round((date.getTime() - Date.now()) / 60000)} mins)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-text-muted">No upcoming dates computed.</p>
            )}
          </div>
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden lg:block">
          <InfoPanel toolId="cron-parser" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="cron-parser" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
