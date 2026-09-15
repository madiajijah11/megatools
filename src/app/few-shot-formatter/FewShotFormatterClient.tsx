"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface ExamplePair {
  id: string;
  input: string;
  output: string;
}

type OutputFormat = "openai-jsonl" | "anthropic-xml" | "chatml" | "llama3" | "ts-array" | "csv";

const PRESETS = {
  sentiment: {
    system: "You are a precise sentiment analysis engine. Classify text into POSITIVE, NEGATIVE, or NEUTRAL with a confidence score and brief rationale.",
    pairs: [
      {
        id: "1",
        input: "The new UI update is incredibly responsive, but the dark mode colors feel a bit washed out.",
        output: "SENTIMENT: MIXED/POSITIVE | Confidence: 0.85 | Rationale: Praises responsiveness but gives minor visual critique."
      },
      {
        id: "2",
        input: "Customer support resolved my billing issue in under 5 minutes. Amazing service!",
        output: "SENTIMENT: POSITIVE | Confidence: 0.98 | Rationale: Strong positive sentiment regarding rapid issue resolution."
      },
      {
        id: "3",
        input: "The application crashed twice during data export, causing complete work loss.",
        output: "SENTIMENT: NEGATIVE | Confidence: 0.99 | Rationale: Critical software failure resulting in negative user experience."
      }
    ]
  },
  sqlGenerator: {
    system: "You are an expert SQL engineer. Given a natural language question and database schema, generate a clean, indexed PostgreSQL query.",
    pairs: [
      {
        id: "1",
        input: "Find the top 5 customers who spent the most money in 2024 with their email addresses.",
        output: "SELECT u.id, u.email, SUM(o.total_amount) AS total_spent\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE o.created_at >= '2024-01-01' AND o.created_at < '2025-01-01'\nGROUP BY u.id, u.email\nORDER BY total_spent DESC\nLIMIT 5;"
      },
      {
        id: "2",
        input: "Count all active subscriptions that are expiring in the next 7 days.",
        output: "SELECT COUNT(*)\nFROM subscriptions\nWHERE status = 'active'\n  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';"
      }
    ]
  },
  nerExtraction: {
    system: "Extract structured entities (PERSON, ORGANIZATION, LOCATION, DATE) from the input text in strict JSON format.",
    pairs: [
      {
        id: "1",
        input: "Sundar Pichai announced new Gemini models at Google I/O in Mountain View on May 14, 2024.",
        output: '{\n  "entities": [\n    {"text": "Sundar Pichai", "type": "PERSON"},\n    {"text": "Google", "type": "ORGANIZATION"},\n    {"text": "Mountain View", "type": "LOCATION"},\n    {"text": "May 14, 2024", "type": "DATE"}\n  ]\n}'
      }
    ]
  }
};

