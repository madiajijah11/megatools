// Distributed Cron Collision & Thundering Herd Analyzer Core Engine

export interface CronJobItem {
  id: string;
  name: string;
  expr: string;
  command: string;
  enabled: boolean;
  weight: number; // 1 to 5 (resource impact)
  tags?: string[];
}

export type CollisionSeverity = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "NONE";

export interface MinuteCollision {
  minuteIndex: number; // 0 to 1439
  timeStr: string; // "HH:MM"
  hour: number;
  minute: number;
  jobIds: string[];
  jobNames: string[];
  concurrency: number;
  totalWeight: number;
  severity: CollisionSeverity;
}

export interface HourlySummary {
  hour: number; // 0 to 23
  totalExecutions: number;
  maxConcurrency: number;
  collisionMinutesCount: number; // minutes with >=2 concurrent jobs
  avgConcurrency: number;
}

export interface FleetAnalysisResult {
  totalJobs: number;
  activeJobs: number;
  totalDailyTriggers: number;
  peakConcurrency: number;
  peakTimestamp: string;
  peakWeight: number;
  riskIndex: number; // 0 to 100
  riskGrade: "A" | "B" | "C" | "D" | "F";
  criticalCollisionsCount: number; // concurrency >= 5
  highCollisionsCount: number; // concurrency 3-4
  moderateCollisionsCount: number; // concurrency 2
  hourlySummaries: HourlySummary[];
  topCollisions: MinuteCollision[];
  allMinuteCounts: number[]; // 1440 numbers for high-speed charts
  allMinuteWeights: number[]; // 1440 numbers for weight load
}

// -------------------------------------------------------------
// Cron Parser Helper (Evaluates if expression matches given time)
// -------------------------------------------------------------

export function parseCronField(field: string, min: number, max: number): Set<number> {
  const values = new Set<number>();
  if (field === "*" || field === "?") {
    for (let i = min; i <= max; i++) values.add(i);
    return values;
  }

  const items = field.split(",");
  for (const item of items) {
    if (item.includes("/")) {
      const [rangePart, stepPart] = item.split("/");
      const step = parseInt(stepPart, 10);
      if (isNaN(step) || step <= 0) continue;

      let start = min;
      let end = max;
      if (rangePart !== "*") {
        if (rangePart.includes("-")) {
          const [r1, r2] = rangePart.split("-");
          start = parseInt(r1, 10);
          end = parseInt(r2, 10);
        } else {
          start = parseInt(rangePart, 10);
        }
      }
      for (let v = start; v <= end; v += step) {
        if (v >= min && v <= max) values.add(v);
      }
    } else if (item.includes("-")) {
      const [r1, r2] = item.split("-");
      const start = parseInt(r1, 10);
      const end = parseInt(r2, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let v = start; v <= end; v++) {
          if (v >= min && v <= max) values.add(v);
        }
      }
    } else {
      const v = parseInt(item, 10);
      if (!isNaN(v) && v >= min && v <= max) {
        values.add(v);
      }
    }
  }

  return values;
}

export interface ParsedCron {
  valid: boolean;
  error?: string;
  minutes: Set<number>;
  hours: Set<number>;
  daysOfMonth: Set<number>;
  months: Set<number>;
  daysOfWeek: Set<number>;
}

export function parseCronExpression(expr: string): ParsedCron {
  const parts = expr.trim().split(/\s+/);
  if (parts.length < 5) {
    return {
      valid: false,
      error: "Cron expression requires 5 fields (minute hour day-of-month month day-of-week).",
      minutes: new Set(),
      hours: new Set(),
      daysOfMonth: new Set(),
      months: new Set(),
      daysOfWeek: new Set(),
    };
  }

  try {
    const minutes = parseCronField(parts[0], 0, 59);
    const hours = parseCronField(parts[1], 0, 23);
    const daysOfMonth = parseCronField(parts[2], 1, 31);
    const months = parseCronField(parts[3], 1, 12);
    const daysOfWeek = parseCronField(parts[4], 0, 7); // 0 or 7 = Sunday
    // normalize 7 to 0
    if (daysOfWeek.has(7)) {
      daysOfWeek.delete(7);
      daysOfWeek.add(0);
    }

    if (minutes.size === 0 || hours.size === 0 || daysOfMonth.size === 0 || months.size === 0 || daysOfWeek.size === 0) {
      return {
        valid: false,
        error: "One or more cron fields evaluated to empty ranges.",
        minutes,
        hours,
        daysOfMonth,
        months,
        daysOfWeek,
      };
    }

    return {
      valid: true,
      minutes,
      hours,
      daysOfMonth,
      months,
      daysOfWeek,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Invalid cron syntax",
      minutes: new Set(),
      hours: new Set(),
      daysOfMonth: new Set(),
      months: new Set(),
      daysOfWeek: new Set(),
    };
  }
}

