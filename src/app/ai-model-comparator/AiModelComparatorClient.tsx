"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import RAW_MODELS_DEV_DATA from "@/lib/models-dev-data.json";

export interface ModelsDevCost {
  input?: number;
  output?: number;
  cache_read?: number;
  cache_write?: number;
}

export interface ModelsDevLimit {
  context?: number;
  input?: number;
  output?: number;
}

export interface ModelsDevModalities {
  input?: string[];
  output?: string[];
}

export interface ModelsDevModel {
  id: string;
  name?: string;
  description?: string;
  family?: string;
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  structured_output?: boolean;
  temperature?: boolean;
  open_weights?: boolean;
  release_date?: string;
  last_updated?: string;
  knowledge?: string;
  status?: string;
  modalities?: ModelsDevModalities;
  limit?: ModelsDevLimit;
  cost?: ModelsDevCost;
}

export interface ModelsDevProvider {
  id: string;
  name?: string;
  env?: string[];
  npm?: string;
  api?: string;
  doc?: string;
  models?: Record<string, ModelsDevModel>;
}

export type ModelsDevApiResponse = Record<string, ModelsDevProvider>;

export interface FlattenedModelView {
  providerId: string;
  providerName: string;
  providerNpm?: string;
  providerDoc?: string;
  modelId: string;
  model: ModelsDevModel;
}

type SortField =
  | "name"
  | "provider"
  | "context"
  | "output_limit"
  | "input"
  | "output"
  | "cache_read"
  | "cache_write"
  | "est_cost"
  | "knowledge"
  | "release_date";

type SortDirection = "asc" | "desc";

const PRESETS = [
  { label: "Quick Chat", input: 800, output: 250 },
  { label: "Coding Assistant", input: 5000, output: 1500 },
  { label: "RAG & Docs", input: 50000, output: 2500 },
  { label: "Agent Reasoning Loop", input: 20000, output: 8000 },
  { label: "1M Token Batch", input: 800000, output: 200000 },
];

