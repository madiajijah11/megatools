"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

const PRESETS = [
  { label: "Every 5 Minutes", expr: "*/5 * * * *" },
  { label: "Every Hour at :00", expr: "0 * * * *" },
  { label: "Daily at Midnight (00:00)", expr: "0 0 * * *" },
  { label: "Weekdays at 9:00 AM", expr: "0 9 * * 1-5" },
  { label: "First of Every Month (02:00)", expr: "0 2 1 * *" },
  { label: "Every Sunday at 04:30 AM", expr: "30 4 * * 0" },
  { label: "Quarterly on 1st at 00:00", expr: "0 0 1 1,4,7,10 *" },
];

function parseCronPart(part: string, min: number, max: number): Set<number> {
  const result = new Set<number>();
  if (part === "*") {
    for (let i = min; i <= max; i++) result.add(i);
    return result;
  }

  const subParts = part.split(",");
  for (const sp of subParts) {
    if (sp.includes("/")) {
      const [rangeStr, stepStr] = sp.split("/");
      const step = parseInt(stepStr, 10);
      let start = min;
      let end = max;
      if (rangeStr !== "*") {
        if (rangeStr.includes("-")) {
          const [r1, r2] = rangeStr.split("-");
          start = parseInt(r1, 10);
          end = parseInt(r2, 10);
        } else {
          start = parseInt(rangeStr, 10);
        }
      }
      for (let i = start; i <= end; i += step) {
        result.add(i);
      }
    } else if (sp.includes("-")) {
      const [r1, r2] = sp.split("-");
      const start = parseInt(r1, 10);
      const end = parseInt(r2, 10);
      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      const val = parseInt(sp, 10);
      if (!isNaN(val) && val >= min && val <= max) {
        result.add(val);
      }
    }
  }

  return result;
}

function getNextCronExecutions(
  cronExpr: string,
  count = 20,
  startDate = new Date()
): { dates: Date[]; error: string | null } {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { dates: [], error: "Cron expression must have exactly 5 fields (minute hour day-of-month month day-of-week)." };
  }

  try {
    const minutes = parseCronPart(parts[0], 0, 59);
    const hours = parseCronPart(parts[1], 0, 23);
    const daysOfMonth = parseCronPart(parts[2], 1, 31);
    const months = parseCronPart(parts[3], 1, 12);
    const daysOfWeek = parseCronPart(parts[4], 0, 6); // 0 = Sunday

    if (!minutes.size || !hours.size || !daysOfMonth.size || !months.size || !daysOfWeek.size) {
      return { dates: [], error: "Invalid range values inside cron fields." };
    }

    const nextDates: Date[] = [];
    const current = new Date(startDate.getTime());
    current.setSeconds(0);
    current.setMilliseconds(0);
    current.setMinutes(current.getMinutes() + 1); // start at next minute

    let iterations = 0;
    const maxIterations = 525600; // max 1 year search in minutes

    while (nextDates.length < count && iterations < maxIterations) {
      const month = current.getMonth() + 1;
      const day = current.getDate();
      const dayOfWeek = current.getDay();
      const hour = current.getHours();
      const minute = current.getMinutes();

      if (
        months.has(month) &&
        daysOfMonth.has(day) &&
        daysOfWeek.has(dayOfWeek) &&
        hours.has(hour) &&
        minutes.has(minute)
      ) {
        nextDates.push(new Date(current.getTime()));
      }

      current.setMinutes(current.getMinutes() + 1);
      iterations++;
    }

    return { dates: nextDates, error: null };
  } catch (err) {
    return { dates: [], error: (err as Error).message };
  }
}

function describeCron(cronExpr: string): string {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron format";

  const [min, hr, dom, mon, dow] = parts;
  let text = "Runs ";

  if (min === "*" && hr === "*") {
    text += "every minute";
  } else if (min.startsWith("*/")) {
    text += `every ${min.replace("*/", "")} minutes`;
  } else if (hr === "*") {
    text += `at minute ${min} of every hour`;
  } else {
    text += `at ${hr.padStart(2, "0")}:${min.padStart(2, "0")}`;
  }

  if (dom !== "*") {
    text += ` on day ${dom} of the month`;
  }

  if (mon !== "*") {
    text += ` in month ${mon}`;
  }

  if (dow !== "*") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (dow === "1-5") {
      text += " on weekdays (Mon-Fri)";
    } else if (dow.includes(",")) {
      text += ` on ${dow.split(",").map((d) => days[Number(d)] || d).join(", ")}`;
    } else {
      text += ` on ${days[Number(dow)] || dow}`;
    }
  }

  return text;
}

