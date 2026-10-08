"use client";

import { useState, useMemo, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import {
  CronJobItem,
  FleetAnalysisResult,
  analyzeCronFleet,
  optimizeCronFleet,
  parseCrontabFile,
  exportToCrontab,
  exportToKubernetesYaml,
  PRESET_THUNDERING_HERD_DISASTER,
  PRESET_ECOMMERCE_BATCH,
  PRESET_HIGH_FREQUENCY_MICROSERVICES,
  PRESET_STAGGERED_OPTIMAL_FLEET,
  parseCronExpression,
} from "@/lib/cron-collision";

export default function CronCollisionClient() {
  const [jobs, setJobs] = useState<CronJobItem[]>(PRESET_THUNDERING_HERD_DISASTER);
  const [activeTab, setActiveTab] = useState<"timeline" | "collisions" | "optimizer" | "fleet">("timeline");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const [isCopiedK8s, setIsCopiedK8s] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute fleet analysis
  const analysis: FleetAnalysisResult = useMemo(() => {
    return analyzeCronFleet(jobs);
  }, [jobs]);

  // Compute optimization recommendation
  const optimization = useMemo(() => {
    return optimizeCronFleet(jobs);
  }, [jobs]);

  // Handle preset loading
  const loadPreset = (preset: CronJobItem[]) => {
    setJobs(JSON.parse(JSON.stringify(preset)));
  };

  // Toggle single job enabled
  const toggleJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, enabled: !j.enabled } : j))
    );
  };

  // Remove single job
  const removeJob = (id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  // Update single job field
  const updateJob = (id: string, field: keyof CronJobItem, value: any) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, [field]: value } : j))
    );
  };

  // Add new job stub
  const addNewJob = () => {
    const newId = `job-${Date.now()}`;
    const newJob: CronJobItem = {
      id: newId,
      name: `Custom Task ${jobs.length + 1}`,
      expr: "0 * * * *",
      command: `/usr/local/bin/worker_${jobs.length + 1}.sh`,
      enabled: true,
      weight: 2,
    };
    setJobs((prev) => [newJob, ...prev]);
    setActiveTab("fleet");
  };

  // Handle raw crontab file import
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseCrontabFile(content);
        if (parsed.length > 0) {
          setJobs(parsed);
          setShowImportModal(false);
        } else {
          alert("No valid crontab lines found in uploaded file.");
        }
      }
    };
    reader.readAsText(file);
  };

  // Apply optimization changes
  const applyOptimization = () => {
    setJobs(JSON.parse(JSON.stringify(optimization.optimizedJobs)));
    setActiveTab("timeline");
  };

  // Copy Kubernetes YAML
  const handleCopyK8s = () => {
    const yaml = exportToKubernetesYaml(jobs);
    navigator.clipboard.writeText(yaml);
    setIsCopiedK8s(true);
    setTimeout(() => setIsCopiedK8s(false), 2000);
  };

  // Filter collisions
  const filteredCollisions = useMemo(() => {
    return analysis.topCollisions.filter((c) => {
      if (severityFilter === "CRITICAL" && c.severity !== "CRITICAL") return false;
      if (severityFilter === "HIGH" && c.severity !== "HIGH") return false;
      if (severityFilter === "MODERATE" && c.severity !== "MODERATE") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTime = c.timeStr.includes(q);
        const matchesJob = c.jobNames.some((n) => n.toLowerCase().includes(q));
        if (!matchesTime && !matchesJob) return false;
      }
      return true;
    });
  }, [analysis.topCollisions, severityFilter, searchQuery]);

  // Minutes for selected hour drill-down
  const selectedHourMinutes = useMemo(() => {
    const startIdx = selectedHour * 60;
    const items = [];
    for (let m = 0; m < 60; m++) {
      const idx = startIdx + m;
      const count = analysis.allMinuteCounts[idx];
      const weight = analysis.allMinuteWeights[idx];
      const timeStr = `${selectedHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      items.push({
        minute: m,
        timeStr,
        count,
        weight,
      });
    }
    return items;
  }, [analysis.allMinuteCounts, analysis.allMinuteWeights, selectedHour]);

  // Color helper for severity
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border border-rose-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/40";
      case "MODERATE":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40";
    }
  };

  const stats = (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Peak Concurrency:</span>
        <span className={`font-bold ${analysis.peakConcurrency >= 5 ? "text-rose-400" : analysis.peakConcurrency >= 3 ? "text-amber-400" : "text-success"}`}>
          {analysis.peakConcurrency} jobs ({analysis.peakTimestamp})
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Collision Risk:</span>
        <span className={`font-bold ${analysis.riskIndex >= 50 ? "text-rose-400" : analysis.riskIndex >= 25 ? "text-amber-400" : "text-success"}`}>
          {analysis.riskIndex}% (Grade {analysis.riskGrade})
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Critical Clashes:</span>
        <span className="text-rose-400 font-bold">{analysis.criticalCollisionsCount} minutes</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Active Fleet:</span>
        <span className="text-text-secondary font-bold">{analysis.activeJobs}/{analysis.totalJobs} jobs</span>
      </div>
    </div>
  );

  return (
    <ToolLayout
      toolId="cron-collision"
      stats={stats}
    >
      <div className="space-y-6">
        {/* Presets & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mr-1">
              ⚡ Load Sample Fleet:
            </span>
            <button
              onClick={() => loadPreset(PRESET_THUNDERING_HERD_DISASTER)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1.5 font-medium"
            >
              🚨 Thundering Herd
            </button>
            <button
              onClick={() => loadPreset(PRESET_ECOMMERCE_BATCH)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1.5 font-medium"
            >
              🛒 E-Commerce Batch
            </button>
            <button
              onClick={() => loadPreset(PRESET_HIGH_FREQUENCY_MICROSERVICES)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1.5 font-medium"
            >
              ⏱️ High-Freq Microservices
            </button>
            <button
              onClick={() => loadPreset(PRESET_STAGGERED_OPTIMAL_FLEET)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 font-medium"
            >
              🛡️ Optimal Staggered
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
              className="hidden"
            />
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-1.5 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
            >
              📥 Import Crontab
            </button>
            <button
              onClick={addNewJob}
              className="px-3 py-1.5 text-xs rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              ➕ Add Job
            </button>
          </div>
        </div>

        {/* Fleet Metrics Overview Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Peak Concurrency</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-black ${analysis.peakConcurrency >= 5 ? "text-rose-400" : analysis.peakConcurrency >= 3 ? "text-amber-400" : "text-emerald-400"}`}>
                {analysis.peakConcurrency}
              </span>
              <span className="text-xs text-text-muted">jobs/min</span>
            </div>
            <span className="text-[10px] text-text-muted truncate mt-0.5">at {analysis.peakTimestamp}</span>
          </div>

          <div className="p-3 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Collision Risk</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-black ${analysis.riskIndex >= 50 ? "text-rose-400" : analysis.riskIndex >= 25 ? "text-amber-400" : "text-emerald-400"}`}>
                {analysis.riskIndex}%
              </span>
              <span className="text-xs font-bold text-text-secondary">Grade {analysis.riskGrade}</span>
            </div>
            <span className="text-[10px] text-text-muted mt-0.5">Thundering Herd Severity</span>
          </div>

          <div className="p-3 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Critical Clashes</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-rose-400">{analysis.criticalCollisionsCount}</span>
              <span className="text-xs text-text-muted">minutes</span>
            </div>
            <span className="text-[10px] text-rose-400/80 mt-0.5">&ge; 5 jobs concurrent</span>
          </div>

          <div className="p-3 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">High Clashes</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-orange-400">{analysis.highCollisionsCount}</span>
              <span className="text-xs text-text-muted">minutes</span>
            </div>
            <span className="text-[10px] text-orange-400/80 mt-0.5">3–4 jobs concurrent</span>
          </div>

          <div className="p-3 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Active Fleet</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-text-primary">{analysis.activeJobs}</span>
              <span className="text-xs text-text-muted">/ {analysis.totalJobs} jobs</span>
            </div>
            <span className="text-[10px] text-text-muted mt-0.5">Scheduled in fleet</span>
          </div>

          <div className="p-3 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Daily Triggers</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-text-primary">{analysis.totalDailyTriggers}</span>
              <span className="text-xs text-text-muted">runs</span>
            </div>
            <span className="text-[10px] text-text-muted mt-0.5">In 24h simulation window</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "timeline"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>📊</span> 24-Hour Timeline & Heatmap
            </button>
            <button
              onClick={() => setActiveTab("collisions")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "collisions"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>💥</span> Collisions List
              {analysis.topCollisions.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                  {analysis.topCollisions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("optimizer")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "optimizer"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>⚡</span> Jitter & Optimizer
              {optimization.changesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  {optimization.changesCount} fixable
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("fleet")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "fleet"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>📝</span> Fleet Manager ({jobs.length})
            </button>
          </div>
        </div>

        {/* Tab 1: 24-Hour Timeline & Heatmap */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            {/* Hourly Concurrency Bar Chart */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>🕒</span> 24-Hour Fleet Concurrency Wave
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Click any hour bar below to inspect the 60-minute second-by-second collision drilldown.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Safe (1)
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderate (2)
                  </span>
                  <span className="flex items-center gap-1 text-orange-400">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> High (3-4)
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Critical (5+)
                  </span>
                </div>
              </div>

              {/* Hourly Bars */}
              <div className="grid grid-cols-24 gap-1.5 h-44 items-end pt-4 pb-2 border-b border-border-subtle">
                {analysis.hourlySummaries.map((hSummary) => {
                  const maxPossible = Math.max(1, analysis.peakConcurrency);
                  const heightPercent = Math.max(12, Math.min(100, Math.round((hSummary.maxConcurrency / maxPossible) * 100)));
                  const isSelected = selectedHour === hSummary.hour;

                  let barColor = "bg-emerald-500/70 hover:bg-emerald-400";
                  if (hSummary.maxConcurrency >= 5) barColor = "bg-rose-500 hover:bg-rose-400";
                  else if (hSummary.maxConcurrency >= 3) barColor = "bg-orange-500 hover:bg-orange-400";
                  else if (hSummary.maxConcurrency === 2) barColor = "bg-amber-500 hover:bg-amber-400";
                  else if (hSummary.maxConcurrency === 0) barColor = "bg-bg-subtle/40 hover:bg-bg-subtle";

                  return (
                    <button
                      key={hSummary.hour}
                      onClick={() => setSelectedHour(hSummary.hour)}
                      title={`Hour ${hSummary.hour.toString().padStart(2, "0")}:00 - Peak: ${hSummary.maxConcurrency} jobs concurrent (${hSummary.totalExecutions} total runs)`}
                      className={`group relative flex flex-col justify-end items-center h-full rounded transition-all ${
                        isSelected ? "ring-2 ring-accent scale-105 z-10" : ""
                      }`}
                    >
                      <span className="text-[9px] font-mono text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-bold">
                        {hSummary.maxConcurrency}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t transition-all ${barColor} ${
                          isSelected ? "opacity-100" : "opacity-90"
                        }`}
                      ></div>
                    </button>
                  );
                })}
              </div>

              {/* Hour Labels */}
              <div className="grid grid-cols-24 gap-1.5 text-center font-mono text-[10px] text-text-muted">
                {Array.from({ length: 24 }, (_, i) => (
                  <span
                    key={i}
                    className={`cursor-pointer transition-colors ${
                      selectedHour === i ? "text-accent font-bold" : "hover:text-text-primary"
                    }`}
                    onClick={() => setSelectedHour(i)}
                  >
                    {i.toString().padStart(2, "0")}
                  </span>
                ))}
              </div>
            </div>

            {/* Selected Hour 60-Minute Drilldown */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded bg-bg-page border border-border-subtle text-accent font-mono font-bold text-sm">
                    {selectedHour.toString().padStart(2, "0")}:00 – {selectedHour.toString().padStart(2, "0")}:59
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">
                      Hour {selectedHour.toString().padStart(2, "0")} Detailed Minute-by-Minute View
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      Max concurrency: {analysis.hourlySummaries[selectedHour]?.maxConcurrency || 0} jobs • Total executions: {analysis.hourlySummaries[selectedHour]?.totalExecutions || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={selectedHour === 0}
                    onClick={() => setSelectedHour((p) => Math.max(0, p - 1))}
                    className="px-2 py-1 text-xs rounded bg-bg-page border border-border-subtle disabled:opacity-30 hover:border-accent"
                  >
                    ◀ Prev Hour
                  </button>
                  <button
                    disabled={selectedHour === 23}
                    onClick={() => setSelectedHour((p) => Math.min(23, p + 1))}
                    className="px-2 py-1 text-xs rounded bg-bg-page border border-border-subtle disabled:opacity-30 hover:border-accent"
                  >
                    Next Hour ▶
                  </button>
                </div>
              </div>

              {/* 60 Minute Cells Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-2 font-mono">
                {selectedHourMinutes.map((m) => {
                  let cellStyle = "bg-bg-page border-border-subtle/60 text-text-muted";
                  if (m.count >= 5) cellStyle = "bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold";
                  else if (m.count >= 3) cellStyle = "bg-orange-500/20 border-orange-500/60 text-orange-300 font-bold";
                  else if (m.count === 2) cellStyle = "bg-amber-500/20 border-amber-500/60 text-amber-300 font-medium";
                  else if (m.count === 1) cellStyle = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";

                  return (
                    <div
                      key={m.minute}
                      title={`${m.timeStr} — ${m.count} concurrent jobs (Weight: ${m.weight})`}
                      className={`p-2 rounded-lg border text-center transition-all flex flex-col justify-between items-center ${cellStyle}`}
                    >
                      <span className="text-[10px] text-text-muted font-normal">:{m.minute.toString().padStart(2, "0")}</span>
                      <span className="text-sm font-bold my-0.5">{m.count}</span>
                      <span className="text-[9px] opacity-75">
                        {m.count > 0 ? `wt:${m.weight}` : "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Collisions List */}
        {activeTab === "collisions" && (
          <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle text-xs">
              <div className="flex items-center gap-2">
                <span className="text-text-muted font-medium">Filter Severity:</span>
                {(["ALL", "CRITICAL", "HIGH", "MODERATE"] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded-lg border transition-colors ${
                      severityFilter === sev
                        ? "bg-accent text-accent-foreground font-bold border-accent"
                        : "bg-bg-page border-border-subtle text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search time (00:00) or job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-page border border-border-subtle text-xs focus:outline-none focus:border-accent text-text-primary placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* List of collisions */}
            {filteredCollisions.length === 0 ? (
              <div className="p-8 rounded-xl bg-bg-card border border-border-subtle text-center space-y-2">
                <span className="text-3xl">🎉</span>
                <h4 className="text-sm font-bold text-text-primary">No Collisions Found!</h4>
                <p className="text-xs text-text-muted">
                  {severityFilter !== "ALL"
                    ? `No collisions matching filter "${severityFilter}".`
                    : "All scheduled jobs are cleanly isolated with 0 or 1 concurrent execution per minute."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCollisions.map((collision) => (
                  <div
                    key={collision.minuteIndex}
                    className="p-4 rounded-xl bg-bg-card border border-border-subtle hover:border-accent/40 transition-colors space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/60 pb-2.5">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded bg-bg-page border border-border-subtle font-mono text-sm font-black text-text-primary">
                          ⏰ {collision.timeStr}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getSeverityBadgeClass(collision.severity)}`}>
                          {collision.severity} COLLISION
                        </span>
                        <span className="text-xs text-text-muted font-medium">
                          {collision.concurrency} concurrent tasks • Total Impact Weight: {collision.totalWeight}
                        </span>
                      </div>

                      <button
                        onClick={() => setActiveTab("optimizer")}
                        className="px-2.5 py-1 text-xs rounded bg-bg-page border border-border-subtle text-accent hover:border-accent transition-colors flex items-center gap-1"
                      >
                        ⚡ Rebalance This Clash
                      </button>
                    </div>

                    {/* Jobs executing at this timestamp */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {collision.jobNames.map((name, idx) => {
                        const jId = collision.jobIds[idx];
                        const job = jobs.find((j) => j.id === jId);
                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-bg-page border border-border-subtle/80 flex flex-col justify-between space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-text-primary truncate" title={name}>
                                {name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-bg-card border border-border-subtle text-text-muted font-mono">
                                wt:{job?.weight || 1}
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <code className="text-accent bg-bg-card px-1.5 py-0.5 rounded border border-border-subtle">
                                {job?.expr || "* * * * *"}
                              </code>
                              <span className="text-[10px] text-text-muted truncate max-w-[120px]" title={job?.command}>
                                {job?.command}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Jitter & De-Collision Optimizer */}
        {activeTab === "optimizer" && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>⚡</span> 1-Click Smart Fleet Jitter & Rebalancer
                  </h3>
                  <p className="text-xs text-text-muted mt-1 max-w-2xl">
                    Automatically applies phase-shifting and prime minute offsets to conflicting cron jobs while strictly preserving your execution frequencies. Eliminates thundering herd spikes at <code className="text-accent">:00</code> and mid-hour intervals.
                  </p>
                </div>

                <button
                  onClick={applyOptimization}
                  disabled={optimization.changesCount === 0}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>🚀</span> Apply Rebalanced Schedule to Fleet
                </button>
              </div>

              {/* Before vs After Impact Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">Peak Concurrency Impact</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xl font-bold text-rose-400 line-through">
                      {optimization.originalPeakConcurrency} jobs
                    </span>
                    <span className="text-sm text-text-muted">➔</span>
                    <span className="text-xl font-black text-emerald-400">
                      {optimization.optimizedPeakConcurrency} jobs
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1">
                    {optimization.originalPeakConcurrency > optimization.optimizedPeakConcurrency
                      ? `-${Math.round(((optimization.originalPeakConcurrency - optimization.optimizedPeakConcurrency) / optimization.originalPeakConcurrency) * 100)}% peak reduction`
                      : "Already optimal"}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">Collision Risk Index</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xl font-bold text-rose-400 line-through">
                      {optimization.originalRiskIndex}%
                    </span>
                    <span className="text-sm text-text-muted">➔</span>
                    <span className="text-xl font-black text-emerald-400">
                      {optimization.optimizedRiskIndex}%
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1">
                    Risk dropped by {Math.max(0, optimization.originalRiskIndex - optimization.optimizedRiskIndex)} points
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">Jitter Rebalancing Moves</span>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-2xl font-black text-accent">{optimization.changesCount}</span>
                    <span className="text-xs text-text-muted">jobs adjusted</span>
                  </div>
                  <span className="text-[10px] text-text-muted mt-1">Frequencies 100% maintained</span>
                </div>
              </div>
            </div>

            {/* Shift Diff Table */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-3">
              <h4 className="text-xs font-bold text-text-primary flex items-center justify-between">
                <span>📋 Proposed Schedule Phase-Shifts ({optimization.diffs.length})</span>
                <span className="text-[11px] font-normal text-text-muted font-mono">
                  Preserves original daily/hourly frequency
                </span>
              </h4>

              {optimization.diffs.length === 0 ? (
                <p className="text-xs text-text-muted py-4 text-center">
                  Your fleet is currently well-balanced. No adjustments needed!
                </p>
              ) : (
                <div className="divide-y divide-border-subtle/60 overflow-x-auto">
                  {optimization.diffs.map((diff, idx) => (
                    <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <span className="font-bold text-text-primary block">{diff.jobName}</span>
                        <p className="text-[11px] text-text-muted">{diff.reason}</p>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs">
                        <code className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          {diff.originalExpr}
                        </code>
                        <span className="text-text-muted">➔</span>
                        <code className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          {diff.newExpr}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export Actions */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-3">
              <h4 className="text-xs font-bold text-text-primary">
                💾 Export Rebalanced Fleet
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton text={exportToCrontab(jobs)} label="Copy Linux Crontab" />
                <button
                  onClick={handleCopyK8s}
                  className="px-3 py-1.5 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
                >
                  <span>☸️</span> {isCopiedK8s ? "Copied Kubernetes YAML!" : "Copy Kubernetes CronJob YAML"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Fleet Manager (Crontab Table) */}
        {activeTab === "fleet" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-bg-card border border-border-subtle text-xs">
              <span className="text-text-muted font-medium">
                Showing {jobs.length} Cron Jobs ({analysis.activeJobs} Active)
              </span>
              <div className="flex items-center gap-2">
                <CopyButton text={exportToCrontab(jobs)} label="Export Crontab" />
                <button
                  onClick={addNewJob}
                  className="px-2.5 py-1 text-xs rounded bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  ➕ Add Job
                </button>
              </div>
            </div>

            {/* Job Rows */}
            <div className="space-y-2">
              {jobs.map((job) => {
                const parsed = parseCronExpression(job.expr);
                return (
                  <div
                    key={job.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                      job.enabled
                        ? "bg-bg-card border-border-subtle hover:border-border"
                        : "bg-bg-card/50 border-border-subtle/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={job.enabled}
                        onChange={() => toggleJob(job.id)}
                        className="rounded border-border-subtle text-accent focus:ring-accent w-4 h-4 cursor-pointer"
                        title={job.enabled ? "Disable Job" : "Enable Job"}
                      />

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={job.name}
                            onChange={(e) => updateJob(job.id, "name", e.target.value)}
                            className="bg-transparent font-bold text-xs text-text-primary focus:outline-none focus:border-b border-accent w-full max-w-sm"
                            placeholder="Job Name"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-text-muted truncate">
                          <input
                            type="text"
                            value={job.command}
                            onChange={(e) => updateJob(job.id, "command", e.target.value)}
                            className="bg-transparent text-[11px] text-text-muted focus:outline-none focus:border-b border-accent w-full"
                            placeholder="Command"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Cron expression input */}
                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={job.expr}
                          onChange={(e) => updateJob(job.id, "expr", e.target.value)}
                          className={`font-mono text-xs px-2.5 py-1 rounded bg-bg-page border focus:outline-none w-36 ${
                            parsed.valid
                              ? "border-border-subtle text-accent focus:border-accent"
                              : "border-rose-500/80 text-rose-400 bg-rose-500/10"
                          }`}
                        />
                        {!parsed.valid && (
                          <span className="text-[10px] text-rose-400 mt-0.5">Invalid syntax</span>
                        )}
                      </div>

                      {/* Resource impact weight */}
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-text-muted text-[10px]">Impact:</span>
                        <select
                          value={job.weight}
                          onChange={(e) => updateJob(job.id, "weight", parseInt(e.target.value, 10))}
                          className="px-2 py-1 rounded bg-bg-page border border-border-subtle text-xs text-text-secondary focus:outline-none focus:border-accent cursor-pointer"
                        >
                          <option value={1}>1 (Light)</option>
                          <option value={2}>2 (Normal)</option>
                          <option value={3}>3 (Moderate)</option>
                          <option value={4}>4 (Heavy)</option>
                          <option value={5}>5 (Critical DB)</option>
                        </select>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => removeJob(job.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Job"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal: Import Raw Crontab */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-xl p-5 rounded-2xl bg-bg-card border border-border-subtle shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <span>📥</span> Import Raw Crontab Text
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-text-muted hover:text-text-primary text-base"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-text-muted">
                Paste your Linux crontab lines (or upload a file). Standard cron expressions with comments and command paths are automatically parsed.
              </p>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`0 0 * * * /usr/bin/backup-db.sh\n0 2 * * * python /app/jobs/sync.py\n*/15 * * * * curl -s https://api.internal/ping`}
                className="w-full h-44 p-3 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:outline-none focus:border-accent"
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary transition-colors"
                >
                  📁 Select .crontab File
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-3 py-1.5 text-xs rounded-lg text-text-muted hover:text-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (importText.trim()) {
                        const parsed = parseCrontabFile(importText);
                        if (parsed.length > 0) {
                          setJobs(parsed);
                          setShowImportModal(false);
                          setImportText("");
                        } else {
                          alert("No valid cron entries detected in pasted text.");
                        }
                      }
                    }}
                    className="px-4 py-1.5 text-xs rounded-lg bg-accent text-accent-foreground font-bold hover:opacity-90 transition-opacity"
                  >
                    Import & Analyze Fleet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