// -------------------------------------------------------------
// Fleet Simulation & Analysis
// -------------------------------------------------------------

export function analyzeCronFleet(
  jobs: CronJobItem[],
  referenceDate: Date = new Date()
): FleetAnalysisResult {
  const activeJobs = jobs.filter((j) => j.enabled);
  const parsedJobs: { job: CronJobItem; parsed: ParsedCron }[] = [];

  for (const job of activeJobs) {
    const parsed = parseCronExpression(job.expr);
    if (parsed.valid) {
      parsedJobs.push({ job, parsed });
    }
  }

  const allMinuteCounts = new Array<number>(1440).fill(0);
  const allMinuteWeights = new Array<number>(1440).fill(0);
  const minuteJobMap: { ids: string[]; names: string[] }[] = Array.from(
    { length: 1440 },
    () => ({ ids: [], names: [] })
  );

  // We evaluate simulation for a representative 24h daily window
  // Day of month, month, day of week from referenceDate
  const dom = referenceDate.getDate();
  const month = referenceDate.getMonth() + 1; // 1-12
  const dow = referenceDate.getDay(); // 0-6

  let totalDailyTriggers = 0;

  for (let mIdx = 0; mIdx < 1440; mIdx++) {
    const hour = Math.floor(mIdx / 60);
    const minute = mIdx % 60;

    for (const { job, parsed } of parsedJobs) {
      if (!parsed.daysOfMonth.has(dom) && parsed.daysOfMonth.size < 31) continue;
      if (!parsed.months.has(month) && parsed.months.size < 12) continue;
      if (!parsed.daysOfWeek.has(dow) && parsed.daysOfWeek.size < 7) continue;

      if (parsed.hours.has(hour) && parsed.minutes.has(minute)) {
        allMinuteCounts[mIdx]++;
        allMinuteWeights[mIdx] += Math.max(1, job.weight || 1);
        minuteJobMap[mIdx].ids.push(job.id);
        minuteJobMap[mIdx].names.push(job.name);
        totalDailyTriggers++;
      }
    }
  }

  // Calculate collisions and metrics
  let peakConcurrency = 0;
  let peakTimestamp = "00:00";
  let peakWeight = 0;
  let criticalCollisionsCount = 0; // >= 5
  let highCollisionsCount = 0; // 3-4
  let moderateCollisionsCount = 0; // 2

  const allCollisions: MinuteCollision[] = [];

  for (let mIdx = 0; mIdx < 1440; mIdx++) {
    const count = allMinuteCounts[mIdx];
    const weight = allMinuteWeights[mIdx];
    const hour = Math.floor(mIdx / 60);
    const minute = mIdx % 60;
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    if (count > peakConcurrency) {
      peakConcurrency = count;
      peakTimestamp = timeStr;
      peakWeight = weight;
    }

    let severity: CollisionSeverity = "NONE";
    if (count >= 5) {
      severity = "CRITICAL";
      criticalCollisionsCount++;
    } else if (count >= 3) {
      severity = "HIGH";
      highCollisionsCount++;
    } else if (count === 2) {
      severity = "MODERATE";
      moderateCollisionsCount++;
    } else if (count === 1) {
      severity = "LOW";
    }

    if (count >= 2) {
      allCollisions.push({
        minuteIndex: mIdx,
        timeStr,
        hour,
        minute,
        jobIds: minuteJobMap[mIdx].ids,
        jobNames: minuteJobMap[mIdx].names,
        concurrency: count,
        totalWeight: weight,
        severity,
      });
    }
  }

  // Hourly breakdowns
  const hourlySummaries: HourlySummary[] = [];
  for (let h = 0; h < 24; h++) {
    let hourTriggers = 0;
    let maxConc = 0;
    let collisionMinutes = 0;

    for (let m = 0; m < 60; m++) {
      const idx = h * 60 + m;
      const count = allMinuteCounts[idx];
      hourTriggers += count;
      if (count > maxConc) maxConc = count;
      if (count >= 2) collisionMinutes++;
    }

    hourlySummaries.push({
      hour: h,
      totalExecutions: hourTriggers,
      maxConcurrency: maxConc,
      collisionMinutesCount: collisionMinutes,
      avgConcurrency: Number((hourTriggers / 60).toFixed(2)),
    });
  }

  // Sort top collisions by concurrency descending, then weight descending
  const topCollisions = [...allCollisions].sort(
    (a, b) => b.concurrency - a.concurrency || b.totalWeight - a.totalWeight
  );

  // Compute Risk Index (0-100)
  // Factors: peak concurrency ratio, number of critical/high clashes, weighted collision percentage
  let riskScore = 0;
  if (peakConcurrency >= 8) riskScore += 50;
  else if (peakConcurrency >= 5) riskScore += 35;
  else if (peakConcurrency >= 3) riskScore += 20;
  else if (peakConcurrency >= 2) riskScore += 10;

  riskScore += Math.min(30, criticalCollisionsCount * 6);
  riskScore += Math.min(20, highCollisionsCount * 3);
  riskScore += Math.min(10, moderateCollisionsCount * 0.5);

  const riskIndex = Math.min(100, Math.round(riskScore));

  let riskGrade: "A" | "B" | "C" | "D" | "F" = "A";
  if (riskIndex >= 75 || peakConcurrency >= 6) riskGrade = "F";
  else if (riskIndex >= 50 || peakConcurrency >= 4) riskGrade = "D";
  else if (riskIndex >= 30 || peakConcurrency >= 3) riskGrade = "C";
  else if (riskIndex >= 15 || peakConcurrency >= 2) riskGrade = "B";

  return {
    totalJobs: jobs.length,
    activeJobs: activeJobs.length,
    totalDailyTriggers,
    peakConcurrency,
    peakTimestamp,
    peakWeight,
    riskIndex,
    riskGrade,
    criticalCollisionsCount,
    highCollisionsCount,
    moderateCollisionsCount,
    hourlySummaries,
    topCollisions,
    allMinuteCounts,
    allMinuteWeights,
  };
}

