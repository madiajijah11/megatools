"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface FewShotExample {
  id: string;
  input: string;
  output: string;
}

interface PromptConfig {
  role: string;
  context: string;
  constraints: string[];
  outputFormat: string;
  fallbackBehavior: string;
  examples: FewShotExample[];
}

const ARCHETYPES: Record<string, PromptConfig> = {
  codeReviewer: {
    role: "Senior Security & Performance Code Reviewer specialized in TypeScript, Rust, and Go.",
    context: "You are conducting peer reviews on pull requests for high-throughput distributed microservices.",
    constraints: [
      "Analyze time and space complexity (Big-O) for every flagged function.",
      "Check for memory leaks, unhandled promise rejections, and SQL/Command injection vectors.",
      "Never propose vague suggestions; always provide a concise, corrected code diff snippet.",
      "If the code is already optimal and safe, explicitly state 'VERIFIED_CLEAN' without unnecessary fluff."
    ],
    outputFormat: "Markdown with concise severity badges ([CRITICAL], [WARNING], [OPTIMIZATION]) and code snippets.",
    fallbackBehavior: "If code snippet is incomplete or missing context, list precise assumptions made before review.",
    examples: [
      {
        id: "ex-1",
        input: "const query = 'SELECT * FROM users WHERE id = ' + req.body.id;",
        output: "[CRITICAL] SQL Injection Vulnerability\nRemediation:\n```ts\nconst query = 'SELECT * FROM users WHERE id = $1';\nawait db.query(query, [req.body.id]);\n```"
      }
    ]
  },
  ragAgent: {
    role: "Truthful Retrieval-Augmented Generation (RAG) Grounding Specialist.",
    context: "You answer user questions strictly based on the retrieved context snippets provided in the prompt.",
    constraints: [
      "Rely ONLY on facts stated in the provided context documents.",
      "Never extrapolate, speculate, or introduce external training facts not cited in context.",
      "Every claim must cite its source chunk (e.g. [Doc 1, Page 3]).",
      "If the provided context does not contain the answer, state: 'I am unable to answer based on the provided documents.'"
    ],
    outputFormat: "Clear conversational response with inline bracket citations [Source X].",
    fallbackBehavior: "Do not guess. Explicitly refuse to answer out-of-context queries.",
    examples: [
      {
        id: "ex-1",
        input: "Context: [Doc 1]: MegaTools was established in 2024.\nQuestion: What year was MegaTools founded?",
        output: "MegaTools was founded in 2024 [Doc 1]."
      }
    ]
  },
  jsonExtractor: {
    role: "Deterministic JSON Entity Extraction Engine.",
    context: "You parse messy unstructured text into strict, schema-compliant JSON payloads.",
    constraints: [
      "Output valid JSON ONLY. Never include markdown fences (```json), explanations, or conversational filler.",
      "Ensure all dates are formatted as ISO-8601 strings (YYYY-MM-DDTHH:mm:ssZ).",
      "Map missing or unknown fields to null, never undefined or omitted."
    ],
    outputFormat: "Raw minified or formatted RFC 8259 JSON object.",
    fallbackBehavior: "If required fields are missing, populate with null and include an '_errors' array.",
    examples: [
      {
        id: "ex-1",
        input: "Invoice from Acme Corp for $450 on Oct 12, 2025.",
        output: '{\n  "vendor": "Acme Corp",\n  "amount": 450.00,\n  "currency": "USD",\n  "date": "2025-10-12T00:00:00Z"\n}'
      }
    ]
  }
};
export default function PromptArchitectClient() {
  const [config, setConfig] = useState<PromptConfig>(ARCHETYPES.codeReviewer);
  const [formatMode, setFormatMode] = useState<"xml" | "markdown" | "json_payload">("xml");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [newConstraint, setNewConstraint] = useState<string>("");

  const addConstraint = () => {
    if (!newConstraint.trim()) return;
    setConfig((prev) => ({
      ...prev,
      constraints: [...prev.constraints, newConstraint.trim()]
    }));
    setNewConstraint("");
  };

  const removeConstraint = (idx: number) => {
    setConfig((prev) => ({
      ...prev,
      constraints: prev.constraints.filter((_, i) => i !== idx)
    }));
  };

  // Synthesize System Prompt according to format mode
  const generatedPrompt = useMemo<string>(() => {
    if (formatMode === "xml") {
      const parts: string[] = [];
      parts.push("<instructions>");
      parts.push("  <role>\n    " + config.role + "\n  </role>");
      if (config.context.trim()) {
        parts.push("  <context>\n    " + config.context + "\n  </context>");
      }
      if (config.constraints.length > 0) {
        parts.push("  <constraints>");
        config.constraints.forEach((c) => parts.push("    - " + c));
        parts.push("  </constraints>");
      }
      if (config.outputFormat.trim()) {
        parts.push("  <output_format>\n    " + config.outputFormat + "\n  </output_format>");
      }
      if (config.fallbackBehavior.trim()) {
        parts.push("  <fallback_rules>\n    " + config.fallbackBehavior + "\n  </fallback_rules>");
      }
      if (config.examples.length > 0) {
        parts.push("  <examples>");
        config.examples.forEach((ex, idx) => {
          parts.push("    <example index=\"" + (idx + 1) + "\">");
          parts.push("      <user_input>\n        " + ex.input.replace(/\n/g, "\n        ") + "\n      </user_input>");
          parts.push("      <ideal_response>\n        " + ex.output.replace(/\n/g, "\n        ") + "\n      </ideal_response>");
          parts.push("    </example>");
        });
        parts.push("  </examples>");
      }
      parts.push("</instructions>");
      return parts.join("\n");
    }

    if (formatMode === "markdown") {
      const parts: string[] = [];
      parts.push("# SYSTEM INSTRUCTIONS");
      parts.push("## Role & Persona\n" + config.role);
      if (config.context.trim()) {
        parts.push("## Context\n" + config.context);
      }
      if (config.constraints.length > 0) {
        parts.push("## Guardrails & Constraints\n" + config.constraints.map((c) => "- " + c).join("\n"));
      }
      if (config.outputFormat.trim()) {
        parts.push("## Output Format Requirements\n" + config.outputFormat);
      }
      if (config.fallbackBehavior.trim()) {
        parts.push("## Edge Case & Fallback Protocols\n" + config.fallbackBehavior);
      }
      if (config.examples.length > 0) {
        parts.push("## Few-Shot Demonstration Examples");
        config.examples.forEach((ex, idx) => {
          parts.push("### Example " + (idx + 1) + "\n**Input:**\n```\n" + ex.input + "\n```\n**Response:**\n```\n" + ex.output + "\n```");
        });
      }
      return parts.join("\n\n");
    }

    // JSON Payload Mode (OpenAI / Claude standard schema)
    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "<role>" + config.role + "</role>\n<constraints>" + config.constraints.join("; ") + "</constraints>"
        }
      ],
      temperature: 0.1,
      max_tokens: 2048
    };
    return JSON.stringify(payload, null, 2);
  }, [config, formatMode]);

  const estimatedTokens = useMemo(() => {
    return Math.max(1, Math.round(generatedPrompt.length / 4));
  }, [generatedPrompt]);

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Prompt Length:</span>
        <span className="text-accent font-bold">{generatedPrompt.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Est. Token Cost:</span>
        <span className="text-text-primary font-bold">~{estimatedTokens} tokens</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Active Guardrails:</span>
        <span className="text-success font-bold">{config.constraints.length} rules</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Format:</span>
        <span className="text-accent font-bold uppercase">{formatMode}</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent transition-colors"
        >
          <span>←</span> [cd .. / home]
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
        >
          [?] Tool Info
        </button>
      </div>

      {/* Hero Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-subtle bg-bg-card font-mono text-xs text-text-secondary mb-3">
          <span className="text-accent">$</span>
          <span>megatools --prompt-architect --anti-hallucination</span>
          <span className="animate-pulse text-accent">▊</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          Structured System <span className="gradient-text">Prompt Architect</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Design hardened, anti-hallucination XML and Markdown system prompts with role isolation, guardrails, and few-shot examples.
        </p>

        {/* Archetype Selector */}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-text-muted">ARCHETYPES:</span>
          <button
            onClick={() => setConfig(ARCHETYPES.codeReviewer)}
            className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
          >
            [Code Reviewer]
          </button>
          <button
            onClick={() => setConfig(ARCHETYPES.ragAgent)}
            className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
          >
            [Strict RAG Agent]
          </button>
          <button
            onClick={() => setConfig(ARCHETYPES.jsonExtractor)}
            className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
          >
            [JSON Entity Extractor]
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Form Editor & Live Prompt Output */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Builder Column */}
            <div className="rounded-lg border border-border-subtle bg-bg-card p-4 flex flex-col font-mono space-y-3">
              <div className="h-8 flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <span className="text-accent">&gt;</span> PROMPT_SPECIFICATION
                </span>
                <span className="text-[11px] text-text-muted">Form Inputs</span>
              </div>

              {/* Role & Persona */}
              <div>
                <label className="text-[11px] text-text-muted block mb-1">Role & Persona:</label>
                <textarea
                  value={config.role}
                  onChange={(e) => setConfig({ ...config, role: e.target.value })}
                  rows={2}
                  className="w-full bg-bg-page border border-border-subtle rounded p-2 text-xs text-text-primary focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Context */}
              <div>
                <label className="text-[11px] text-text-muted block mb-1">Operational Context:</label>
                <textarea
                  value={config.context}
                  onChange={(e) => setConfig({ ...config, context: e.target.value })}
                  rows={2}
                  className="w-full bg-bg-page border border-border-subtle rounded p-2 text-xs text-text-primary focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Constraints & Guardrails */}
              <div>
                <label className="text-[11px] text-text-muted block mb-1">
                  Constraints & Guardrails ({config.constraints.length}):
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {config.constraints.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-1.5 rounded bg-bg-page border border-border-subtle text-[11px]"
                    >
                      <span className="text-text-primary truncate">{c}</span>
                      <button
                        onClick={() => removeConstraint(i)}
                        className="text-text-muted hover:text-error transition-colors px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 mt-2">
                  <input
                    type="text"
                    value={newConstraint}
                    onChange={(e) => setNewConstraint(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConstraint())}
                    placeholder="Add rule (e.g. Never assume missing variables)..."
                    className="flex-1 bg-bg-page border border-border-subtle rounded px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={addConstraint}
                    className="text-xs px-2.5 py-1 rounded bg-accent-soft text-accent border border-accent/40 font-bold hover:bg-accent hover:text-bg-page transition-colors cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Output Format */}
              <div>
                <label className="text-[11px] text-text-muted block mb-1">Output Schema / Format:</label>
                <input
                  type="text"
                  value={config.outputFormat}
                  onChange={(e) => setConfig({ ...config, outputFormat: e.target.value })}
                  className="w-full bg-bg-page border border-border-subtle rounded px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>

              {/* Fallback Behavior */}
              <div>
                <label className="text-[11px] text-text-muted block mb-1">Fallback / Edge Case Handling:</label>
                <input
                  type="text"
                  value={config.fallbackBehavior}
                  onChange={(e) => setConfig({ ...config, fallbackBehavior: e.target.value })}
                  className="w-full bg-bg-page border border-border-subtle rounded px-2 py-1 text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Output Column */}
            <div className="rounded-lg border border-border-subtle bg-bg-card p-4 flex flex-col font-mono">
              <div className="h-8 flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 bg-bg-page border border-border-subtle rounded p-0.5 text-xs">
                  <button
                    onClick={() => setFormatMode("xml")}
                    className={"px-2 py-0.5 rounded transition-colors " + (
                      formatMode === "xml"
                        ? "bg-accent-soft text-accent font-bold border border-accent/40"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    XML
                  </button>
                  <button
                    onClick={() => setFormatMode("markdown")}
                    className={"px-2 py-0.5 rounded transition-colors " + (
                      formatMode === "markdown"
                        ? "bg-accent-soft text-accent font-bold border border-accent/40"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => setFormatMode("json_payload")}
                    className={"px-2 py-0.5 rounded transition-colors " + (
                      formatMode === "json_payload"
                        ? "bg-accent-soft text-accent font-bold border border-accent/40"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    JSON Payload
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <CopyButton text={generatedPrompt} label="copy prompt" />
                </div>
              </div>

              <div className="h-[460px] overflow-y-auto bg-bg-page border border-border-subtle rounded p-3 text-xs">
                <pre className="text-text-primary whitespace-pre-wrap break-all leading-relaxed font-mono">
                  {generatedPrompt}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Info Panel Desktop */}
        <div className="hidden lg:block">
          <InfoPanel toolId="prompt-architect" stats={stats} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="prompt-architect" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