function formatTokenLimit(tokens?: number): string {
  if (!tokens || tokens <= 0) return "-";
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${Math.round(tokens / 1_000)}k`;
  }
  return tokens.toLocaleString();
}

function formatPrice(val?: number): string {
  if (val === undefined || val === null) return "-";
  if (val === 0) return "$0.00";
  if (val < 0.001) return `$${val.toFixed(4)}`;
  if (val < 0.01) return `$${val.toFixed(3)}`;
  return `$${val.toFixed(2)}`;
}

export default function AiModelComparatorClient() {
  const [data, setData] = useState<ModelsDevApiResponse>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("megatools_models_dev_raw");
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {
        // Fallback to bundled
      }
    }
    return RAW_MODELS_DEV_DATA as unknown as ModelsDevApiResponse;
  });

  const [inputTokens, setInputTokens] = useState<number>(10000);
  const [outputTokens, setOutputTokens] = useState<number>(2000);
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [selectedCapability, setSelectedCapability] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("release_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [displayCount, setDisplayCount] = useState<number>(50);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync with live models.dev open API directly
  const handleSyncModelsDev = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus("FETCHING...");
    try {
      const res = await fetch("https://models.dev/api.json");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const apiData: ModelsDevApiResponse = await res.json();

      if (apiData && Object.keys(apiData).length > 5) {
        setData(apiData);
        localStorage.setItem("megatools_models_dev_raw", JSON.stringify(apiData));
        setSyncStatus(`SYNCED (${Object.keys(apiData).length} PROVIDERS)`);
        setTimeout(() => setSyncStatus(null), 4000);
      }
    } catch {
      setSyncStatus("OFFLINE (USED LOCAL)");
      setTimeout(() => setSyncStatus(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const handleCopyModelId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Flatten models from native models.dev structure
  const allModels = useMemo<FlattenedModelView[]>(() => {
    const list: FlattenedModelView[] = [];
    for (const [providerId, provider] of Object.entries(data)) {
      if (provider && provider.models && typeof provider.models === "object") {
        for (const [modelId, model] of Object.entries(provider.models)) {
          if (model) {
            list.push({
              providerId,
              providerName: provider.name || providerId,
              providerNpm: provider.npm,
              providerDoc: provider.doc,
              modelId,
              model,
            });
          }
        }
      }
    }
    return list;
  }, [data]);

  // Major provider filter list
  const topProviders = useMemo(() => {
    const counts = new Map<string, number>();
    allModels.forEach((m) => {
      const p = m.providerName;
      counts.set(p, (counts.get(p) || 0) + 1);
    });
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
    return ["ALL", ...sorted];
  }, [allModels]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(
        field === "context" || field === "output_limit" || field === "release_date" || field === "knowledge"
          ? "desc"
          : "asc"
      );
    }
  };

  const filteredAndSorted = useMemo(() => {
    const list = allModels.filter((item) => {
      // Provider filter
      if (
        selectedProvider !== "ALL" &&
        item.providerName.toLowerCase() !== selectedProvider.toLowerCase() &&
        item.providerId.toLowerCase() !== selectedProvider.toLowerCase()
      ) {
        return false;
      }

      // Capability filter
      const m = item.model;
      if (selectedCapability === "reasoning" && !m.reasoning) return false;
      if (
        selectedCapability === "vision" &&
        !m.attachment &&
        !m.modalities?.input?.includes("image")
      )
        return false;
      if (selectedCapability === "tools" && !m.tool_call) return false;
      if (selectedCapability === "structured" && !m.structured_output) return false;
      if (selectedCapability === "open_weights" && !m.open_weights) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.modelId.toLowerCase().includes(q) ||
          (m.name && m.name.toLowerCase().includes(q)) ||
          item.providerName.toLowerCase().includes(q) ||
          (m.family && m.family.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      const aModel = a.model;
      const bModel = b.model;

      const aEstCost =
        (inputTokens / 1e6) * (aModel.cost?.input ?? 0) +
        (outputTokens / 1e6) * (aModel.cost?.output ?? 0);
      const bEstCost =
        (inputTokens / 1e6) * (bModel.cost?.input ?? 0) +
        (outputTokens / 1e6) * (bModel.cost?.output ?? 0);

      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = (aModel.name || a.modelId).localeCompare(bModel.name || b.modelId);
          break;
        case "provider":
          comparison = a.providerName.localeCompare(b.providerName);
          break;
        case "context":
          comparison = (aModel.limit?.context ?? 0) - (bModel.limit?.context ?? 0);
          break;
        case "output_limit":
          comparison = (aModel.limit?.output ?? 0) - (bModel.limit?.output ?? 0);
          break;
        case "input":
          comparison = (aModel.cost?.input ?? 0) - (bModel.cost?.input ?? 0);
          break;
        case "output":
          comparison = (aModel.cost?.output ?? 0) - (bModel.cost?.output ?? 0);
          break;
        case "cache_read":
          comparison = (aModel.cost?.cache_read ?? 0) - (bModel.cost?.cache_read ?? 0);
          break;
        case "cache_write":
          comparison = (aModel.cost?.cache_write ?? 0) - (bModel.cost?.cache_write ?? 0);
          break;
        case "est_cost":
          comparison = aEstCost - bEstCost;
          break;
        case "knowledge":
          comparison = (aModel.knowledge || "").localeCompare(bModel.knowledge || "");
          break;
        case "release_date": {
          const dateA = aModel.release_date || aModel.last_updated || "";
          const dateB = bModel.release_date || bModel.last_updated || "";
          if (!dateA && !dateB) comparison = 0;
          else if (!dateA) return 1;
          else if (!dateB) return -1;
          else comparison = dateA.localeCompare(dateB);
          break;
        }
        default:
          comparison = 0;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    allModels,
    selectedProvider,
    selectedCapability,
    searchQuery,
    sortField,
    sortDirection,
    inputTokens,
    outputTokens,
  ]);

  const displayedList = useMemo(() => {
    return filteredAndSorted.slice(0, displayCount);
  }, [filteredAndSorted, displayCount]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">models.dev Providers</p>
        <p className="text-accent font-jetbrains text-xs font-bold tabular-nums">
          {Object.keys(data).length} Providers
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Total Models Catalog</p>
        <p className="text-text-primary font-jetbrains text-xs tabular-nums">
          {allModels.length.toLocaleString()} Models
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="card p-4 sm:p-6 min-w-0">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">models.dev AI Model Matrix</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-text-secondary">
              Full specification matrix, context limits, cache pricing, modalities, and token cost simulator across all models.dev models.
            </p>
          </div>

          {/* Token Simulator Controls */}
          <div className="mb-6 p-4 rounded-xl bg-bg-page border border-border-subtle space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/70 pb-3">
              <span className="text-xs font-mono font-bold text-text-secondary uppercase">
                [1] Token Run Cost Simulator
              </span>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncModelsDev}
                className="px-2.5 py-1 text-xs font-mono rounded border border-accent/40 bg-accent-soft text-accent hover:bg-accent-hover hover:text-bg-page transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <span>$ sync models.dev</span>
                {syncStatus && <span className="font-bold text-[10px]">[{syncStatus}]</span>}
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-text-muted">Presets:</span>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputTokens(p.input);
                    setOutputTokens(p.output);
                  }}
                  className="px-2 py-0.5 rounded border border-border-subtle bg-bg-card text-text-secondary hover:border-accent/40 hover:text-text-primary transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-text-secondary">
                    Input Tokens (Prompt + Context):
                  </label>
                  <span className="text-xs font-jetbrains text-accent font-bold tabular-nums">
                    {inputTokens.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  value={inputTokens}
                  onChange={(e) => setInputTokens(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg bg-bg-card border border-border-subtle font-jetbrains text-xs text-text-primary focus:border-accent focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-text-secondary">
                    Output Tokens (Generation / Reasoning):
                  </label>
                  <span className="text-xs font-jetbrains text-accent font-bold tabular-nums">
                    {outputTokens.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg bg-bg-card border border-border-subtle font-jetbrains text-xs text-text-primary focus:border-accent focus:outline-none tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Filters & Capabilities Toolbar */}
          <div className="space-y-3 mb-4">
            {/* Providers filter pills */}
            <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
              <span className="text-text-muted mr-1">Provider:</span>
              {topProviders.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(p);
                    setDisplayCount(50);
                  }}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-xs ${
                    selectedProvider === p
                      ? "bg-accent text-bg-page font-bold"
                      : "border border-border-subtle bg-bg-page/60 text-text-muted hover:text-text-primary"
                  }`}
                >
                  [{p}]
                </button>
              ))}
            </div>

            {/* Capability filter pills */}
            <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
              <span className="text-text-muted mr-1">Feature:</span>
              {[
                { id: "ALL", label: "All Models" },
                { id: "reasoning", label: "Reasoning" },
                { id: "vision", label: "Vision / Multimodal" },
                { id: "tools", label: "Tool Call" },
                { id: "structured", label: "Structured Output" },
                { id: "open_weights", label: "Open Weights" },
              ].map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => {
                    setSelectedCapability(cap.id);
                    setDisplayCount(50);
                  }}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-xs ${
                    selectedCapability === cap.id
                      ? "bg-accent text-bg-page font-bold"
                      : "border border-border-subtle bg-bg-page/60 text-text-muted hover:text-text-primary"
                  }`}
                >
                  {cap.label}
                </button>
              ))}
            </div>

            {/* Search & Sort Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDisplayCount(50);
                  }}
                  placeholder="Search model name, provider, ID, family, description..."
                  className="w-full p-2 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-text-muted whitespace-nowrap">Sort by:</span>
                <select
                  value={`${sortField}:${sortDirection}`}
                  onChange={(e) => {
                    const [f, d] = e.target.value.split(":");
                    setSortField(f as SortField);
                    setSortDirection(d as SortDirection);
                  }}
                  className="p-2 rounded bg-bg-page border border-border-subtle text-text-primary text-xs font-mono focus:border-accent focus:outline-none cursor-pointer"
                >
                  <option value="release_date:desc">Release Date (Newest First)</option>
                  <option value="release_date:asc">Release Date (Oldest First)</option>
                  <option value="est_cost:asc">Est. Run Cost (Low → High)</option>
                  <option value="est_cost:desc">Est. Run Cost (High → Low)</option>
                  <option value="context:desc">Context Window (Max → Min)</option>
                  <option value="output_limit:desc">Max Output Limit (Max → Min)</option>
                  <option value="input:asc">Input Price (Lowest $/1M)</option>
                  <option value="input:desc">Input Price (Highest $/1M)</option>
                  <option value="output:asc">Output Price (Lowest $/1M)</option>
                  <option value="output:desc">Output Price (Highest $/1M)</option>
                  <option value="cache_read:asc">Cache Read (Lowest $/1M)</option>
                  <option value="cache_write:asc">Cache Write (Lowest $/1M)</option>
                  <option value="knowledge:desc">Knowledge Cutoff (Newest First)</option>
                  <option value="name:asc">Model Name (A → Z)</option>
                  <option value="provider:asc">Provider (A → Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Full models.dev Table */}
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-page max-h-[660px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs min-w-[960px]">
              <thead className="sticky top-0 z-10 border-b border-border-subtle bg-bg-card text-text-secondary uppercase">
                <tr>
                  <th
                    onClick={() => toggleSort("name")}
                    className="p-3 cursor-pointer hover:text-accent select-none transition-colors min-w-[220px]"
                  >
                    <div className="flex items-center gap-1">
                      <span>Model</span>
                      {sortField === "name" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("provider")}
                    className="p-3 cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Provider</span>
                      {sortField === "provider" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("context")}
                    className="p-3 text-right cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Context</span>
                      {sortField === "context" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("output_limit")}
                    className="p-3 text-right cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Max Out</span>
                      {sortField === "output_limit" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("input")}
                    className="p-3 text-right cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Input / 1M</span>
                      {sortField === "input" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("output")}
                    className="p-3 text-right cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Output / 1M</span>
                      {sortField === "output" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("cache_read")}
                    className="p-3 text-right cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Cache Read</span>
                      {sortField === "cache_read" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("cache_write")}
                    className="p-3 text-right cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Cache Write</span>
                      {sortField === "cache_write" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("est_cost")}
                    className="p-3 text-right cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Est. Cost</span>
                      {sortField === "est_cost" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th className="p-3 text-center">Modalities</th>
                  <th className="p-3 text-center">Features</th>
                  <th
                    onClick={() => toggleSort("knowledge")}
                    className="p-3 text-center cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Cutoff</span>
                      {sortField === "knowledge" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("release_date")}
                    className="p-3 text-center cursor-pointer hover:text-accent select-none transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Release</span>
                      {sortField === "release_date" && (
                        <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {displayedList.map((item) => {
                  const m = item.model;
                  const inCost = m.cost?.input;
                  const outCost = m.cost?.output;
                  const cacheReadCost = m.cost?.cache_read;
                  const cacheWriteCost = m.cost?.cache_write;
                  const hasCost = inCost !== undefined || outCost !== undefined;

                  const totalEst =
                    (inputTokens / 1e6) * (inCost ?? 0) + (outputTokens / 1e6) * (outCost ?? 0);

                  const isCopied = copiedId === item.modelId;
                  const inModalities = m.modalities?.input || ["text"];
                  const outModalities = m.modalities?.output || ["text"];

                  return (
                    <tr
                      key={`${item.providerId}/${item.modelId}`}
                      className="hover:bg-accent-soft/20 transition-colors"
                    >
                      {/* Model */}
                      <td className="p-3 font-semibold text-text-primary">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-accent hover:underline cursor-pointer">
                              {m.name || item.modelId}
                            </span>
                            {m.family && (
                              <span className="text-[10px] text-text-muted font-normal">
                                ({m.family})
                              </span>
                            )}
                            {m.open_weights && (
                              <span className="px-1 py-0.2 rounded text-[9px] bg-accent/10 text-accent border border-accent/20">
                                Open
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-normal">
                            <button
                              type="button"
                              onClick={() => handleCopyModelId(item.modelId)}
                              title="Click to copy model ID"
                              className="hover:text-text-primary truncate max-w-[180px] text-left cursor-pointer transition-colors"
                            >
                              {item.modelId}
                              {isCopied && <span className="ml-1 text-accent font-bold">[copied]</span>}
                            </button>
                            {item.providerDoc && (
                              <a
                                href={item.providerDoc}
                                target="_blank"
                                rel="noreferrer"
                                className="text-text-secondary hover:text-accent underline"
                              >
                                docs ↗
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="p-3 text-text-secondary">
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle">
                          {item.providerName}
                        </span>
                      </td>

                      {/* Context */}
                      <td className="p-3 text-right font-jetbrains text-text-secondary tabular-nums">
                        {formatTokenLimit(m.limit?.context)}
                      </td>

                      {/* Max Output Limit */}
                      <td className="p-3 text-right font-jetbrains text-text-muted tabular-nums">
                        {formatTokenLimit(m.limit?.output)}
                      </td>

                      {/* Input Price / 1M */}
                      <td className="p-3 text-right font-jetbrains text-text-muted tabular-nums">
                        {formatPrice(inCost)}
                      </td>

                      {/* Output Price / 1M */}
                      <td className="p-3 text-right font-jetbrains text-text-muted tabular-nums">
                        {formatPrice(outCost)}
                      </td>

                      {/* Cache Read / 1M */}
                      <td className="p-3 text-right font-jetbrains text-text-muted tabular-nums">
                        {formatPrice(cacheReadCost)}
                      </td>

                      {/* Cache Write / 1M */}
                      <td className="p-3 text-right font-jetbrains text-text-muted tabular-nums">
                        {formatPrice(cacheWriteCost)}
                      </td>

                      {/* Est. Run Cost */}
                      <td className="p-3 text-right font-jetbrains font-bold text-accent tabular-nums">
                        {!hasCost
                          ? "Free / N/A"
                          : totalEst === 0
                          ? "$0.00"
                          : totalEst < 0.0001
                          ? "<$0.0001"
                          : `$${totalEst.toFixed(4)}`}
                      </td>

                      {/* Modalities (In -> Out) */}
                      <td className="p-3 text-center text-[10px] whitespace-nowrap">
                        <span className="text-text-secondary">
                          {inModalities.join(",")} → {outModalities.join(",")}
                        </span>
                      </td>

                      {/* Features */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 flex-wrap justify-center">
                          {m.reasoning && (
                            <span
                              title="Reasoning / Thinking"
                              className="px-1 py-0.2 rounded text-[9px] bg-warning/10 text-warning border border-warning/30 font-mono"
                            >
                              Reason
                            </span>
                          )}
                          {(m.attachment || inModalities.includes("image")) && (
                            <span
                              title="Vision"
                              className="px-1 py-0.2 rounded text-[9px] bg-accent/10 text-accent border border-accent/30 font-mono"
                            >
                              Vision
                            </span>
                          )}
                          {m.tool_call && (
                            <span
                              title="Tool Calling"
                              className="px-1 py-0.2 rounded text-[9px] bg-success/10 text-success border border-success/30 font-mono"
                            >
                              Tools
                            </span>
                          )}
                          {m.structured_output && (
                            <span
                              title="Structured JSON"
                              className="px-1 py-0.2 rounded text-[9px] bg-text-muted/10 text-text-secondary border border-border-subtle font-mono"
                            >
                              JSON
                            </span>
                          )}
                          {m.temperature && (
                            <span
                              title="Temperature control"
                              className="px-1 py-0.2 rounded text-[9px] bg-bg-card text-text-muted border border-border-subtle font-mono"
                            >
                              Temp
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Knowledge Cutoff */}
                      <td className="p-3 text-center font-jetbrains text-[10px] text-text-muted tabular-nums whitespace-nowrap">
                        {m.knowledge || "-"}
                      </td>

                      {/* Release Date */}
                      <td className="p-3 text-center font-jetbrains text-[10px] text-text-muted tabular-nums whitespace-nowrap">
                        {m.release_date || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination / Load more */}
            {filteredAndSorted.length > displayedList.length && (
              <div className="p-4 text-center border-t border-border-subtle bg-bg-card/50 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setDisplayCount((prev) => prev + 50)}
                  className="px-4 py-1.5 rounded border border-border-subtle bg-bg-page hover:border-accent/50 text-accent font-semibold transition-colors cursor-pointer"
                >
                  $ load more (showing {displayedList.length} of {filteredAndSorted.length.toLocaleString()} models)
                </button>
              </div>
            )}

            {filteredAndSorted.length === 0 && (
              <div className="p-8 text-center font-mono text-xs text-text-muted">
                No models found matching filters or query &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="ai-model-comparator" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="ai-model-comparator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
