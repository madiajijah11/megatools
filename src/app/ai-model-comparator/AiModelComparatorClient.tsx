"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

export interface ModelSpec {
  id: string;
  name: string;
  provider: string;
  context: number;
  maxOutput: number;
  inputPricePerM: number;
  outputPricePerM: number;
  reasoning?: boolean;
  vision?: boolean;
  toolCall?: boolean;
}

const DEFAULT_MODELS: ModelSpec[] = [
  // DeepSeek 2025
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1 (Reasoning)",
    provider: "DeepSeek",
    context: 64000,
    maxOutput: 8192,
    inputPricePerM: 0.55,
    outputPricePerM: 2.19,
    reasoning: true,
    toolCall: true,
  },
  {
    id: "deepseek/deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    context: 64000,
    maxOutput: 8192,
    inputPricePerM: 0.14,
    outputPricePerM: 0.28,
    toolCall: true,
  },

  // Anthropic Claude 2025
  {
    id: "anthropic/claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet (Hybrid Reasoning)",
    provider: "Anthropic",
    context: 200000,
    maxOutput: 64000,
    inputPricePerM: 3.0,
    outputPricePerM: 15.0,
    reasoning: true,
    vision: true,
    toolCall: true,
  },
  {
    id: "anthropic/claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    context: 200000,
    maxOutput: 8192,
    inputPricePerM: 3.0,
    outputPricePerM: 15.0,
    vision: true,
    toolCall: true,
  },
  {
    id: "anthropic/claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    context: 200000,
    maxOutput: 8192,
    inputPricePerM: 0.8,
    outputPricePerM: 4.0,
    vision: true,
    toolCall: true,
  },

  // OpenAI 2025
  {
    id: "openai/o3-mini",
    name: "o3-mini (High Reasoning)",
    provider: "OpenAI",
    context: 200000,
    maxOutput: 100000,
    inputPricePerM: 1.1,
    outputPricePerM: 4.4,
    reasoning: true,
    toolCall: true,
  },
  {
    id: "openai/o1",
    name: "o1",
    provider: "OpenAI",
    context: 200000,
    maxOutput: 100000,
    inputPricePerM: 15.0,
    outputPricePerM: 60.0,
    reasoning: true,
    vision: true,
    toolCall: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (Omni)",
    provider: "OpenAI",
    context: 128000,
    maxOutput: 16384,
    inputPricePerM: 2.5,
    outputPricePerM: 10.0,
    vision: true,
    toolCall: true,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    context: 128000,
    maxOutput: 16384,
    inputPricePerM: 0.15,
    outputPricePerM: 0.6,
    vision: true,
    toolCall: true,
  },

  // Google Gemini 2025
  {
    id: "google/gemini-2-0-flash",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    context: 1048576,
    maxOutput: 8192,
    inputPricePerM: 0.1,
    outputPricePerM: 0.4,
    vision: true,
    toolCall: true,
  },
  {
    id: "google/gemini-2-0-flash-thinking",
    name: "Gemini 2.0 Flash Thinking",
    provider: "Google",
    context: 1048576,
    maxOutput: 65536,
    inputPricePerM: 0.1,
    outputPricePerM: 0.4,
    reasoning: true,
    vision: true,
    toolCall: true,
  },
  {
    id: "google/gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    context: 2097152,
    maxOutput: 8192,
    inputPricePerM: 1.25,
    outputPricePerM: 5.0,
    vision: true,
    toolCall: true,
  },

  // Meta Llama
  {
    id: "meta/llama-3-3-70b",
    name: "Llama 3.3 70B",
    provider: "Meta",
    context: 128000,
    maxOutput: 8192,
    inputPricePerM: 0.59,
    outputPricePerM: 0.79,
    toolCall: true,
  },
  {
    id: "meta/llama-3-1-405b",
    name: "Llama 3.1 405B",
    provider: "Meta",
    context: 128000,
    maxOutput: 8192,
    inputPricePerM: 2.5,
    outputPricePerM: 3.5,
    toolCall: true,
  },

  // Qwen / Alibaba
  {
    id: "qwen/qwen-2-5-coder-32b",
    name: "Qwen 2.5 Coder 32B",
    provider: "Qwen",
    context: 128000,
    maxOutput: 8192,
    inputPricePerM: 0.2,
    outputPricePerM: 0.2,
    toolCall: true,
  },
  {
    id: "qwen/qwq-32b-preview",
    name: "QwQ 32B (Reasoning)",
    provider: "Qwen",
    context: 32768,
    maxOutput: 8192,
    inputPricePerM: 0.25,
    outputPricePerM: 0.5,
    reasoning: true,
  },

  // Mistral AI
  {
    id: "mistral/codestral-2501",
    name: "Codestral 2501",
    provider: "Mistral",
    context: 256000,
    maxOutput: 8192,
    inputPricePerM: 0.3,
    outputPricePerM: 0.9,
    toolCall: true,
  },
  {
    id: "mistral/mistral-large-2411",
    name: "Mistral Large 2411",
    provider: "Mistral",
    context: 128000,
    maxOutput: 8192,
    inputPricePerM: 2.0,
    outputPricePerM: 6.0,
    toolCall: true,
  },

  // Moonshot / Kimi
  {
    id: "moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
    provider: "Moonshot",
    context: 256000,
    maxOutput: 8192,
    inputPricePerM: 0.6,
    outputPricePerM: 3.0,
    toolCall: true,
  },
];