// -------------------------------------------------------------
// Smart Jitter & De-Collision Optimizer
// -------------------------------------------------------------

export interface OptimizationResult {
  optimizedJobs: CronJobItem[];
  changesCount: number;
  originalPeakConcurrency: number;
  optimizedPeakConcurrency: number;
  originalRiskIndex: number;
  optimizedRiskIndex: number;
  diffs: {
    jobId: string;
    jobName: string;
    originalExpr: string;
    newExpr: string;
    reason: string;
  }[];
}

export function optimizeCronFleet(
  jobs: CronJobItem[],
  referenceDate: Date = new Date()
): OptimizationResult {
  const originalAnalysis = analyzeCronFleet(jobs, referenceDate);
  const optimizedJobs: CronJobItem[] = JSON.parse(JSON.stringify(jobs));
  const diffs: OptimizationResult["diffs"] = [];

  // Track minute usage across the 1440-minute day
  // We want to re-allocate conflicting fixed-minute cron jobs
  const minuteSlotUsage = new Array<number>(1440).fill(0);

  // Group jobs by pattern type:
  // 1. Fixed hourly: e.g. "0 * * * *" or "M * * * *"
  // 2. Fixed daily: e.g. "0 2 * * *" or "0 0 * * *"
  // 3. Step hourly: "*/X * * * *"
  // 4. Other/Complex

  // Let's seed initial usage with complex/step jobs first that cannot be easily shifted without changing frequency
  for (const job of optimizedJobs) {
    if (!job.enabled) continue;
    const parts = job.expr.trim().split(/\s+/);
    if (parts.length < 5) continue;

    // Check if it's a fixed single-minute job (e.g., minute has no commas, slashes, or ranges)
    const isSingleMinute = /^\d+$/.test(parts[0]);
    if (!isSingleMinute) {
      // populate usage
      const parsed = parseCronExpression(job.expr);
      if (parsed.valid) {
        for (let m = 0; m < 1440; m++) {
          const h = Math.floor(m / 60);
          const min = m % 60;
          if (parsed.hours.has(h) && parsed.minutes.has(min)) {
            minuteSlotUsage[m]++;
          }
        }
      }
    }
  }

  // Now process single-minute jobs that often collide (e.g. at minute 0)
  for (let i = 0; i < optimizedJobs.length; i++) {
    const job = optimizedJobs[i];
    if (!job.enabled) continue;

    const parts = job.expr.trim().split(/\s+/);
    if (parts.length < 5) continue;

    const [minStr, hourStr, domStr, monStr, dowStr] = parts;
    const isSingleMinute = /^\d+$/.test(minStr);

    if (isSingleMinute) {
      const origMin = parseInt(minStr, 10);
      const parsed = parseCronExpression(job.expr);
      if (!parsed.valid) continue;

      // Find hours when this job runs
      const activeHours = Array.from(parsed.hours);

      // Check current collision load at origMin
      let maxLoadAtCurrentMin = 0;
      for (const h of activeHours) {
        const slot = h * 60 + origMin;
        if (minuteSlotUsage[slot] > maxLoadAtCurrentMin) {
          maxLoadAtCurrentMin = minuteSlotUsage[slot];
        }
      }

      // If load is >= 1, we try to find a better minute in [1..58] that has minimal load across all active hours
      if (maxLoadAtCurrentMin >= 1) {
        let bestMin = origMin;
        let lowestTotalLoad = Infinity;

        // Candidate minutes preferring prime/pseudo-random intervals to avoid other common clocks
        const candidates = [
          ...Array.from({ length: 60 }, (_, idx) => (origMin + (idx + 1) * 7) % 60),
        ];

        for (const candMin of candidates) {
          let candLoad = 0;
          for (const h of activeHours) {
            const slot = h * 60 + candMin;
            candLoad += minuteSlotUsage[slot];
          }
          if (candLoad < lowestTotalLoad) {
            lowestTotalLoad = candLoad;
            bestMin = candMin;
            if (lowestTotalLoad === 0) break; // Perfect empty slot
          }
        }

        if (bestMin !== origMin) {
          const newExpr = `${bestMin} ${hourStr} ${domStr} ${monStr} ${dowStr}`;
          diffs.push({
            jobId: job.id,
            jobName: job.name,
            originalExpr: job.expr,
            newExpr,
            reason: `Shifted execution from :${origMin.toString().padStart(2, "0")} to :${bestMin.toString().padStart(2, "0")} to eliminate thundering herd collision.`,
          });
          job.expr = newExpr;

          // Commit to minuteSlotUsage
          for (const h of activeHours) {
            minuteSlotUsage[h * 60 + bestMin]++;
          }
        } else {
          // Keep origMin
          for (const h of activeHours) {
            minuteSlotUsage[h * 60 + origMin]++;
          }
        }
      } else {
        // Safe as is
        for (const h of activeHours) {
          minuteSlotUsage[h * 60 + origMin]++;
        }
      }
    }
  }

  const optimizedAnalysis = analyzeCronFleet(optimizedJobs, referenceDate);

  return {
    optimizedJobs,
    changesCount: diffs.length,
    originalPeakConcurrency: originalAnalysis.peakConcurrency,
    optimizedPeakConcurrency: optimizedAnalysis.peakConcurrency,
    originalRiskIndex: originalAnalysis.riskIndex,
    optimizedRiskIndex: optimizedAnalysis.riskIndex,
    diffs,
  };
}