export default function CronSimulatorClient() {
  const [cronInput, setCronInput] = useState<string>("0 9 * * 1-5");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { dates: nextExecutions, error } = useMemo(() => {
    return getNextCronExecutions(cronInput, 20, currentTime);
  }, [cronInput, currentTime]);

  const scheduleDescription = useMemo(() => {
    return describeCron(cronInput);
  }, [cronInput]);

  const nextExecutionDate = nextExecutions[0] || null;

  const countdownSec = nextExecutionDate
    ? Math.max(0, Math.floor((nextExecutionDate.getTime() - currentTime.getTime()) / 1000))
    : 0;

  const countdownText = useMemo(() => {
    const hours = Math.floor(countdownSec / 3600);
    const mins = Math.floor((countdownSec % 3600) / 60);
    const secs = countdownSec % 60;
    return `${hours}h ${mins}m ${secs}s`;
  }, [countdownSec]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Next Trigger:</span>
        <span className="text-accent font-bold">{countdownText}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Calculated Events:</span>
        <span className="text-text-primary">{nextExecutions.length} next occurrences</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Status:</span>
        <span className={error ? "text-error font-bold" : "text-success font-bold"}>
          {error ? "SYNTAX ERROR" : "ACTIVE SCHEDULE"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="cron-simulator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle text-xs">
          <span className="text-text-muted">Crontab Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.expr}
                type="button"
                onClick={() => setCronInput(p.expr)}
                className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                [{p.label}]
              </button>
            ))}
          </div>
        </div>

        {/* Cron Input & Human Description */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Standard 5-Field Cron Expression</span>
            <CopyButton text={cronInput} label="Copy Cron" />
          </div>

          <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page space-y-2">
            <input
              type="text"
              value={cronInput}
              onChange={(e) => setCronInput(e.target.value)}
              placeholder="* * * * *"
              className="w-full bg-transparent font-mono text-xl sm:text-2xl font-bold text-accent tracking-widest focus:outline-none"
            />
            <div className="grid grid-cols-5 text-[10px] text-text-muted font-mono border-t border-border-subtle/40 pt-1.5">
              <span>MINUTE (0-59)</span>
              <span>HOUR (0-23)</span>
              <span>DAY (1-31)</span>
              <span>MONTH (1-12)</span>
              <span>WEEKDAY (0-6)</span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            ⚠ {error}
          </div>
        )}

        {/* Schedule Explanation & Live Trigger Countdown */}
        {!error && (
          <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-text-muted text-[10px] block uppercase">Plain English Schedule</span>
              <span className="text-sm font-bold text-text-primary block">{scheduleDescription}</span>
            </div>
            <div className="text-right">
              <span className="text-text-muted text-[10px] block uppercase">Countdown to Next Trigger</span>
              <span className="text-base font-bold text-accent block">{countdownText}</span>
            </div>
          </div>
        )}

        {/* Next 20 Executions Table */}
        {!error && nextExecutions.length > 0 && (
          <div className="pt-2 border-t border-border-subtle space-y-3">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                Next 20 Upcoming Execution Timestamps
              </span>
              <CopyButton
                text={nextExecutions
                  .map((d, idx) => `#${idx + 1}: ${d.toISOString()} (Local: ${d.toLocaleString()})`)
                  .join("\n")}
                label="Copy All Dates"
              />
            </div>

            <div className="divide-y divide-border-subtle border border-border-subtle bg-bg-page rounded-lg max-h-[340px] overflow-y-auto text-xs">
              {nextExecutions.map((date, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-bg-card/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded bg-bg-card border border-border-subtle text-accent font-bold flex items-center justify-center text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-text-primary block">{date.toLocaleString()}</span>
                      <span className="text-[10px] text-text-muted font-mono">{date.toISOString()} (UTC)</span>
                    </div>
                  </div>
                  <CopyButton text={date.toISOString()} label="Copy ISO" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
