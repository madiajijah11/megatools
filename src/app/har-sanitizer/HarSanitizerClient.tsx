"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import Link from "next/link";
import {
  sanitizeHar,
  HarSanitizerOptions,
  DEFAULT_SANITIZER_OPTIONS,
  HarSanitizationResult,
  SAMPLE_DIRTY_HAR_JSON,
  SanitizationFinding,
} from "@/lib/har-sanitizer";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

type PresetType = "max" | "standard" | "minimal" | "purge-bodies";

export default function HarSanitizerClient() {
  const [rawInput, setRawInput] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"findings" | "preview" | "settings">("findings");
  const [selectedFindingType, setSelectedFindingType] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<HarSanitizerOptions>(DEFAULT_SANITIZER_OPTIONS);
  const [customKeyInput, setCustomKeyInput] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply Presets
  const applyPreset = (preset: PresetType) => {
    if (preset === "max") {
      setOptions({
        ...DEFAULT_SANITIZER_OPTIONS,
        stripAuthHeaders: true,
        stripCookies: true,
        stripQueryParams: true,
        sanitizeJsonBodies: true,
        sanitizeUrlTokens: true,
        stripAllResponseBodies: false,
        stripBinaryResponseBodies: true,
        maskIpAddresses: true,
        replacementText: "[REDACTED]",
      });
    } else if (preset === "standard") {
      setOptions({
        ...DEFAULT_SANITIZER_OPTIONS,
        stripAuthHeaders: true,
        stripCookies: true,
        stripQueryParams: true,
        sanitizeJsonBodies: true,
        sanitizeUrlTokens: true,
        stripAllResponseBodies: false,
        stripBinaryResponseBodies: true,
        maskIpAddresses: false,
        replacementText: "[REDACTED]",
      });
    } else if (preset === "minimal") {
      setOptions({
        ...DEFAULT_SANITIZER_OPTIONS,
        stripAuthHeaders: true,
        stripCookies: true,
        stripQueryParams: false,
        sanitizeJsonBodies: false,
        sanitizeUrlTokens: false,
        stripAllResponseBodies: false,
        stripBinaryResponseBodies: false,
        maskIpAddresses: false,
        replacementText: "[REDACTED]",
      });
    } else if (preset === "purge-bodies") {
      setOptions({
        ...DEFAULT_SANITIZER_OPTIONS,
        stripAuthHeaders: true,
        stripCookies: true,
        stripQueryParams: true,
        sanitizeJsonBodies: true,
        sanitizeUrlTokens: true,
        stripAllResponseBodies: true,
        stripBinaryResponseBodies: true,
        maskIpAddresses: true,
        replacementText: "[REDACTED]",
      });
    }
  };

  const handleFileUpload = (file: File) => {
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawInput(text);
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const loadSampleHar = () => {
    setError(null);
    setFileName("sample-authenticated-session.har");
    setRawInput(SAMPLE_DIRTY_HAR_JSON);
  };

  // Run Sanitization
  const sanitizationResult = useMemo<HarSanitizationResult | null>(() => {
    if (!rawInput.trim()) return null;
    try {
      setError(null);
      return sanitizeHar(rawInput, options);
    } catch (err: any) {
      setError(err?.message || "Failed to sanitize HAR content. Check format.");
      return null;
    }
  }, [rawInput, options]);

  // Serialized clean JSON
  const sanitizedJsonString = useMemo(() => {
    if (!sanitizationResult) return "";
    return JSON.stringify(sanitizationResult.sanitizedHar, null, 2);
  }, [sanitizationResult]);

  // Filtered Findings
  const filteredFindings = useMemo(() => {
    if (!sanitizationResult) return [];
    return sanitizationResult.findings.filter((f) => {
      const matchesType =
        selectedFindingType === "ALL" || f.location.toUpperCase() === selectedFindingType;
      const q = searchFilter.toLowerCase().trim();
      const matchesQuery =
        !q ||
        f.key.toLowerCase().includes(q) ||
        f.url.toLowerCase().includes(q) ||
        f.action.toLowerCase().includes(q) ||
        f.method.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [sanitizationResult, selectedFindingType, searchFilter]);

  const handleDownload = () => {
    if (!sanitizedJsonString) return;
    const blob = new Blob([sanitizedJsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const downloadName = fileName
      ? fileName.replace(/\.har$/i, "") + ".sanitized.har"
      : "clean-session.har";
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenInViewer = () => {
    if (!sanitizedJsonString) return;
    try {
      sessionStorage.setItem("megatools_har_import", sanitizedJsonString);
    } catch {
      // In case of quota limit
    }
  };

  const addCustomKey = () => {
    const val = customKeyInput.trim();
    if (val && !options.customSensitiveKeys.includes(val)) {
      setOptions((prev) => ({
        ...prev,
        customSensitiveKeys: [...prev.customSensitiveKeys, val],
      }));
      setCustomKeyInput("");
    }
  };

  const removeCustomKey = (key: string) => {
    setOptions((prev) => ({
      ...prev,
      customSensitiveKeys: prev.customSensitiveKeys.filter((k) => k !== key),
    }));
  };

  // Stats for ToolLayout
  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Entries:</span>
        <span className="text-accent font-bold">
          {sanitizationResult ? sanitizationResult.stats.totalEntries : 0}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Secrets Redacted:</span>
        <span className="text-error font-bold">
          {sanitizationResult ? sanitizationResult.stats.totalFindings : 0}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Original Size:</span>
        <span className="text-text-primary">
          {sanitizationResult ? formatBytes(sanitizationResult.stats.originalSize) : "0 B"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Sanitized Size:</span>
        <span className="text-success font-bold">
          {sanitizationResult ? formatBytes(sanitizationResult.stats.sanitizedSize) : "0 B"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Client Privacy:</span>
        <span className="text-success font-bold">100% In-Browser</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="har-sanitizer" stats={stats}>
      <div className="space-y-6 font-mono text-xs">
        {/* Upload & Dropzone Card */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border transition-all p-5 sm:p-6 text-center ${
            isDragging
              ? "border-accent bg-accent/10"
              : "border-border-subtle bg-bg-card hover:border-accent/40"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
            accept=".har,application/json,.json"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full border border-accent/40 bg-accent/5 flex items-center justify-center text-xl text-accent">
              🛡️
            </div>
            <div>
              <p className="font-semibold text-sm text-text-primary">
                Drag & Drop HTTP Archive (.har) file here
              </p>
              <p className="text-text-muted mt-1">
                Zero server uploads. Scrub cookies, tokens, passwords, and sensitive headers locally.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-accent text-bg-page font-bold hover:bg-accent-hover transition-colors shadow-sm"
              >
                Browse .har File
              </button>
              <button
                type="button"
                onClick={loadSampleHar}
                className="px-3.5 py-2 rounded-lg border border-border-subtle bg-bg-page text-text-primary hover:border-accent/60 transition-colors"
              >
                ⚡ Load Sample Leaky HAR
              </button>
              {rawInput && (
                <button
                  type="button"
                  onClick={() => {
                    setRawInput("");
                    setFileName("");
                    setError(null);
                  }}
                  className="px-3 py-2 rounded-lg border border-border-subtle bg-bg-page text-text-muted hover:text-error transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {fileName && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded bg-accent/10 text-accent border border-accent/20">
                <span>📄 {fileName}</span>
                <span className="text-text-muted">
                  ({formatBytes(new Blob([rawInput]).size)})
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-error/40 bg-error/10 text-error">
            <div className="font-bold flex items-center gap-2">
              <span>⚠️ Error</span>
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Options & Configuration Card */}
        <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <span className="font-bold text-text-primary flex items-center gap-2">
              <span>⚙️ Sanitization Strategy & Presets</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset("max")}
                className="px-2.5 py-1 rounded border border-border-subtle hover:border-accent hover:text-accent transition-colors bg-bg-page"
              >
                Maximum Scrub
              </button>
              <button
                type="button"
                onClick={() => applyPreset("standard")}
                className="px-2.5 py-1 rounded border border-border-subtle hover:border-accent hover:text-accent transition-colors bg-bg-page"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => applyPreset("minimal")}
                className="px-2.5 py-1 rounded border border-border-subtle hover:border-accent hover:text-accent transition-colors bg-bg-page"
              >
                Minimal (Headers Only)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("purge-bodies")}
                className="px-2.5 py-1 rounded border border-border-subtle hover:border-accent hover:text-accent transition-colors bg-bg-page"
              >
                Ultra-Compact (Purge Bodies)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 p-2 rounded border border-border-subtle/70 bg-bg-page cursor-pointer hover:border-accent/40">
              <input
                type="checkbox"
                checked={options.stripAuthHeaders}
                onChange={(e) =>
                  setOptions({ ...options, stripAuthHeaders: e.target.checked })
                }
                className="rounded accent-accent"
              />
              <div>
                <div className="font-semibold text-text-primary">Auth & Bearer Headers</div>
                <div className="text-[10px] text-text-muted">Authorization, X-Api-Key, Tokens</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded border border-border-subtle/70 bg-bg-page cursor-pointer hover:border-accent/40">
              <input
                type="checkbox"
                checked={options.stripCookies}
                onChange={(e) =>
                  setOptions({ ...options, stripCookies: e.target.checked })
                }
                className="rounded accent-accent"
              />
              <div>
                <div className="font-semibold text-text-primary">Cookie & Session Data</div>
                <div className="text-[10px] text-text-muted">Cookie, Set-Cookie & cookie arrays</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded border border-border-subtle/70 bg-bg-page cursor-pointer hover:border-accent/40">
              <input
                type="checkbox"
                checked={options.stripQueryParams}
                onChange={(e) =>
                  setOptions({ ...options, stripQueryParams: e.target.checked })
                }
                className="rounded accent-accent"
              />
              <div>
                <div className="font-semibold text-text-primary">Query String Credentials</div>
                <div className="text-[10px] text-text-muted">?token=, ?key=, ?secret=, ?code=</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded border border-border-subtle/70 bg-bg-page cursor-pointer hover:border-accent/40">
              <input
                type="checkbox"
                checked={options.sanitizeJsonBodies}
                onChange={(e) =>
                  setOptions({ ...options, sanitizeJsonBodies: e.target.checked })
                }
                className="rounded accent-accent"
              />
              <div>
                <div className="font-semibold text-text-primary">Deep JSON Body Scrub</div>
                <div className="text-[10px] text-text-muted">Passwords, secrets, cards, JWTs</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded border border-border-subtle/70 bg-bg-page cursor-pointer hover:border-accent/40">
              <input
                type="checkbox"
                checked={options.sanitizeUrlTokens}
                onChange={(e) =>
                  setOptions({ ...options, sanitizeUrlTokens: e.target.checked })
                }
                className="rounded accent-accent"
              />
              <div>
                <div className="font-semibold text-text-primary">URL Token Masking</div>
                <div className="text-[10px] text-text-muted">Scrub tokens from raw request.url</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded border border-border-subtle/70 bg-bg-page cursor-pointer hover:border-accent/40">
              <input
                type="checkbox"
                checked={options.stripBinaryResponseBodies}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    stripBinaryResponseBodies: e.target.checked,
                  })
                }
                className="rounded accent-accent"
              />
              <div>
                <div className="font-semibold text-text-primary">Strip Binary / Base64 Media</div>
                <div className="text-[10px] text-text-muted">Removes bloated images, fonts, audio</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded border border-border-subtle/70 bg-bg-page cursor-pointer hover:border-accent/40">
              <input
                type="checkbox"
                checked={options.stripAllResponseBodies}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    stripAllResponseBodies: e.target.checked,
                  })
                }
                className="rounded accent-accent"
              />
              <div>
                <div className="font-semibold text-text-primary">Strip All Response Bodies</div>
                <div className="text-[10px] text-text-muted">Preserves headers, purges all responses</div>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2 rounded border border-border-subtle/70 bg-bg-page cursor-pointer hover:border-accent/40">
              <input
                type="checkbox"
                checked={options.maskIpAddresses}
                onChange={(e) =>
                  setOptions({ ...options, maskIpAddresses: e.target.checked })
                }
                className="rounded accent-accent"
              />
              <div>
                <div className="font-semibold text-text-primary">Mask IP Addresses</div>
                <div className="text-[10px] text-text-muted">serverIPAddress & clientIPAddress</div>
              </div>
            </label>
          </div>

          <div className="pt-2 flex flex-col md:flex-row gap-4 border-t border-border-subtle">
            <div className="flex-1 space-y-1">
              <label className="text-text-muted text-[11px]">Replacement Placeholder:</label>
              <input
                type="text"
                value={options.replacementText}
                onChange={(e) =>
                  setOptions({ ...options, replacementText: e.target.value })
                }
                placeholder="[REDACTED]"
                className="w-full px-3 py-1.5 rounded border border-border-subtle bg-bg-page text-text-primary focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-text-muted text-[11px]">
                Add Custom Sensitive Header or Key:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomKey();
                    }
                  }}
                  placeholder="e.g. x-corp-auth, employee_id"
                  className="w-full px-3 py-1.5 rounded border border-border-subtle bg-bg-page text-text-primary focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomKey}
                  className="px-3 py-1.5 rounded bg-bg-page border border-border-subtle hover:border-accent text-accent font-bold"
                >
                  Add
                </button>
              </div>

              {options.customSensitiveKeys.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {options.customSensitiveKeys.map((k) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent text-[11px]"
                    >
                      {k}
                      <button
                        type="button"
                        onClick={() => removeCustomKey(k)}
                        className="hover:text-error ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results & Inspection Section */}
        {sanitizationResult && (
          <div className="space-y-4">
            {/* Summary Stat Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card space-y-1">
                <span className="text-text-muted text-[11px]">Total Secrets Redacted</span>
                <div className="text-xl font-bold text-error">
                  {sanitizationResult.stats.totalFindings}
                </div>
                <div className="text-[10px] text-text-muted">
                  Across {sanitizationResult.stats.totalEntries} requests
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card space-y-1">
                <span className="text-text-muted text-[11px]">Headers & Cookies</span>
                <div className="text-xl font-bold text-accent">
                  {sanitizationResult.stats.redactedHeaders +
                    sanitizationResult.stats.redactedCookies}
                </div>
                <div className="text-[10px] text-text-muted">
                  {sanitizationResult.stats.redactedHeaders} hdrs ·{" "}
                  {sanitizationResult.stats.redactedCookies} cookies
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card space-y-1">
                <span className="text-text-muted text-[11px]">Bodies & Query Keys</span>
                <div className="text-xl font-bold text-accent">
                  {sanitizationResult.stats.redactedBodyKeys +
                    sanitizationResult.stats.redactedQueryParams}
                </div>
                <div className="text-[10px] text-text-muted">
                  {sanitizationResult.stats.redactedBodyKeys} body ·{" "}
                  {sanitizationResult.stats.redactedQueryParams} query
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border-subtle bg-bg-card space-y-1">
                <span className="text-text-muted text-[11px]">Size Optimization</span>
                <div className="text-xl font-bold text-success">
                  {sanitizationResult.stats.originalSize > 0
                    ? `${Math.round(
                        (1 -
                          sanitizationResult.stats.sanitizedSize /
                            sanitizationResult.stats.originalSize) *
                          100
                      )}% reduction`
                    : "0%"}
                </div>
                <div className="text-[10px] text-text-muted">
                  {formatBytes(sanitizationResult.stats.originalSize)} →{" "}
                  {formatBytes(sanitizationResult.stats.sanitizedSize)}
                </div>
              </div>
            </div>

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border-subtle bg-bg-card">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-lg bg-accent text-bg-page font-bold hover:bg-accent-hover transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <span>⬇️ Download Sanitized .HAR</span>
                </button>
                <CopyButton text={sanitizedJsonString} label="Copy Clean HAR" />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/har-viewer"
                  onClick={handleOpenInViewer}
                  className="px-3.5 py-2 rounded-lg border border-border-subtle bg-bg-page text-accent hover:border-accent transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Open in HAR Waterfall Viewer ↗</span>
                </Link>
              </div>
            </div>

            {/* Tabs for Findings vs JSON Preview */}
            <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle bg-bg-page px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("findings")}
                    className={`px-3 py-1 rounded font-bold transition-colors ${
                      activeTab === "findings"
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    🛡️ Redactions Audit Log ({sanitizationResult.findings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1 rounded font-bold transition-colors ${
                      activeTab === "preview"
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    📄 Sanitized HAR Preview
                  </button>
                </div>

                {activeTab === "findings" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Filter findings..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-primary text-xs focus:border-accent focus:outline-none w-36 sm:w-48"
                    />
                  </div>
                )}
              </div>

              {activeTab === "findings" ? (
                <div className="p-4 space-y-3">
                  {/* Category filters */}
                  <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-border-subtle/50 text-[11px]">
                    <span className="text-text-muted">Type:</span>
                    {["ALL", "HEADER", "COOKIE", "QUERY", "BODY", "URL", "IP"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedFindingType(t)}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          selectedFindingType === t
                            ? "border-accent text-accent bg-accent/10"
                            : "border-border-subtle text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {filteredFindings.length === 0 ? (
                    <div className="py-8 text-center text-text-muted">
                      {sanitizationResult.findings.length === 0
                        ? "🎉 No sensitive tokens or credentials detected in this HAR file."
                        : "No findings match your current filters."}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border-subtle text-text-muted text-[11px]">
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3">Method</th>
                            <th className="py-2 px-3">Field / Target</th>
                            <th className="py-2 px-3">Action Taken</th>
                            <th className="py-2 px-3">URL Context</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle/50">
                          {filteredFindings.slice(0, 100).map((f) => {
                            const badgeColor =
                              f.location === "header"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                : f.location === "cookie"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : f.location === "body"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                : f.location === "query"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : f.location === "url"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";

                            return (
                              <tr key={f.id} className="hover:bg-bg-page/60">
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${badgeColor}`}
                                  >
                                    {f.location}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                                  <span
                                    className={
                                      f.method === "POST"
                                        ? "text-accent"
                                        : f.method === "GET"
                                        ? "text-blue-400"
                                        : "text-amber-400"
                                    }
                                  >
                                    {f.method}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-text-primary whitespace-nowrap">
                                  {f.key}
                                </td>
                                <td className="py-2.5 px-3 text-text-secondary">
                                  {f.action}
                                </td>
                                <td className="py-2.5 px-3 text-text-muted truncate max-w-xs sm:max-w-sm">
                                  {f.url}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {filteredFindings.length > 100 && (
                        <div className="py-2 text-center text-text-muted text-[11px] border-t border-border-subtle">
                          Showing first 100 of {filteredFindings.length} findings. Export HAR to review all changes.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-text-muted text-[11px]">
                    <span>Format: Standard HAR 1.2 JSON</span>
                    <span>{sanitizedJsonString.split("\n").length.toLocaleString()} lines</span>
                  </div>
                  <pre className="max-h-[500px] overflow-auto p-3.5 rounded-lg border border-border-subtle bg-bg-page text-text-primary text-xs leading-relaxed whitespace-pre font-mono">
                    {sanitizedJsonString.slice(0, 100000)}
                    {sanitizedJsonString.length > 100000 &&
                      "\n\n... [Preview truncated for performance. Download full file to view all] ..."}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