// -------------------------------------------------------------
// Crontab Import / Export Utilities
// -------------------------------------------------------------

export function parseCrontabFile(crontabText: string): CronJobItem[] {
  const lines = crontabText.split("\n");
  const jobs: CronJobItem[] = [];
  let unnamedCount = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith("#")) continue;

    // Check if line starts with comment or env variable (e.g., PATH=...)
    if (rawLine.includes("=") && !rawLine.includes(" ")) continue;

    // A valid cron line typically has at least 5 tokens
    const tokens = rawLine.split(/\s+/);
    if (tokens.length >= 5) {
      const expr = tokens.slice(0, 5).join(" ");
      const command = tokens.slice(5).join(" ") || `job_${unnamedCount}`;

      // Derive human friendly name from command or previous comment if possible
      let name = command
        .split("/")
        .pop()
        ?.replace(/^(python|bash|sh|node|php|ruby)\s+/, "")
        .replace(/(\.sh|\.py|\.js|\.php|\.rb)$/, "")
        .trim() || `Cron Job ${unnamedCount}`;

      if (name.length > 28) {
        name = name.slice(0, 25) + "...";
      }

      jobs.push({
        id: `job-${Date.now()}-${unnamedCount++}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        expr,
        command,
        enabled: true,
        weight: 2,
      });
    }
  }

  return jobs;
}

export function exportToCrontab(jobs: CronJobItem[]): string {
  const header = [
    "# ====================================================",
    "# Crontab generated by MegaTools Cron Collision Optimizer",
    `# Total Jobs: ${jobs.length} | Generated: ${new Date().toISOString()}`,
    "# ====================================================",
    "",
  ].join("\n");

  const jobLines = jobs
    .map((j) => {
      const prefix = j.enabled ? "" : "# [DISABLED] ";
      const comment = `# Job: ${j.name} (Impact Weight: ${j.weight}/5)`;
      return `${comment}\n${prefix}${j.expr} ${j.command || `/usr/local/bin/${j.name.toLowerCase().replace(/\\s+/g, "-")}.sh`}\n`;
    })
    .join("\n");

  return header + jobLines;
}

export function exportToKubernetesYaml(jobs: CronJobItem[]): string {
  return jobs
    .map((j) => {
      const safeName = j.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "") || "cron-job";
      return `apiVersion: batch/v1
kind: CronJob
metadata:
  name: ${safeName}
  labels:
    app.kubernetes.io/managed-by: megatools
    impact-weight: "${j.weight}"
spec:
  schedule: "${j.expr}"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: worker
            image: alpine:latest
            command: ["/bin/sh", "-c", "${j.command || "echo 'Job executing'"}\"]
          restartPolicy: OnFailure
---`;
    })
    .join("\n");
}