const PRESETS = [
  { label: "Code Assistant Prompt", input: 5000, output: 1200 },
  { label: "Large PDF / Doc Analysis", input: 85000, output: 3500 },
  { label: "Customer Support Chat", input: 800, output: 250 },
  { label: "1 Million Tokens Batch", input: 800000, output: 200000 },
];

export default function AiModelComparatorClient() {
  const [models, setModels] = useState<ModelSpec[]>(DEFAULT_MODELS);
  const [inputTokens, setInputTokens] = useState<number>(10000);
  const [outputTokens, setOutputTokens] = useState<number>(2000);
  const [selectedProvider, setSelectedProvider] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"cost" | "context" | "inputPrice" | "outputPrice">("cost");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync with models.dev open API
  const handleSyncModelsDev = useCallback(async (isManual = false) => {
    setIsSyncing(true);
    setSyncStatus("FETCHING...");
    try {
      const res = await fetch("https://models.dev/api.json");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      const syncedList: ModelSpec[] = [];
      const seenIds = new Set<string>();

      // Traverse provider objects and their nested .models
      for (const [providerKey, providerObj] of Object.entries(data as Record<string, {
        name?: string;
        models?: Record<string, {
          name?: string;
          family?: string;
          limit?: { context?: number; output?: number };
          cost?: { input?: number; output?: number };
          reasoning?: boolean;
          tool_call?: boolean;
          modalities?: { input?: string[] };
        }>;
      }>)) {
        if (providerObj && providerObj.models && typeof providerObj.models === "object") {
          for (const [modelKey, model] of Object.entries(providerObj.models)) {
            if (model && model.cost && typeof model.cost.input === "number" && model.limit?.context) {
              const uniqueKey = `${providerKey}/${modelKey}`;
              if (seenIds.has(uniqueKey)) continue;
              seenIds.add(uniqueKey);

              // Normalize provider name
              let prov = providerObj.name || providerKey;
              const lowerKey = (modelKey + " " + providerKey + " " + (model.family || "")).toLowerCase();
              if (lowerKey.includes("deepseek")) prov = "DeepSeek";
              else if (lowerKey.includes("claude") || lowerKey.includes("anthropic")) prov = "Anthropic";
              else if (lowerKey.includes("gpt") || lowerKey.includes("openai") || lowerKey.includes("o1") || lowerKey.includes("o3") || lowerKey.includes("o4")) prov = "OpenAI";
              else if (lowerKey.includes("gemini") || lowerKey.includes("google")) prov = "Google";
              else if (lowerKey.includes("llama") || lowerKey.includes("meta")) prov = "Meta";
              else if (lowerKey.includes("qwen") || lowerKey.includes("qwq")) prov = "Qwen";
              else if (lowerKey.includes("mistral") || lowerKey.includes("codestral") || lowerKey.includes("pixtral")) prov = "Mistral";
              else if (lowerKey.includes("grok") || lowerKey.includes("xai")) prov = "xAI";
              else if (lowerKey.includes("kimi") || lowerKey.includes("moonshot")) prov = "Moonshot";

              syncedList.push({
                id: uniqueKey,
                name: model.name || modelKey,
                provider: prov,
                context: model.limit.context,
                maxOutput: model.limit.output || 4096,
                inputPricePerM: model.cost.input || 0,
                outputPricePerM: model.cost.output || 0,
                reasoning: !!model.reasoning,
                toolCall: !!model.tool_call,
                vision: model.modalities?.input?.includes("image") || false,
              });
            }
          }
        }
      }

      if (syncedList.length > 10) {
        setModels(syncedList);
        localStorage.setItem("megatools_synced_models", JSON.stringify(syncedList));
        setSyncStatus(`SYNCED (${syncedList.length} MODELS)`);
        setTimeout(() => setSyncStatus(null), 4000);
      }
    } catch {
      if (isManual) {
        setSyncStatus("OFFLINE (USING LOCAL SNAPSHOT)");
        setTimeout(() => setSyncStatus(null), 3000);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("megatools_synced_models");
      if (cached) {
        setModels(JSON.parse(cached));
      } else {
        // Auto sync once on first mount
        handleSyncModelsDev(false);
      }
    } catch {
      // Ignore storage errors
    }
  }, [handleSyncModelsDev]);

  const filteredAndSorted = useMemo(() => {
    const list = models.filter((m) => {
      if (selectedProvider !== "ALL" && m.provider.toLowerCase() !== selectedProvider.toLowerCase()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.provider.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return list.sort((a, b) => {
      const aTotalCost = (inputTokens / 1e6) * a.inputPricePerM + (outputTokens / 1e6) * a.outputPricePerM;
      const bTotalCost = (inputTokens / 1e6) * b.inputPricePerM + (outputTokens / 1e6) * b.outputPricePerM;

      if (sortBy === "cost") return aTotalCost - bTotalCost;
      if (sortBy === "context") return b.context - a.context;
      if (sortBy === "inputPrice") return a.inputPricePerM - b.inputPricePerM;
      if (sortBy === "outputPrice") return a.outputPricePerM - b.outputPricePerM;
      return 0;
    });
  }, [models, selectedProvider, searchQuery, sortBy, inputTokens, outputTokens]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Active Models</p>
        <p className="text-accent font-mono text-xs font-bold">{models.length} Models</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Live Data Source</p>
        <p className="text-text-primary font-mono text-xs">models.dev Open API</p>
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
              <span className="gradient-text">AI Model Pricing & Context Matrix</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Real-time token cost simulator & specs matrix for 1,000+ LLM models with models.dev live sync.
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
                onClick={() => handleSyncModelsDev(true)}
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
              {["ALL", "DeepSeek", "Anthropic", "OpenAI", "Google", "Meta", "Qwen", "Mistral", "Moonshot"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedProvider(p)}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model name (e.g. 'claude-3-7', 'r1', 'gpt-4o', 'gemini')..."
              className="w-full p-2.5 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Models Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-page max-h-[560px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="sticky top-0 z-10 border-b border-border-subtle bg-bg-card text-text-secondary uppercase">
                <tr>
                  <th className="p-3">Model</th>
                  <th className="p-3 text-right">Est. Cost</th>
                  <th className="p-3 text-right">Context</th>
                  <th className="p-3 text-right">In / 1M</th>
                  <th className="p-3 text-right">Out / 1M</th>
                  <th className="p-3 text-center">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/60">
                {filteredAndSorted.map((m) => {
                  const cost =
                    (inputTokens / 1e6) * m.inputPricePerM + (outputTokens / 1e6) * m.outputPricePerM;
                  const contextK =
                    m.context >= 1e6
                      ? `${(m.context / 1e6).toFixed(1)}M`
                      : `${Math.round(m.context / 1024)}k`;

                  return (
                    <tr key={m.id} className="hover:bg-accent-soft/20 transition-colors">
                      <td className="p-3 font-semibold text-text-primary">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-text-muted text-[10px]">[{m.provider}]</span>
                            <span>{m.name}</span>
                          </div>
                          <span className="text-[10px] text-text-muted font-normal truncate max-w-[260px]">
                            {m.id}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-accent">
                        ${cost < 0.0001 && cost > 0 ? "<$0.0001" : cost.toFixed(4)}
                      </td>
                      <td className="p-3 text-right text-text-secondary">{contextK}</td>
                      <td className="p-3 text-right text-text-muted">${m.inputPricePerM}</td>
                      <td className="p-3 text-right text-text-muted">${m.outputPricePerM}</td>
                      <td className="p-3 text-center space-x-1 whitespace-nowrap">
                        {m.reasoning && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-warning/10 text-warning border border-warning/30">
                            Reasoning
                          </span>
                        )}
                        {m.vision && (
                          <span className="px-1 py-0.5 rounded text-[9px] bg-accent/10 text-accent border border-accent/30">
                            Vision
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
