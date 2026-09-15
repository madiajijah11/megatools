"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  inputPerMillion: number;
  outputPerMillion: number;
  contextWindow: number;
  charsPerToken: number;
  badge: string;
}

const MODEL_PRICING: ModelPricing[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o (Omni)",
    provider: "OpenAI",
    inputPerMillion: 2.50,
    outputPerMillion: 10.00,
    contextWindow: 128000,
    charsPerToken: 3.9,
    badge: "Flagship"
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "OpenAI",
    inputPerMillion: 0.15,
    outputPerMillion: 0.60,
    contextWindow: 128000,
    charsPerToken: 3.9,
    badge: "Budget"
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputPerMillion: 3.00,
    outputPerMillion: 15.00,
    contextWindow: 200000,
    charsPerToken: 3.7,
    badge: "Coding SOTA"
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "Anthropic",
    inputPerMillion: 0.80,
    outputPerMillion: 4.00,
    contextWindow: 200000,
    charsPerToken: 3.7,
    badge: "Ultra Fast"
  },
  {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    provider: "Google",
    inputPerMillion: 1.25,
    outputPerMillion: 5.00,
    contextWindow: 2000000,
    charsPerToken: 4.0,
    badge: "2M Context"
  },
  {
    id: "gemini-1-5-flash",
    name: "Gemini 1.5 Flash",
    provider: "Google",
    inputPerMillion: 0.075,
    outputPerMillion: 0.30,
    contextWindow: 1000000,
    charsPerToken: 4.0,
    badge: "High Speed"
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    inputPerMillion: 0.14,
    outputPerMillion: 0.28,
    contextWindow: 64000,
    charsPerToken: 3.75,
    badge: "Ultra Value"
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    inputPerMillion: 0.55,
    outputPerMillion: 2.19,
    contextWindow: 64000,
    charsPerToken: 3.75,
    badge: "Reasoning"
  },
  {
    id: "llama-3-1-70b",
    name: "Llama 3.1 70B",
    provider: "Meta / Open",
    inputPerMillion: 0.59,
    outputPerMillion: 0.79,
    contextWindow: 131072,
    charsPerToken: 3.65,
    badge: "Open Weights"
  }
];

const PRESETS = {
  systemPrompt: "You are an expert full-stack TypeScript and Next.js architect.\nYour goal is to inspect codebases, spot subtle anti-patterns, optimize React Server Components boundaries, and recommend elegant solutions.\n\nGuidelines:\n1. Always adhere to strict TypeScript typing with zero 'any' casts unless rigorously justified.\n2. Emphasize zero-runtime overhead, edge-readiness, and web standard APIs (Fetch, Streams, Web Crypto).\n3. Provide concise, production-ready code examples with minimal cognitive boilerplate.",
  jsonPayload: '{\n  "project": "MegaTools Suite",\n  "version": "2.4.0",\n  "security": {\n    "zeroServerLeakage": true,\n    "webCryptoSupported": true\n  }\n}',
  codeSnippet: 'async function fetchStreamWithBackoff(url: string, maxRetries = 3): Promise<ReadableStream<Uint8Array>> {\n  let attempt = 0;\n  while (attempt < maxRetries) {\n    try {\n      const response = await fetch(url);\n      if (!response.ok) throw new Error("HTTP error " + response.status);\n      if (!response.body) throw new Error("No response body received.");\n      return response.body;\n    } catch (err) {\n      attempt++;\n      if (attempt >= maxRetries) throw err;\n      await new Promise((res) => setTimeout(res, 500 * Math.pow(2, attempt)));\n    }\n  }\n  throw new Error("Exceeded retries");\n}',
  essay: "Artificial intelligence represents a fundamental evolution in human computing paradigms. By transitioning from imperative, deterministic instructions toward probabilistic, context-grounded neural inference, software engineering is undergoing an unprecedented renaissance. Large Language Models operate fundamentally upon subword tokenization structures."
};

const TOKEN_COLORS = [
  "bg-accent/15 text-accent border-accent/30",
  "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "bg-purple-500/15 text-purple-300 border-purple-500/30",
  "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "bg-rose-500/15 text-rose-300 border-rose-500/30",
];