// -------------------------------------------------------------
// Real-World Presets
// -------------------------------------------------------------

export const PRESET_THUNDERING_HERD_DISASTER: CronJobItem[] = [
  { id: "th-1", name: "User Daily Stats Aggregator", expr: "0 0 * * *", command: "python -m jobs.user_stats", enabled: true, weight: 4 },
  { id: "th-2", name: "Nightly Database Full Vacuum", expr: "0 0 * * *", command: "psql -c 'VACUUM FULL ANALYZE'", enabled: true, weight: 5 },
  { id: "th-3", name: "Stripe Subscription Invoicing", expr: "0 0 * * *", command: "node scripts/sync-stripe-invoices.js", enabled: true, weight: 4 },
  { id: "th-4", name: "Cold Storage S3 Backup", expr: "0 0 * * *", command: "aws s3 sync /data/db s3://prod-backups", enabled: true, weight: 5 },
  { id: "th-5", name: "Session & Token Garbage Collection", expr: "0 * * * *", command: "node scripts/purge-sessions.js", enabled: true, weight: 2 },
  { id: "th-6", name: "Elasticsearch Index Rebuilder", expr: "0 0 * * *", command: "curl -XPOST http://es:9200/_reindex", enabled: true, weight: 5 },
  { id: "th-7", name: "Marketing Email Daily Broadcast", expr: "0 0 * * *", command: "python scripts/send_daily_digest.py", enabled: true, weight: 3 },
  { id: "th-8", name: "Hourly Audit Log Shipper", expr: "0 * * * *", command: "fluent-bit -c /etc/audit.conf", enabled: true, weight: 2 },
  { id: "th-9", name: "Third-party Exchange Rate Sync", expr: "0 * * * *", command: "python scripts/forex_sync.py", enabled: true, weight: 1 },
];