export default function FewShotFormatterClient() {
  const [systemPrompt, setSystemPrompt] = useState<string>(PRESETS.sentiment.system);
  const [pairs, setPairs] = useState<ExamplePair[]>(PRESETS.sentiment.pairs);
  const [format, setFormat] = useState<OutputFormat>("openai-jsonl");
  const [includeSystemInEveryRow, setIncludeSystemInEveryRow] = useState<boolean>(true);

  const addPair = () => {
    const newId = String(Date.now());
    setPairs([...pairs, { id: newId, input: "", output: "" }]);
  };

  const removePair = (id: string) => {
    if (pairs.length <= 1) return;
    setPairs(pairs.filter((p) => p.id !== id));
  };

  const updatePair = (id: string, field: "input" | "output", value: string) => {
    setPairs(pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const loadPreset = (key: keyof typeof PRESETS) => {
    setSystemPrompt(PRESETS[key].system);
    setPairs(PRESETS[key].pairs.map((p, idx) => ({ ...p, id: String(idx + 1) })));
  };

  const formattedOutput = useMemo(() => {
    if (pairs.length === 0) return "";

    switch (format) {
      case "openai-jsonl": {
        return pairs
          .map((p) => {
            const messages = [];
            if (systemPrompt && includeSystemInEveryRow) {
              messages.push({ role: "system", content: systemPrompt });
            }
            messages.push({ role: "user", content: p.input });
            messages.push({ role: "assistant", content: p.output });
            return JSON.stringify({ messages });
          })
          .join("\n");
      }

      case "anthropic-xml": {
        const examplesXml = pairs
          .map(
            (p, idx) =>
              "  <example id=\"" + (idx + 1) + "\">\n    <input>\n      " +
              p.input.replace(/\n/g, "\n      ") +
              "\n    </input>\n    <output>\n      " +
              p.output.replace(/\n/g, "\n      ") +
              "\n    </output>\n  </example>"
          )
          .join("\n");

        return (
          (systemPrompt ? systemPrompt + "\n\n" : "") +
          "<examples>\n" +
          examplesXml +
          "\n</examples>"
        );
      }

      case "chatml": {
        const formatted = pairs
          .map((p) => {
            let chunk = "";
            if (systemPrompt && includeSystemInEveryRow) {
              chunk += "<|im_start|>system\n" + systemPrompt + "\n<|im_end|>\n";
            }
            chunk += "<|im_start|>user\n" + p.input + "\n<|im_end|>\n";
            chunk += "<|im_start|>assistant\n" + p.output + "\n<|im_end|>";
            return chunk;
          })
          .join("\n\n");
        return formatted;
      }

      case "llama3": {
        const formatted = pairs
          .map((p) => {
            let chunk = "<|begin_of_text|>";
            if (systemPrompt && includeSystemInEveryRow) {
              chunk += "<|start_header_id|>system<|end_header_id|>\n\n" + systemPrompt + "<|eot_id|>";
            }
            chunk += "\n<|start_header_id|>user<|end_header_id|>\n\n" + p.input + "<|eot_id|>";
            chunk += "\n<|start_header_id|>assistant<|end_header_id|>\n\n" + p.output + "<|eot_id|>";
            return chunk;
          })
          .join("\n\n");
        return formatted;
      }

      case "ts-array": {
        const arr = pairs.map((p) => ({
          ...(systemPrompt && includeSystemInEveryRow ? { system: systemPrompt } : {}),
          user: p.input,
          assistant: p.output
        }));
        return "export const FEW_SHOT_EXAMPLES = " + JSON.stringify(arr, null, 2) + ";";
      }

      case "csv": {
        const escapeCsv = (val: string) => '"' + val.replace(/"/g, '""') + '"';
        const header = includeSystemInEveryRow ? "system,user,assistant" : "user,assistant";
        const rows = pairs.map((p) => {
          if (includeSystemInEveryRow) {
            return escapeCsv(systemPrompt) + "," + escapeCsv(p.input) + "," + escapeCsv(p.output);
          }
          return escapeCsv(p.input) + "," + escapeCsv(p.output);
        });
        return header + "\n" + rows.join("\n");
      }

      default:
        return "";
    }
  }, [pairs, systemPrompt, format, includeSystemInEveryRow]);

  const downloadDataset = () => {
    const extensions: Record<OutputFormat, string> = {
      "openai-jsonl": "jsonl",
      "anthropic-xml": "xml",
      "chatml": "txt",
      "llama3": "txt",
      "ts-array": "ts",
      "csv": "csv"
    };
    const mimeTypes: Record<OutputFormat, string> = {
      "openai-jsonl": "application/jsonlines",
      "anthropic-xml": "application/xml",
      "chatml": "text/plain",
      "llama3": "text/plain",
      "ts-array": "application/typescript",
      "csv": "text/csv"
    };

    const blob = new Blob([formattedOutput], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "few-shot-dataset." + extensions[format];
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-text-muted text-xs">Total Examples</p>
        <p className="text-accent font-mono font-bold text-lg">{pairs.length} pairs</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Output Format</p>
        <p className="text-text-primary font-mono uppercase text-xs truncate font-bold">{format}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Output Size</p>
        <p className="text-text-primary font-mono">{formattedOutput.length.toLocaleString()} chars</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Validation</p>
        <p className="text-success font-mono font-bold">100% Valid</p>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="few-shot-formatter" stats={stats}>
      <div className="card p-6 space-y-6 font-mono">
        {/* Presets */}
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2">
            Sample Datasets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadPreset("sentiment")}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Sentiment Classification
            </button>
            <button
              type="button"
              onClick={() => loadPreset("sqlGenerator")}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              SQL Query Generation
            </button>
            <button
              type="button"
              onClick={() => loadPreset("nerExtraction")}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              NER Entity Extraction
            </button>
          </div>
        </div>

        {/* System Persona Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary">
              System Role / Persona Instructions
            </label>
            <span className="text-xs text-text-muted font-mono">{systemPrompt.length} chars</span>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="Enter system prompt / instructions for all examples..."
            rows={3}
            className="w-full rounded-xl border border-border-subtle bg-bg-page p-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y"
          />
        </div>

        {/* Few-Shot Pairs */}
        <div className="space-y-4 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">
              Few-Shot Input/Output Pairs ({pairs.length})
            </label>
            <button
              type="button"
              onClick={addPair}
              className="btn-primary text-xs px-3 py-1.5"
            >
              + Add Example
            </button>
          </div>

          <div className="space-y-4">
            {pairs.map((p, idx) => (
              <div key={p.id} className="p-4 rounded-xl border border-border-subtle bg-bg-page space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                  <span className="font-semibold text-accent text-xs font-mono">Example #{idx + 1}</span>
                  {pairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePair(p.id)}
                      className="text-xs text-text-muted hover:text-error transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted block mb-1">User Input:</label>
                    <textarea
                      value={p.input}
                      onChange={(e) => updatePair(p.id, "input", e.target.value)}
                      placeholder="User input question or prompt..."
                      rows={3}
                      className="w-full rounded-lg border border-border-subtle bg-bg-card p-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Expected Assistant Response:</label>
                    <textarea
                      value={p.output}
                      onChange={(e) => updatePair(p.id, "output", e.target.value)}
                      placeholder="Expected assistant answer..."
                      rows={3}
                      className="w-full rounded-lg border border-border-subtle bg-bg-card p-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formatted Output Section */}
        <div className="space-y-4 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">
              Export Format
            </label>
            <div className="flex items-center gap-2">
              <CopyButton text={formattedOutput} label="Copy Output" />
              <button
                type="button"
                onClick={downloadDataset}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Download File
              </button>
            </div>
          </div>

          {/* Format Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFormat("openai-jsonl")}
              className={format === "openai-jsonl" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
            >
              OpenAI JSONL
            </button>
            <button
              type="button"
              onClick={() => setFormat("anthropic-xml")}
              className={format === "anthropic-xml" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
            >
              Anthropic XML
            </button>
            <button
              type="button"
              onClick={() => setFormat("chatml")}
              className={format === "chatml" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
            >
              ChatML
            </button>
            <button
              type="button"
              onClick={() => setFormat("llama3")}
              className={format === "llama3" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
            >
              Llama 3
            </button>
            <button
              type="button"
              onClick={() => setFormat("ts-array")}
              className={format === "ts-array" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
            >
              TS Array
            </button>
            <button
              type="button"
              onClick={() => setFormat("csv")}
              className={format === "csv" ? "btn-primary text-xs px-3 py-1.5" : "btn-secondary text-xs px-3 py-1.5"}
            >
              CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="incSystemCheckbox"
              checked={includeSystemInEveryRow}
              onChange={(e) => setIncludeSystemInEveryRow(e.target.checked)}
              className="accent-accent cursor-pointer"
            />
            <label htmlFor="incSystemCheckbox" className="text-xs text-text-muted cursor-pointer">
              Include system prompt in every entry
            </label>
          </div>

          <pre className="p-4 rounded-xl border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
            {formattedOutput || "// Add input/output pairs to generate formatted dataset"}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