export default function TokenCounterClient() {
  const [input, setInput] = useState<string>(PRESETS.systemPrompt);
  const [selectedModelId, setSelectedModelId] = useState<string>("gpt-4o");
  const [projectedOutputTokens, setProjectedOutputTokens] = useState<number>(500);
  const [activeTab, setActiveTab] = useState<"pricing" | "tokens">("pricing");

  const selectedModel = useMemo(() => {
    return MODEL_PRICING.find((m) => m.id === selectedModelId) || MODEL_PRICING[0];
  }, [selectedModelId]);

  const tokenList = useMemo(() => {
    if (!input) return [];
    const regex = /\s+|[a-zA-Z0-9_]+|[^\s\w]/g;
    const matches = input.match(regex) || [];
    const tokens: string[] = [];

    matches.forEach((m) => {
      if (m.length > 5 && /^[a-zA-Z0-9]+$/.test(m)) {
        for (let i = 0; i < m.length; i += 4) {
          tokens.push(m.slice(i, i + 4));
        }
      } else {
        tokens.push(m);
      }
    });

    return tokens;
  }, [input]);

  const charCount = input.length;
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const tokenCount = tokenList.length;
  const charsPerToken = tokenCount > 0 ? (charCount / tokenCount).toFixed(2) : "0.00";

  const costEstimates = useMemo(() => {
    return MODEL_PRICING.map((model) => {
      const modelTokens = Math.max(1, Math.round(charCount / model.charsPerToken)) || tokenCount;
      const inputCost = (modelTokens / 1_000_000) * model.inputPerMillion;
      const outputCost = (projectedOutputTokens / 1_000_000) * model.outputPerMillion;
      const totalCost = inputCost + outputCost;

      return {
        ...model,
        modelTokens,
        inputCost,
        outputCost,
        totalCost,
      };
    });
  }, [charCount, tokenCount, projectedOutputTokens]);

  const activeCost = useMemo(() => {
    return costEstimates.find((c) => c.id === selectedModelId) || costEstimates[0];
  }, [costEstimates, selectedModelId]);

  const stats = (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-text-muted text-xs">Est. Tokens</p>
        <p className="text-accent font-mono font-bold text-lg">{tokenCount.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Characters / Words</p>
        <p className="text-text-primary font-mono">{charCount.toLocaleString()} / {wordCount}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Density</p>
        <p className="text-text-primary font-mono">~{charsPerToken} chars/tok</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Estimated Cost</p>
        <p className="text-success font-mono font-bold">
          ${activeCost.totalCost < 0.00001 && activeCost.totalCost > 0 ? "<$0.00001" : activeCost.totalCost.toFixed(5)}
        </p>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="token-counter" stats={stats}>
      <div className="card p-6 space-y-6">
        {/* Presets Bar */}
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2 font-mono">
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setInput(PRESETS.systemPrompt)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              System Prompt
            </button>
            <button
              type="button"
              onClick={() => setInput(PRESETS.jsonPayload)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              JSON Schema
            </button>
            <button
              type="button"
              onClick={() => setInput(PRESETS.codeSnippet)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              TypeScript
            </button>
            <button
              type="button"
              onClick={() => setInput(PRESETS.essay)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Essay
            </button>
          </div>
        </div>

        {/* Input Textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary font-mono">
              Prompt / Text Input
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInput("")}
                className="text-xs text-text-muted hover:text-error transition-colors font-mono"
              >
                Clear
              </button>
              <CopyButton text={input} label="Copy" />
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste prompt, code, JSON, or text here..."
            rows={8}
            className="w-full rounded-xl border border-border-subtle bg-bg-page p-4 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Model & Output Simulation Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-subtle font-mono">
          <div>
            <label className="text-xs text-text-secondary font-medium block mb-1.5">
              Target AI Model
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full rounded-xl border border-border-subtle bg-bg-page p-2.5 font-mono text-sm text-text-primary focus:border-accent focus:outline-none"
            >
              {MODEL_PRICING.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.provider})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-text-secondary font-medium">
                Simulated Output Generation
              </label>
              <span className="text-xs font-mono text-accent font-bold">
                {projectedOutputTokens} tokens
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4096"
              step="50"
              value={projectedOutputTokens}
              onChange={(e) => setProjectedOutputTokens(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer h-2 bg-border-subtle rounded-lg mt-2"
            />
          </div>
        </div>

        {/* Tab Switcher & Result View */}
        <div className="space-y-4 pt-2 border-t border-border-subtle font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("pricing")}
                className={
                  activeTab === "pricing"
                    ? "btn-primary text-xs px-3 py-1.5"
                    : "btn-secondary text-xs px-3 py-1.5"
                }
              >
                Cost Breakdown
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("tokens")}
                className={
                  activeTab === "tokens"
                    ? "btn-primary text-xs px-3 py-1.5"
                    : "btn-secondary text-xs px-3 py-1.5"
                }
              >
                Token Subwords ({tokenCount})
              </button>
            </div>
            <CopyButton
              text={
                activeTab === "pricing"
                  ? JSON.stringify(costEstimates, null, 2)
                  : tokenList.join(" | ")
              }
              label="Copy Matrix"
            />
          </div>

          {activeTab === "pricing" ? (
            <div className="space-y-2">
              {costEstimates.map((m) => {
                const isSelected = m.id === selectedModelId;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModelId(m.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent/10 border-accent text-text-primary"
                        : "bg-bg-page border-border-subtle hover:border-text-muted text-text-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary text-sm">{m.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-bg-card border border-border-subtle text-text-muted font-mono">
                          {m.badge}
                        </span>
                      </div>
                      <span className="font-bold font-mono text-accent text-sm">
                        ${m.totalCost < 0.00001 && m.totalCost > 0 ? "<$0.00001" : m.totalCost.toFixed(5)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-text-muted font-mono">
                      <span>In: ${m.inputPerMillion}/M · Out: ${m.outputPerMillion}/M</span>
                      <span>Prompt: ${m.inputCost.toFixed(5)} · Gen: ${m.outputCost.toFixed(5)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-border-subtle bg-bg-page min-h-[160px]">
              {tokenList.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">
                  Enter some text above to preview subword token boundaries.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1 leading-loose font-mono text-xs">
                  {tokenList.map((token, idx) => {
                    const colorClass = TOKEN_COLORS[idx % TOKEN_COLORS.length];
                    const isWhitespace = /^\s+$/.test(token);
                    return (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded border ${colorClass}`}
                        title={`Token #${idx + 1}: "${token}"`}
                      >
                        {isWhitespace ? (token === " " ? "·" : "\n") : token}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
