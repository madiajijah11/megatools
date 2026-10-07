"use client";

import { useState, useMemo, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import {
  analyzeComposeYaml,
  hardenComposeYaml,
  AuditSeverity,
  SAMPLE_INSECURE_STACK,
  SAMPLE_MICROSERVICES_STACK,
  SAMPLE_DEV_FULLSTACK,
} from "@/lib/compose-visualizer";

type ActiveTab = "topology" | "audit" | "harden" | "mermaid";

const SEVERITY_META: Record<
  AuditSeverity,
  { label: string; badge: string; color: string; border: string; bg: string }
> = {
  CRITICAL: {
    label: "CRITICAL",
    badge: "bg-red-500/20 text-red-400 border-red-500/40",
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
  HIGH: {
    label: "HIGH",
    badge: "bg-rose-500/15 text-rose-400 border-rose-500/35",
    color: "text-rose-400",
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
  },
  MEDIUM: {
    label: "MEDIUM",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/35",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  LOW: {
    label: "LOW",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/35",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
  },
  INFO: {
    label: "INFO",
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/35",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/10",
  },
};

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  A: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  B: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  C: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  D: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  F: "text-red-400 border-red-500/40 bg-red-500/10",
};

export default function ComposeVisualizerClient() {
  const [yamlInput, setYamlInput] = useState<string>(SAMPLE_INSECURE_STACK);
  const [activeTab, setActiveTab] = useState<ActiveTab>("topology");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [serviceSearch, setServiceSearch] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze Docker Compose YAML
  const analysis = useMemo(() => {
    return analyzeComposeYaml(yamlInput);
  }, [yamlInput]);

  // Generate Hardened Compose YAML
  const hardenedYaml = useMemo(() => {
    if (!analysis.isValid || !yamlInput.trim()) return "";
    return hardenComposeYaml(yamlInput);
  }, [yamlInput, analysis.isValid]);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    return analysis.issues.filter((issue) => {
      const matchSeverity = severityFilter === "ALL" || issue.severity === severityFilter;
      const matchSearch =
        !serviceSearch ||
        issue.title.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        (issue.serviceName && issue.serviceName.toLowerCase().includes(serviceSearch.toLowerCase())) ||
        issue.description.toLowerCase().includes(serviceSearch.toLowerCase());
      return matchSeverity && matchSearch;
    });
  }, [analysis.issues, severityFilter, serviceSearch]);

  // Filtered services
  const filteredServices = useMemo(() => {
    if (!serviceSearch) return analysis.services;
    const q = serviceSearch.toLowerCase();
    return analysis.services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.image && s.image.toLowerCase().includes(q)) ||
        s.ports.some((p) => p.raw.includes(q)) ||
        s.volumes.some((v) => v.raw.toLowerCase().includes(q))
    );
  }, [analysis.services, serviceSearch]);

  // File drop/upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) setYamlInput(content);
    };
    reader.readAsText(file);
  };

  // Download Hardened YAML
  const downloadHardened = () => {
    const blob = new Blob([hardenedYaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docker-compose.hardened.yml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preset switch
  const loadPreset = (preset: "insecure" | "micro" | "dev" | "clear") => {
    if (preset === "insecure") setYamlInput(SAMPLE_INSECURE_STACK);
    else if (preset === "micro") setYamlInput(SAMPLE_MICROSERVICES_STACK);
    else if (preset === "dev") setYamlInput(SAMPLE_DEV_FULLSTACK);
    else setYamlInput("");
  };

  // Stats bar for ToolLayout
  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Security Score:</span>
        <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] border ${GRADE_COLORS[analysis.grade] || ""}`}>
          {analysis.securityScore}/100 ({analysis.grade})
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Services:</span>
        <span className="text-accent font-bold">{analysis.stats.serviceCount} containers</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Exposed Ports:</span>
        <span className={`font-bold ${analysis.stats.wildcardPortCount > 0 ? "text-amber-400" : "text-success"}`}>
          {analysis.stats.exposedPortCount} ({analysis.stats.wildcardPortCount} wildcard)
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Audit Findings:</span>
        <span className="text-rose-400 font-bold">
          {analysis.stats.criticalIssues + analysis.stats.highIssues} high/crit ({analysis.issues.length} total)
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="compose-visualizer" stats={stats}>
      <div className="space-y-5 font-mono">
        {/* Presets & File Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border-subtle bg-bg-card text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-muted mr-1 font-semibold flex items-center gap-1">
              <span>⚡</span> Load Sample:
            </span>
            <button
              onClick={() => loadPreset("insecure")}
              className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-page hover:border-accent hover:text-accent transition-colors flex items-center gap-1"
            >
              <span>🚨</span> Vulnerable Web Stack
            </button>
            <button
              onClick={() => loadPreset("micro")}
              className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-page hover:border-accent hover:text-accent transition-colors flex items-center gap-1"
            >
              <span>🏗️</span> Production Microservices
            </button>
            <button
              onClick={() => loadPreset("dev")}
              className="px-2.5 py-1.5 rounded-lg border border-border-subtle bg-bg-page hover:border-accent hover:text-accent transition-colors flex items-center gap-1"
            >
              <span>💻</span> Dev Fullstack
            </button>
            <button
              onClick={() => loadPreset("clear")}
              className="px-2.5 py-1.5 rounded-lg border border-border-subtle text-text-muted hover:text-error hover:border-error/50 transition-colors flex items-center gap-1"
            >
              <span>🗑️</span> Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".yml,.yaml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary hover:border-accent transition-colors flex items-center gap-1.5"
            >
              <span>📂 Open Compose File</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Left Column Editor | Right Column Visualizer & Linter */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Left Column: Docker Compose YAML Input */}
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 flex flex-col justify-between min-h-[520px]">
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-border-subtle">
                <span className="font-bold text-text-primary flex items-center gap-2">
                  <span>📄 docker-compose.yml</span>
                  <span className="text-[11px] font-normal text-text-muted">
                    ({yamlInput.split("\n").length} lines, {yamlInput.length} chars)
                  </span>
                </span>
                {yamlInput && <CopyButton text={yamlInput} label="Copy YAML" />}
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                className={`relative flex-1 min-h-[380px] rounded-lg border transition-all flex flex-col ${
                  isDragging
                    ? "border-accent bg-accent/10"
                    : "border-border-subtle bg-bg-page"
                }`}
              >
                <textarea
                  value={yamlInput}
                  onChange={(e) => setYamlInput(e.target.value)}
                  placeholder="Paste docker-compose.yml here or drop a file..."
                  className="w-full flex-1 min-h-[380px] p-3 rounded-lg bg-transparent text-xs text-text-primary font-mono focus:outline-none resize-none leading-relaxed placeholder:text-text-muted"
                />

                {!yamlInput && (
                  <div className="p-4 border-t border-border-subtle/40 bg-bg-card/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
                    <span>Quick presets:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadPreset("insecure")}
                        className="text-accent underline hover:text-accent/80"
                      >
                        Try Vulnerable Stack
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => loadPreset("micro")}
                        className="text-accent underline hover:text-accent/80"
                      >
                        Try Microservices
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted pt-3 border-t border-border-subtle/50 mt-3">
              <span>Drop .yml or .yaml compose file</span>
              <span className="text-success font-medium flex items-center gap-1">
                <span>🔒 100% In-Browser: Never sent to servers</span>
              </span>
            </div>
          </div>

          {/* Right Column: Visualizer, Security Linter, Auto-Harden & Mermaid */}
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 flex flex-col justify-between min-h-[520px]">
            <div className="space-y-3 flex-1 flex flex-col">
              {/* Header Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-subtle">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab("topology")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "topology"
                        ? "bg-accent text-bg-page"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    🗺️ Topology ({analysis.services.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === "audit"
                        ? "bg-accent text-bg-page"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    <span>🛡️ Security Linter</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        activeTab === "audit"
                          ? "bg-bg-page/40 text-bg-page"
                          : analysis.issues.length > 0
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {analysis.issues.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("harden")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "harden"
                        ? "bg-accent text-bg-page"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    🔒 Auto-Harden
                  </button>
                  <button
                    onClick={() => setActiveTab("mermaid")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "mermaid"
                        ? "bg-accent text-bg-page"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                  >
                    📊 Mermaid
                  </button>
                </div>

                {activeTab === "harden" && hardenedYaml && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={downloadHardened}
                      className="px-2 py-1 rounded-md border border-border-subtle bg-bg-page text-xs text-text-muted hover:text-text-primary hover:border-accent transition-colors"
                      title="Download Hardened File"
                    >
                      💾 Save
                    </button>
                    <CopyButton text={hardenedYaml} label="Copy Hardened" />
                  </div>
                )}
                {activeTab === "mermaid" && analysis.mermaidDiagram && (
                  <CopyButton text={analysis.mermaidDiagram} label="Copy Mermaid" />
                )}
              </div>

              {/* Error banner if YAML is invalid */}
              {!analysis.isValid && (
                <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⚠️ Invalid YAML Structure:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{analysis.error}</p>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 1: TOPOLOGY & SERVICES OVERVIEW                     */}
              {/* ======================================================== */}
              {activeTab === "topology" && analysis.isValid && (
                <div className="flex flex-col flex-1 space-y-3">
                  {/* Search and Network/Volume summary bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-bg-page border border-border-subtle text-xs">
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Filter services by name, port, volume, or image..."
                      className="p-1.5 rounded bg-bg-card border border-border-subtle text-xs text-text-primary focus:border-accent focus:outline-none flex-1 max-w-xs"
                    />
                    <div className="flex items-center gap-2 text-[11px] text-text-muted">
                      <span>🖧 {analysis.networks.length} Networks</span>
                      <span>•</span>
                      <span>💾 {analysis.volumes.length} Volumes</span>
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="flex-1 space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                    {filteredServices.length === 0 ? (
                      <div className="p-8 text-center text-text-muted bg-bg-page rounded-lg border border-border-subtle text-xs">
                        No services matching filter &quot;{serviceSearch}&quot;
                      </div>
                    ) : (
                      filteredServices.map((svc) => {
                        const hasCritical = svc.privileged || svc.volumes.some((v) => v.isDockerSocket);
                        const hasHighPort = svc.ports.some((p) => p.isDangerousPort && p.isWildcard);

                        return (
                          <div
                            key={svc.name}
                            className={`p-3.5 rounded-lg border bg-bg-page transition-all space-y-2.5 ${
                              hasCritical
                                ? "border-red-500/40 bg-red-500/5"
                                : hasHighPort
                                ? "border-amber-500/30 bg-amber-500/5"
                                : "border-border-subtle"
                            }`}
                          >
                            {/* Service Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🐳</span>
                                <span className="font-bold text-text-primary text-xs">{svc.name}</span>
                                {svc.image && (
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                                      svc.isLatestOrUnpinned
                                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                        : "bg-bg-card text-text-secondary border-border-subtle"
                                    }`}
                                  >
                                    {svc.image}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-[10px]">
                                {svc.privileged && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
                                    ⚠️ PRIVILEGED
                                  </span>
                                )}
                                {svc.hasHealthcheck ? (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                    ❤️ Healthcheck
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded bg-bg-card text-text-muted border border-border-subtle">
                                    No Healthcheck
                                  </span>
                                )}
                                {svc.hasResourceLimits && (
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                    ⚡ Limited
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Ports, Volumes, Networks Badges */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-border-subtle/50">
                              {/* Ports */}
                              <div className="space-y-1">
                                <span className="text-text-muted text-[10px] block font-semibold">
                                  🔌 Ports ({svc.ports.length})
                                </span>
                                {svc.ports.length === 0 ? (
                                  <span className="text-text-muted text-[10px] italic">Internal only</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {svc.ports.map((p, idx) => (
                                      <span
                                        key={idx}
                                        className={`px-1.5 py-0.5 rounded text-[10px] border font-mono ${
                                          p.isDangerousPort && p.isWildcard
                                            ? "bg-red-500/15 text-red-400 border-red-500/35 font-bold"
                                            : p.isWildcard
                                            ? "bg-amber-500/15 text-amber-300 border-amber-500/35"
                                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        }`}
                                        title={
                                          p.isDangerousPort && p.isWildcard
                                            ? "Exposed database/backend port on 0.0.0.0!"
                                            : p.raw
                                        }
                                      >
                                        {p.raw}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Volumes */}
                              <div className="space-y-1">
                                <span className="text-text-muted text-[10px] block font-semibold">
                                  💾 Volumes ({svc.volumes.length})
                                </span>
                                {svc.volumes.length === 0 ? (
                                  <span className="text-text-muted text-[10px] italic">None mounted</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {svc.volumes.map((v, idx) => (
                                      <span
                                        key={idx}
                                        className={`px-1.5 py-0.5 rounded text-[10px] border truncate max-w-[140px] font-mono ${
                                          v.isDockerSocket
                                            ? "bg-red-500/20 text-red-400 border-red-500/40 font-bold"
                                            : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                                        }`}
                                        title={v.raw}
                                      >
                                        {v.type === "bind" ? "📁" : "💾"} {v.source || v.target}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Dependencies & Env */}
                              <div className="space-y-1">
                                <span className="text-text-muted text-[10px] block font-semibold">
                                  🔗 Relationships
                                </span>
                                <div className="space-y-0.5 text-[10px]">
                                  {svc.dependsOn.length > 0 ? (
                                    <div className="text-text-secondary truncate">
                                      <span className="text-text-muted">depends:</span>{" "}
                                      {svc.dependsOn.join(", ")}
                                    </div>
                                  ) : (
                                    <div className="text-text-muted italic">No dependencies</div>
                                  )}
                                  {svc.plainTextSecrets.length > 0 && (
                                    <div className="text-rose-400 font-bold">
                                      ⚠️ {svc.plainTextSecrets.length} hardcoded secret(s)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 2: SECURITY AUDIT & LINTER                          */}
              {/* ======================================================== */}
              {activeTab === "audit" && analysis.isValid && (
                <div className="flex flex-col flex-1 space-y-3">
                  {/* Score & Filter Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-bg-page border border-border-subtle text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">Security Score:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-xs border ${
                          GRADE_COLORS[analysis.grade] || ""
                        }`}
                      >
                        {analysis.securityScore}/100 • Grade {analysis.grade}
                      </span>
                    </div>

                    {/* Severity Filters */}
                    <div className="flex items-center gap-1 text-[10px]">
                      {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
                        <button
                          key={sev}
                          onClick={() => setSeverityFilter(sev)}
                          className={`px-2 py-0.5 rounded font-bold transition-colors ${
                            severityFilter === sev
                              ? "bg-accent text-bg-page"
                              : "text-text-muted hover:text-text-primary bg-bg-card"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="flex-1 space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                    {filteredIssues.length === 0 ? (
                      <div className="p-8 text-center text-text-muted bg-bg-page rounded-lg border border-border-subtle text-xs space-y-1">
                        <span className="text-2xl block">🎉</span>
                        <span className="font-bold text-success">Zero Audit Issues Found</span>
                        <p className="text-[11px]">
                          Your Docker Compose file passed all active security and best-practice checks.
                        </p>
                      </div>
                    ) : (
                      filteredIssues.map((issue) => {
                        const meta = SEVERITY_META[issue.severity];
                        return (
                          <div
                            key={issue.id}
                            className={`p-3.5 rounded-lg border ${meta.bg} ${meta.border} space-y-2 text-xs font-mono`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${meta.badge}`}
                                  >
                                    {meta.label}
                                  </span>
                                  {issue.serviceName && (
                                    <span className="px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle text-[10px] text-accent">
                                      🐳 {issue.serviceName}
                                    </span>
                                  )}
                                  <span className="font-bold text-text-primary text-xs">{issue.title}</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-[11px] text-text-secondary leading-relaxed">
                              {issue.description}
                            </p>

                            <div className="p-2 rounded bg-bg-page border border-border-subtle space-y-1 text-[11px]">
                              <span className="font-bold text-success flex items-center gap-1 text-[10px]">
                                <span>🛠️</span> Remediation Advice:
                              </span>
                              <p className="text-text-muted">{issue.remediation}</p>
                              {issue.codeSnippet && (
                                <pre className="p-1.5 mt-1 rounded bg-bg-card text-[10px] text-text-primary overflow-x-auto border border-border-subtle/40 font-mono">
                                  {issue.codeSnippet}
                                </pre>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 3: 1-CLICK AUTO-HARDEN GENERATOR                     */}
              {/* ======================================================== */}
              {activeTab === "harden" && analysis.isValid && (
                <div className="flex flex-col flex-1 space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-[11px] text-text-secondary leading-relaxed flex items-start gap-2">
                    <span className="text-base">🛡️</span>
                    <div>
                      <strong className="text-emerald-400">1-Click Production Hardening:</strong> MegaTools
                      automatically applied security patches: bounded sensitive database ports to{" "}
                      <code>127.0.0.1</code>, dropped <code>privileged: true</code>, added{" "}
                      <code>restart: unless-stopped</code>, and populated CPU/memory limits and healthchecks.
                    </div>
                  </div>

                  <div className="flex-1 min-h-[340px] p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed max-h-[440px] overflow-y-auto">
                    {hardenedYaml || (
                      <span className="text-text-muted italic">
                        Load a valid Docker Compose file to generate hardened output...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TAB 4: MERMAID ARCHITECTURE FLOWCHART                   */}
              {/* ======================================================== */}
              {activeTab === "mermaid" && analysis.isValid && (
                <div className="flex flex-col flex-1 space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 text-[11px] text-text-secondary leading-relaxed flex items-start gap-2">
                    <span className="text-base">📊</span>
                    <div>
                      <strong className="text-cyan-300">Mermaid Architecture Flowchart:</strong> Copy and
                      paste this diagram code directly into GitHub Pull Request descriptions, README.md, or
                      documentation wikis to visualize container networking, ports, and storage volumes.
                    </div>
                  </div>

                  <div className="flex-1 min-h-[340px] p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-cyan-300 whitespace-pre leading-relaxed max-h-[440px] overflow-x-auto overflow-y-auto">
                    {analysis.mermaidDiagram || (
                      <span className="text-text-muted italic">
                        Load a valid Docker Compose file to generate Mermaid diagram...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom summary bar */}
            <div className="pt-3 border-t border-border-subtle/50 mt-3 flex items-center justify-between text-[11px] text-text-muted">
              <span>
                {analysis.services.length} services • {analysis.networks.length} networks •{" "}
                {analysis.volumes.length} volumes
              </span>
              <span className="text-accent font-bold">
                Grade {analysis.grade} ({analysis.securityScore}/100)
              </span>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
