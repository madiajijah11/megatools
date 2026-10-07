"use client";

import React, { useState, useMemo, useTransition } from "react";
import ToolLayout from "@/components/ToolLayout";
import {
  analyzePromptSecurity,
  fortifySystemPrompt,
  ATTACK_VECTORS,
  PRESET_VULNERABLE_CUSTOMER_BOT,
  PRESET_SQL_DATABASE_ASSISTANT,
  PRESET_HEALTH_TRIAGE_BOT,
  PRESET_FORTIFIED_AGENT,
  Severity,
  AttackCategory,
} from "@/lib/prompt-fuzzer";

export default function PromptFuzzerClient() {
  const [, startTransition] = useTransition();

  const [promptText, setPromptText] = useState<string>(PRESET_VULNERABLE_CUSTOMER_BOT);
  const [activeTab, setActiveTab] = useState<"findings" | "sandbox" | "fortify" | "checklist">("findings");
  const [severityFilter, setSeverityFilter] = useState<"ALL" | Severity | "VULNERABLE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | AttackCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sandbox State
  const [selectedVectorId, setSelectedVectorId] = useState<string>("system-prompt-extraction");
  const [customAttackPayload, setCustomAttackPayload] = useState<string>(
    ATTACK_VECTORS[0].payload
  );

  // Fortify Options
  const [fortifyOpts, setFortifyOpts] = useState({
    includeAntiLeak: true,
    includeHierarchy: true,
    includeExfiltrationBlock: true,
    includeMultiLingual: true,
    includeRefusalTemplate: true,
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        startTransition(() => {
          setPromptText(content);
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Perform Analysis
  const analysis = useMemo(() => {
    return analyzePromptSecurity(promptText);
  }, [promptText]);

  // Fortified prompt string
  const fortifiedPrompt = useMemo(() => {
    return fortifySystemPrompt(promptText, fortifyOpts);
  }, [promptText, fortifyOpts]);

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    return analysis.findings.filter((item) => {
      if (severityFilter === "VULNERABLE" && !item.isVulnerable) return false;
      if (severityFilter !== "ALL" && severityFilter !== "VULNERABLE" && item.severity !== severityFilter) {
        return false;
      }
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          item.vectorName.toLowerCase().includes(query) ||
          item.reason.toLowerCase().includes(query) ||
          item.samplePayload.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [analysis.findings, severityFilter, categoryFilter, searchQuery]);

  const selectedVector = useMemo(() => {
    return ATTACK_VECTORS.find((v) => v.id === selectedVectorId) || ATTACK_VECTORS[0];
  }, [selectedVectorId]);

  const estimatedTokens = Math.ceil(promptText.length / 4);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A+":
      case "A":
        return "text-emerald-400 bg-emerald-950/40 border-emerald-500/50";
      case "B":
        return "text-blue-400 bg-blue-950/40 border-blue-500/50";
      case "C":
        return "text-amber-400 bg-amber-950/40 border-amber-500/50";
      case "D":
        return "text-orange-400 bg-orange-950/40 border-orange-500/50";
      case "F":
      default:
        return "text-red-400 bg-red-950/40 border-red-500/50";
    }
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border border-red-500/40";
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/40";
      case "MEDIUM":
        return "bg-amber-500/20 text-amber-400 border border-amber-500/40";
      case "LOW":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/40";
    }
  };

  const stats = (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Guardrail Score:</span>
        <span className="text-accent font-bold">{analysis.score}/100 ({analysis.grade})</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Vulnerabilities:</span>
        <span className={`font-bold ${analysis.vulnerableCount > 0 ? "text-rose-400" : "text-success"}`}>
          {analysis.vulnerableCount}/{analysis.totalVectors} vectors
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Critical Flaws:</span>
        <span className="text-rose-400 font-bold">{analysis.criticalVulns}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Audit Suite:</span>
        <span className="text-text-secondary font-bold">11 Attack Vectors</span>
      </div>
    </div>
  );

  return (
    <ToolLayout
      toolId="prompt-fuzzer"
      stats={stats}
    >
      <div className="space-y-6">
        {/* Preset Selectors & Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mr-1">
              ⚡ Load Sample:
            </span>
            <button
              onClick={() => setPromptText(PRESET_VULNERABLE_CUSTOMER_BOT)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
            >
              🚨 Vulnerable Bot
            </button>
            <button
              onClick={() => setPromptText(PRESET_SQL_DATABASE_ASSISTANT)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
            >
              💾 SQL Database Bot
            </button>
            <button
              onClick={() => setPromptText(PRESET_HEALTH_TRIAGE_BOT)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
            >
              🩺 Medical Triage
            </button>
            <button
              onClick={() => setPromptText(PRESET_FORTIFIED_AGENT)}
              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 font-medium transition-colors flex items-center gap-1.5"
            >
              🛡️ Fortified Agent
            </button>
            <button
              onClick={() => setPromptText("")}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-muted hover:text-red-400 transition-colors"
            >
              🗑️ Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5">
              📂 Open Prompt File
              <input
                type="file"
                accept=".txt,.md,.prompt,.json,.yaml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Score Card */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${getGradeColor(analysis.grade)}`}>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Security Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black">{analysis.score}</span>
              <span className="text-sm font-bold opacity-80">/100</span>
            </div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wider">
              Grade: {analysis.grade}
            </div>
          </div>

          {/* Critical Vulnerabilities */}
          <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Critical Flaws</span>
            <div className="mt-1 text-2xl font-black text-red-400">
              {analysis.criticalVulns}
            </div>
            <span className="text-[11px] text-text-muted">Direct injection/leak</span>
          </div>

          {/* High Vulnerabilities */}
          <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">High Risks</span>
            <div className="mt-1 text-2xl font-black text-orange-400">
              {analysis.highVulns}
            </div>
            <span className="text-[11px] text-text-muted">Jailbreaks & evasion</span>
          </div>

          {/* Delimiter Enclosure */}
          <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">XML Isolation</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-lg">{analysis.hasDelimiterEnclosure ? "✅" : "❌"}</span>
              <span className={`text-sm font-bold ${analysis.hasDelimiterEnclosure ? "text-emerald-400" : "text-text-muted"}`}>
                {analysis.hasDelimiterEnclosure ? "Enclosed" : "Flat Text"}
              </span>
            </div>
            <span className="text-[11px] text-text-muted">Boundary tags</span>
          </div>

          {/* Anti-Leakage */}
          <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Anti-Leak Clause</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-lg">{analysis.hasAntiLeakageClause ? "✅" : "❌"}</span>
              <span className={`text-sm font-bold ${analysis.hasAntiLeakageClause ? "text-emerald-400" : "text-text-muted"}`}>
                {analysis.hasAntiLeakageClause ? "Protected" : "Exposed"}
              </span>
            </div>
            <span className="text-[11px] text-text-muted">Non-disclosure rule</span>
          </div>

          {/* Instruction Precedence */}
          <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Override Defense</span>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-lg">{analysis.hasHierarchyPrecedence ? "✅" : "❌"}</span>
              <span className={`text-sm font-bold ${analysis.hasHierarchyPrecedence ? "text-emerald-400" : "text-text-muted"}`}>
                {analysis.hasHierarchyPrecedence ? "Precedence" : "Missing"}
              </span>
            </div>
            <span className="text-[11px] text-text-muted">Immutable rules</span>
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: System Prompt Editor (5 cols) */}
          <div className="lg:col-span-5 flex flex-col min-h-[580px] p-4 rounded-xl bg-bg-card border border-border-subtle">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-base">📝</span>
                <span className="text-sm font-bold text-text-primary">System Prompt Under Test</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPromptText(fortifiedPrompt);
                    setActiveTab("findings");
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 transition-colors flex items-center gap-1"
                  title="Automatically patch security vulnerabilities into this prompt"
                >
                  🛡️ Auto-Fortify
                </button>
                <button
                  onClick={() => handleCopy(promptText, "prompt")}
                  className="px-2 py-1 text-[11px] rounded bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary"
                >
                  {copiedKey === "prompt" ? "Copied! ✓" : "Copy"}
                </button>
              </div>
            </div>

            <div className="relative flex-1 mt-3 flex flex-col">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Paste your system prompt, custom instructions, or AI persona guidelines here..."
                className="w-full flex-1 min-h-[460px] p-3 rounded-lg font-mono text-xs leading-relaxed bg-bg-page border border-border-subtle focus:border-accent focus:ring-1 focus:ring-accent outline-none text-text-primary resize-y"
                spellCheck={false}
              />
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-subtle text-[11px] text-text-muted">
              <span>
                {promptText.length.toLocaleString()} chars • ~{estimatedTokens.toLocaleString()} tokens
              </span>
              <span className="flex items-center gap-1.5 text-text-muted">
                🔒 100% In-Browser: Never transmitted to servers
              </span>
            </div>
          </div>

          {/* Right Column: Fuzzing Tabs & Inspector (7 cols) */}
          <div className="lg:col-span-7 flex flex-col min-h-[580px] p-4 rounded-xl bg-bg-card border border-border-subtle">
            {/* Tabs Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("findings")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "findings"
                      ? "bg-accent text-bg-page"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  🛡️ Attack Matrix
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === "findings" ? "bg-bg-page/20 text-bg-page" : "bg-bg-page text-text-muted"
                  }`}>
                    {analysis.findings.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("sandbox")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "sandbox"
                      ? "bg-accent text-bg-page"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  🧪 Attack Sandbox
                </button>
                <button
                  onClick={() => setActiveTab("fortify")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "fortify"
                      ? "bg-accent text-bg-page"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  🔒 Fortified Output
                </button>
                <button
                  onClick={() => setActiveTab("checklist")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "checklist"
                      ? "bg-accent text-bg-page"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  📋 Checklist
                </button>
              </div>

              {activeTab === "findings" && (
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-text-muted">Status:</span>
                  <span className="font-bold text-red-400">{analysis.vulnerableCount} Vulnerable</span>
                  <span className="text-text-muted">•</span>
                  <span className="font-bold text-emerald-400">{analysis.protectedCount} Protected</span>
                </div>
              )}
            </div>

            {/* TAB 1: FINDINGS & ATTACK MATRIX */}
            {activeTab === "findings" && (
              <div className="flex-1 mt-4 space-y-4 flex flex-col">
                {/* Filters */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(["ALL", "VULNERABLE", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                          severityFilter === sev
                            ? "bg-accent text-bg-page"
                            : "bg-bg-page hover:bg-bg-hover text-text-muted border border-border-subtle"
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search attack vectors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-bg-page border border-border-subtle text-text-primary placeholder:text-text-muted outline-none focus:border-accent w-48"
                    />
                  </div>
                </div>

                {/* Findings List */}
                <div className="flex-1 overflow-y-auto space-y-3 max-h-[560px] pr-1">
                  {filteredFindings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-text-muted">
                      <span className="text-3xl mb-2">🎉</span>
                      <p className="text-sm font-semibold text-text-secondary">No vulnerabilities found in this filter</p>
                      <p className="text-xs mt-1">Your prompt effectively addresses the scanned attack vectors.</p>
                    </div>
                  ) : (
                    filteredFindings.map((finding) => (
                      <div
                        key={finding.vectorId}
                        className={`p-3.5 rounded-xl border transition-all ${
                          finding.isVulnerable
                            ? "bg-red-950/15 border-red-500/30 hover:border-red-500/50"
                            : "bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  finding.isVulnerable
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {finding.isVulnerable ? "🚨 VULNERABLE" : "✅ PROTECTED"}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getSeverityBadge(finding.severity)}`}>
                                {finding.severity}
                              </span>
                              <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider">
                                {finding.category}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-text-primary mt-1">
                              {finding.vectorName}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedVectorId(finding.vectorId);
                                setCustomAttackPayload(finding.samplePayload);
                                setActiveTab("sandbox");
                              }}
                              className="px-2 py-1 text-[11px] rounded bg-bg-page hover:bg-bg-hover border border-border-subtle text-accent hover:text-accent-hover transition-colors font-medium flex items-center gap-1"
                              title="Test this attack in sandbox"
                            >
                              🧪 Test in Sandbox
                            </button>
                          </div>
                        </div>

                        {/* Audit Details */}
                        <div className="mt-2.5 text-xs space-y-2">
                          <p className="text-text-secondary leading-relaxed">
                            {finding.reason}
                          </p>

                          <div className="p-2.5 rounded-lg bg-bg-page border border-border-subtle/80 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted">
                              <span>Adversarial Attack Payload:</span>
                              <button
                                onClick={() => handleCopy(finding.samplePayload, `payload-${finding.vectorId}`)}
                                className="text-text-muted hover:text-text-primary"
                              >
                                {copiedKey === `payload-${finding.vectorId}` ? "Copied! ✓" : "Copy Payload"}
                              </button>
                            </div>
                            <div className="font-mono text-[11px] text-red-300/90 whitespace-pre-wrap break-words bg-red-950/20 p-2 rounded border border-red-900/30">
                              {finding.samplePayload}
                            </div>
                          </div>

                          {finding.isVulnerable && (
                            <div className="p-2.5 rounded-lg bg-bg-page border border-border-subtle space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted">
                                <span>🛠️ Recommended Security Remediation:</span>
                                <button
                                  onClick={() => handleCopy(finding.recommendedSnippet, `snippet-${finding.vectorId}`)}
                                  className="text-emerald-400 hover:underline"
                                >
                                  {copiedKey === `snippet-${finding.vectorId}` ? "Copied! ✓" : "Copy Patch"}
                                </button>
                              </div>
                              <p className="text-text-muted text-[11px]">{finding.remediation}</p>
                              <pre className="font-mono text-[11px] text-emerald-300 whitespace-pre-wrap break-words bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                                {finding.recommendedSnippet}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INTERACTIVE ATTACK SANDBOX */}
            {activeTab === "sandbox" && (
              <div className="flex-1 mt-4 space-y-4 flex flex-col">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-text-muted">Select Attack Vector to Simulate:</span>
                  <select
                    value={selectedVectorId}
                    onChange={(e) => {
                      const vec = ATTACK_VECTORS.find((v) => v.id === e.target.value);
                      setSelectedVectorId(e.target.value);
                      if (vec) setCustomAttackPayload(vec.payload);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-bg-page border border-border-subtle text-text-primary outline-none focus:border-accent"
                  >
                    {ATTACK_VECTORS.map((v) => (
                      <option key={v.id} value={v.id}>
                        [{v.severity}] {v.name} ({v.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted">Adversarial User Input Payload:</span>
                    <button
                      onClick={() => handleCopy(customAttackPayload, "sandbox-payload")}
                      className="text-[11px] text-text-muted hover:text-text-primary"
                    >
                      {copiedKey === "sandbox-payload" ? "Copied! ✓" : "Copy Payload"}
                    </button>
                  </div>
                  <textarea
                    value={customAttackPayload}
                    onChange={(e) => setCustomAttackPayload(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 font-mono text-xs rounded-lg bg-bg-page border border-border-subtle text-red-300 outline-none focus:border-accent"
                  />
                </div>

                {/* Threat Preview Box */}
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      ⚠️ Threat Impact & Expected Vulnerability Vector:
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getSeverityBadge(selectedVector.severity)}`}>
                      {selectedVector.severity}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">{selectedVector.threatImpact}</p>
                </div>

                {/* Simulated Combined Context */}
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-muted">Simulated Raw Prompt Context Stream:</span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `[SYSTEM PROMPT]\n${promptText}\n\n[USER INPUT]\n${customAttackPayload}`,
                          "simulated"
                        )
                      }
                      className="text-[11px] text-accent hover:underline"
                    >
                      {copiedKey === "simulated" ? "Copied! ✓" : "Copy Full Context"}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-bg-card p-3 rounded border border-border-subtle max-h-48 overflow-y-auto space-y-2">
                    <div className="text-blue-300">
                      <span className="text-text-muted select-none"># System Message</span>
                      <pre className="whitespace-pre-wrap">{promptText || "(Empty system prompt)"}</pre>
                    </div>
                    <div className="text-red-300 border-t border-border-subtle pt-2">
                      <span className="text-text-muted select-none"># Untrusted User Payload</span>
                      <pre className="whitespace-pre-wrap">{customAttackPayload}</pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FORTIFIED OUTPUT */}
            {activeTab === "fortify" && (
              <div className="flex-1 mt-4 space-y-4 flex flex-col">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <span>🛡️</span>
                    <span>MegaTools Guardrail Fortification Layers</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    Select security features to incorporate into your fortified production system prompt:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                      <input
                        type="checkbox"
                        checked={fortifyOpts.includeHierarchy}
                        onChange={(e) => setFortifyOpts({ ...fortifyOpts, includeHierarchy: e.target.checked })}
                        className="rounded border-border-subtle"
                      />
                      Instruction Priority Precedence
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                      <input
                        type="checkbox"
                        checked={fortifyOpts.includeAntiLeak}
                        onChange={(e) => setFortifyOpts({ ...fortifyOpts, includeAntiLeak: e.target.checked })}
                        className="rounded border-border-subtle"
                      />
                      Strict Non-Disclosure Clause
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                      <input
                        type="checkbox"
                        checked={fortifyOpts.includeExfiltrationBlock}
                        onChange={(e) => setFortifyOpts({ ...fortifyOpts, includeExfiltrationBlock: e.target.checked })}
                        className="rounded border-border-subtle"
                      />
                      Markdown Image Exfiltration Defense
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                      <input
                        type="checkbox"
                        checked={fortifyOpts.includeMultiLingual}
                        onChange={(e) => setFortifyOpts({ ...fortifyOpts, includeMultiLingual: e.target.checked })}
                        className="rounded border-border-subtle"
                      />
                      Multi-Lingual & Cipher Consistency
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={fortifyOpts.includeRefusalTemplate}
                        onChange={(e) => setFortifyOpts({ ...fortifyOpts, includeRefusalTemplate: e.target.checked })}
                        className="rounded border-border-subtle"
                      />
                      Standardized Safe Refusal Template
                    </label>
                  </div>
                </div>

                <div className="flex-1 flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted">Fortified System Prompt Output:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setPromptText(fortifiedPrompt);
                          setActiveTab("findings");
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-bg-page transition-colors"
                      >
                        Apply to Editor ↺
                      </button>
                      <button
                        onClick={() => handleCopy(fortifiedPrompt, "fortified")}
                        className="px-2.5 py-1 text-[11px] rounded bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary"
                      >
                        {copiedKey === "fortified" ? "Copied! ✓" : "Copy Hardened"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    value={fortifiedPrompt}
                    rows={12}
                    className="w-full flex-1 p-3 rounded-lg font-mono text-xs leading-relaxed bg-bg-page border border-border-subtle text-emerald-300/90 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: PRODUCTION CHECKLIST */}
            {activeTab === "checklist" && (
              <div className="flex-1 mt-4 space-y-3 overflow-y-auto max-h-[560px] pr-1">
                <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-page space-y-3">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>🛡️</span>
                    <span>Enterprise LLM Production Security Checklist</span>
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Defense-in-depth principles recommended by OWASP Top 10 for Large Language Models:
                  </p>

                  <div className="space-y-2.5 text-xs text-text-secondary">
                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold mt-0.5">1.</span>
                      <div>
                        <strong className="text-text-primary">Separate System Instructions from Untrusted User Data:</strong>
                        <p className="text-text-muted mt-0.5">
                          Never concatenate raw user strings directly without enclosing delimiters like <code>&lt;user_input&gt;</code> or system message roles.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold mt-0.5">2.</span>
                      <div>
                        <strong className="text-text-primary">Enforce Non-Disclosure Clauses:</strong>
                        <p className="text-text-muted mt-0.5">
                          Explicitly state that system instructions, hidden tool signatures, and internal tokens must never be revealed or summarized.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold mt-0.5">3.</span>
                      <div>
                        <strong className="text-text-primary">Disable Dangerous Output Rendering:</strong>
                        <p className="text-text-muted mt-0.5">
                          Sanitize markdown output to disallow arbitrary image tags (<code>![img](url)</code>) and inline scripts that can trigger telemetry leaks or XSS.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold mt-0.5">4.</span>
                      <div>
                        <strong className="text-text-primary">Treat RAG & Tool Outputs as Untrusted:</strong>
                        <p className="text-text-muted mt-0.5">
                          Indirect prompt injection often originates from scraped webpages, email contents, or user-uploaded PDF resumes rather than direct user chat.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="text-emerald-400 font-bold mt-0.5">5.</span>
                      <div>
                        <strong className="text-text-primary">Implement Dual-Model Guardrails:</strong>
                        <p className="text-text-muted mt-0.5">
                          For high-consequence operations (financial transactions, DB writes), use a lightweight secondary model or regex classifier to audit outputs before execution.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
