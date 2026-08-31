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
  temperature?: boolean;
  release_date?: string;
  last_updated?: string;
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

const PRESETS = [
  { label: "Code Assistant Prompt", input: 5000, output: 1200 },
  { label: "Large PDF / Doc Analysis", input: 85000, output: 3500 },
  { label: "Customer Support Chat", input: 800, output: 250 },
  { label: "1 Million Tokens Batch", input: 800000, output: 200000 },
];

export default function AiModelComparatorClient() {
  const [data, setData] = useState<ModelsDevApiResponse>(
    RAW_MODELS_DEV_DATA as unknown as ModelsDevApiResponse
  );
  const [inputTokens, setInputTokens] = useState<number>(10000);
  const [outputTokens, setOutputTokens] = useState<number>(2000);
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"cost" | "context" | "inputPrice" | "outputPrice">("cost");
  const [displayCount, setDisplayCount] = useState<number>(60);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => {
    try {
      const cached = localStorage.getItem("megatools_models_dev_raw");
      if (cached) {
        setData(JSON.parse(cached));
      }
    } catch {
      // Ignore cache errors
    }
  }, []);

  // Extract all models from native models.dev provider structure
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
      .slice(0, 8)
      .map(([name]) => name);
    return ["ALL", ...sorted];
  }, [allModels]);

  const filteredAndSorted = useMemo(() => {
    const list = allModels.filter((item) => {
      if (
        selectedProvider !== "ALL" &&
        item.providerName.toLowerCase() !== selectedProvider.toLowerCase() &&
        item.providerId.toLowerCase() !== selectedProvider.toLowerCase()
      ) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const m = item.model;
        return (
          item.modelId.toLowerCase().includes(q) ||
          (m.name && m.name.toLowerCase().includes(q)) ||
          item.providerName.toLowerCase().includes(q) ||
          (m.family && m.family.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      const aCost =
        (inputTokens / 1e6) * (a.model.cost?.input || 0) +
        (outputTokens / 1e6) * (a.model.cost?.output || 0);
      const bCost =
        (inputTokens / 1e6) * (b.model.cost?.input || 0) +
        (outputTokens / 1e6) * (b.model.cost?.output || 0);

      if (sortBy === "cost") return aCost - bCost;
      if (sortBy === "context") return (b.model.limit?.context || 0) - (a.model.limit?.context || 0);
      if (sortBy === "inputPrice") return (a.model.cost?.input || 0) - (b.model.cost?.input || 0);
      if (sortBy === "outputPrice") return (a.model.cost?.output || 0) - (b.model.cost?.output || 0);
      return 0;
    });
  }, [allModels, selectedProvider, searchQuery, sortBy, inputTokens, outputTokens]);

  const displayedList = useMemo(() => {
    return filteredAndSorted.slice(0, displayCount);
  }, [filteredAndSorted, displayCount]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">models.dev Providers</p>
        <p className="text-accent font-mono text-xs font-bold">{Object.keys(data).length} Providers</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Total Models Catalog</p>
        <p className="text-text-primary font-mono text-xs">{allModels.length.toLocaleString()} Models</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">models.dev API Pricing & Specs Matrix</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Real-time token simulator consuming native models.dev/api.json schema ({Object.keys(data).length} providers, {allModels.length.toLocaleString()} models).
            </p>
          </div>

          {/* Token Simulator Controls */}
          <div className="mb-6 p-4 rounded-xl bg-bg-page border border-border-subtle space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/70 pb-3">
              <span className="text-xs font-mono font-bold text-text-secondary uppercase">
                [1] Token Cost Simulator Parameters
              </span>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleSyncModelsDev}
                className="px-2.5 py-1 text-xs font-mono rounded border border-accent/40 bg-accent-soft text-accent hover:bg-accent-hover hover:text-bg-page transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <span>$ sync models.dev/api.json</span>
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
                  className="px-2 py-0.5 rounded border border-border-subtle bg-bg-card text-text-secondary hover:border-accent/40 hover:text-text-primary transition-colors"
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
                  <span className="text-xs font-mono text-accent font-bold">
                    {inputTokens.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  value={inputTokens}
                  onChange={(e) => setInputTokens(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-text-secondary">
                    Output Tokens (Generation / Reasoning):
                  </label>
                  <span className="text-xs font-mono text-accent font-bold">
                    {outputTokens.toLocaleString()}
                  </span>
                </div>
                <input
                  type="number"
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Filters & Sorting Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 font-mono text-xs">
              {topProviders.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(p);
                    setDisplayCount(60);
                  }}
                  className={`px-2 py-1 rounded transition-colors ${
                    selectedProvider === p
                      ? "bg-accent text-bg-page font-bold"
                      : "border border-border-subtle bg-bg-page/60 text-text-muted hover:text-text-primary"
                  }`}
                >
                  [{p}]
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-text-muted">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="p-1 rounded bg-bg-page border border-border-subtle text-text-primary text-xs font-mono focus:border-accent focus:outline-none"
              >
                <option value="cost">Estimated Run Cost (Low → High)</option>
                <option value="context">Context Window (Max → Min)</option>
                <option value="inputPrice">Input Price ($ / 1M)</option>
                <option value="outputPrice">Output Price ($ / 1M)</option>
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDisplayCount(60);
              }}
              placeholder="Search across models.dev schema (e.g. 'claude-3-7', 'deepseek', 'gpt-4o', 'gemini', 'qwen', 'llama')..."
              className="w-full p-2.5 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Models Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-page max-h-[600px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="sticky top-0 z-10 border-b border-border-subtle bg-bg-card text-text-secondary uppercase">
                <tr>
                  <th className="p-3">Model & Provider</th>
                  <th className="p-3 text-right">Est. Cost</th>
                  <th className="p-3 text-right">Context</th>
                  <th className="p-3 text-right">In / 1M</th>
                  <th className="p-3 text-right">Out / 1M</th>
                  <th className="p-3 text-center">Capabilities</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {displayedList.map((item) => {
                  const m = item.model;
                  const inCost = m.cost?.input || 0;
                  const outCost = m.cost?.output || 0;
                  const totalEst = (inputTokens / 1e6) * inCost + (outputTokens / 1e6) * outCost;

                  const contextLimit = m.limit?.context || 0;
                  const contextK =
                    contextLimit >= 1e6
                      ? `${(contextLimit / 1e6).toFixed(1)}M`
                      : contextLimit > 0
                      ? `${Math.round(contextLimit / 1024)}k`
                      : "-";

                  return (
                    <tr key={`${item.providerId}/${item.modelId}`} className="hover:bg-accent-soft/20 transition-colors">
                      <td className="p-3 font-semibold text-text-primary">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-muted text-[10px]">[{item.providerName}]</span>
                            <span className="text-accent">{m.name || item.modelId}</span>
                          </div>
                          <span className="text-[10px] text-text-muted font-normal truncate max-w-[280px]">
                            {item.providerId}/{item.modelId}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-accent">
                        {m.cost
                          ? totalEst < 0.0001 && totalEst > 0
                            ? "<$0.0001"
                            : `$${totalEst.toFixed(4)}`
                          : "Free / N/A"}
                      </td>
                      <td className="p-3 text-right text-text-secondary">{contextK}</td>
                      <td className="p-3 text-right text-text-muted">
                        {m.cost ? `$${inCost}` : "-"}
                      </td>
                      <td className="p-3 text-right text-text-muted">
                        {m.cost ? `$${outCost}` : "-"}
                      </td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        {m.reasoning && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-warning/10 text-warning border border-warning/30">
                            Reasoning
                          </span>
                        )}
                        {m.modalities?.input?.includes("image") && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-accent/10 text-accent border border-accent/30">
                            Vision
                          </span>
                        )}
                        {m.tool_call && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-success/10 text-success border border-success/30">
                            Tools
                          </span>
                        )}
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
                  onClick={() => setDisplayCount((prev) => prev + 100)}
                  className="px-4 py-1.5 rounded border border-border-subtle bg-bg-page hover:border-accent/50 text-accent font-semibold transition-colors cursor-pointer"
                >
                  $ load more (showing {displayedList.length} of {filteredAndSorted.length.toLocaleString()} models)
                </button>
              </div>
            )}

            {filteredAndSorted.length === 0 && (
              <div className="p-8 text-center font-mono text-xs text-text-muted">
                No models found matching query &quot;{searchQuery}&quot;.
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