export const PRESET_ECOMMERCE_BATCH: CronJobItem[] = [
  { id: "ec-1", name: "Warehouse Stock Synchronization", expr: "0 2 * * *", command: "python jobs/sync_inventory.py", enabled: true, weight: 4 },
  { id: "ec-2", name: "Affiliate Payout Calculator", expr: "0 2 * * *", command: "node scripts/calculate-affiliates.js", enabled: true, weight: 4 },
  { id: "ec-3", name: "Abandoned Cart Notification Push", expr: "*/15 * * * *", command: "node scripts/cart-pushes.js", enabled: true, weight: 2 },
  { id: "ec-4", name: "Taxjar Sales Tax Reporting", expr: "0 2 * * *", command: "python jobs/tax_compliance.py", enabled: true, weight: 3 },
  { id: "ec-5", name: "Recommendation Matrix Recalc", expr: "0 3 * * *", command: "python ml/matrix_factorization.py", enabled: true, weight: 5 },
  { id: "ec-6", name: "Order Fulfillment Courier Sync", expr: "*/30 * * * *", command: "python jobs/courier_track.py", enabled: true, weight: 2 },
  { id: "ec-7", name: "PDF Invoice Archival", expr: "0 2 * * *", command: "node scripts/archive-invoices.js", enabled: true, weight: 3 },
];

export const PRESET_HIGH_FREQUENCY_MICROSERVICES: CronJobItem[] = [
  { id: "hf-1", name: "Kafka Lag Metric Scraper", expr: "*/5 * * * *", command: "python metrics/kafka_lag.py", enabled: true, weight: 2 },
  { id: "hf-2", name: "Dead Letter Queue Alert Poller", expr: "*/5 * * * *", command: "node workers/dlq_checker.js", enabled: true, weight: 2 },
  { id: "hf-3", name: "Kubernetes HPA Scaler Check", expr: "*/10 * * * *", command: "kubectl get hpa", enabled: true, weight: 3 },
  { id: "hf-4", name: "Payment Gateway Health Ping", expr: "*/5 * * * *", command: "curl -fsS https://api.stripe.com/health", enabled: true, weight: 1 },
  { id: "hf-5", name: "Temporary Uploads Scrub", expr: "*/15 * * * *", command: "rm -rf /tmp/uploads/*", enabled: true, weight: 3 },
  { id: "hf-6", name: "CDN Cache Warmer", expr: "*/30 * * * *", command: "python scripts/warm_cache.py", enabled: true, weight: 4 },
  { id: "hf-7", name: "SSL Certificate Expiry Probe", expr: "0 * * * *", command: "python scripts/cert_checker.py", enabled: true, weight: 2 },
];

export const PRESET_STAGGERED_OPTIMAL_FLEET: CronJobItem[] = [
  { id: "opt-1", name: "DB Maintenance", expr: "17 3 * * *", command: "psql -c 'VACUUM ANALYZE'", enabled: true, weight: 4 },
  { id: "opt-2", name: "Stripe Billing Cycle", expr: "34 1 * * *", command: "node scripts/sync-stripe.js", enabled: true, weight: 3 },
  { id: "opt-3", name: "Analytics Aggregate", expr: "48 2 * * *", command: "python scripts/aggregate.py", enabled: true, weight: 3 },
  { id: "opt-4", name: "Elasticsearch Optimize", expr: "12 4 * * *", command: "curl -XPOST http://es:9200/_forcemerge", enabled: true, weight: 4 },
  { id: "opt-5", name: "Log Rotation", expr: "06 * * * *", command: "logrotate /etc/logrotate.conf", enabled: true, weight: 2 },
  { id: "opt-6", name: "S3 Snapshot Archive", expr: "52 4 * * *", command: "aws s3 sync /backups s3://vault", enabled: true, weight: 5 },
];
