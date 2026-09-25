"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface RepairResult {
  repaired: string;
  isValid: boolean;
  changes: string[];
  error?: string;
}

function repairJsonString(input: string): RepairResult {
  const changes: string[] = [];
  let text = input.trim();

  if (!text) {
    return { repaired: "", isValid: true, changes: [] };
  }

  // 1. Try native parse first
  try {
    const parsed = JSON.parse(text);
    return {
      repaired: JSON.stringify(parsed, null, 2),
      isValid: true,
      changes: ["Input is already valid JSON (formatted)"],
    };
  } catch {
    // Needs repair
  }

  // 2. Strip Markdown code fences ```json ... ```
  if (/```(?:json)?\s*[\s\S]*?```/i.test(text)) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match && match[1]) {
      text = match[1].trim();
      changes.push("Stripped Markdown code block wrapper (```json)");
    }
  } else if (text.startsWith("```")) {
    text = text.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();
    changes.push("Stripped unclosed Markdown backticks");
  }

  // 3. Extract JSON object or array if surrounded by chatter/prose
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx > 0) {
    text = text.slice(startIdx);
    changes.push(`Trimmed ${startIdx} characters of leading conversational prose`);
  }

  // 4. Strip single-line and multi-line comments
  const commentRegex = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
  if (commentRegex.test(text)) {
    text = text.replace(commentRegex, "");
    changes.push("Removed JavaScript / C-style comments");
  }

  // 5. Replace Python / non-standard literals outside quoted strings
  const literalMap: Record<string, string> = {
    True: "true",
    False: "false",
    None: "null",
    undefined: "null",
  };

  for (const [raw, replacement] of Object.entries(literalMap)) {
    const litRegex = new RegExp(`\\b${raw}\\b`, "g");
    if (litRegex.test(text)) {
      text = text.replace(litRegex, replacement);
      changes.push(`Converted '${raw}' to '${replacement}'`);
    }
  }

  // 6. Fix single quotes to double quotes for keys and string values
  let processed = "";
  let inDouble = false;
  let inSingle = false;
  let escaped = false;
  let singleQuoteFixed = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      processed += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      processed += ch;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      processed += ch;
    } else if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      processed += '"';
      singleQuoteFixed = true;
    } else {
      processed += ch;
    }
  }

  if (singleQuoteFixed) {
    changes.push("Converted single-quoted strings and keys to double-quotes");
  }
  text = processed;

  // 7. Fix unquoted keys in objects: e.g. { foo: "bar" } or { foo_bar: 123 }
  const unquotedKeyRegex = /([{,]\s*)([a-zA-Z0-9_$-]+)(\s*:)/g;
  if (unquotedKeyRegex.test(text)) {
    text = text.replace(unquotedKeyRegex, '$1"$2"$3');
    changes.push("Added missing quotes around object keys");
  }

  // 8. Remove trailing commas in objects and arrays: , } -> } and , ] -> ]
  const trailingCommaRegex = /,\s*([}\]])/g;
  if (trailingCommaRegex.test(text)) {
    text = text.replace(trailingCommaRegex, "$1");
    changes.push("Removed trailing commas before closing braces/brackets");
  }

  // 9. Fix unescaped newlines inside strings
  let stringBalanced = "";
  let insideStr = false;
  let esc = false;
  let newlineFixed = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (esc) {
      stringBalanced += char;
      esc = false;
      continue;
    }
    if (char === "\\") {
      esc = true;
      stringBalanced += char;
      continue;
    }
    if (char === '"') {
      insideStr = !insideStr;
      stringBalanced += char;
      continue;
    }
    if (insideStr && (char === "\n" || char === "\r")) {
      stringBalanced += "\\n";
      newlineFixed = true;
    } else {
      stringBalanced += char;
    }
  }
  if (newlineFixed) {
    changes.push("Escaped raw newlines inside string literals");
  }
  text = stringBalanced;

  // 10. Balance unclosed braces and brackets & strip trailing prose after root closes
  const openStack: string[] = [];
  let inString = false;
  let isEscaped = false;
  let closedIdx = -1;
  let hasStarted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === "\\") {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === "{" || char === "[") {
        openStack.push(char === "{" ? "}" : "]");
        hasStarted = true;
      } else if (char === "}" || char === "]") {
        if (openStack.length > 0 && openStack[openStack.length - 1] === char) {
          openStack.pop();
          if (hasStarted && openStack.length === 0) {
            closedIdx = i;
            break;
          }
        }
      }
    }
  }

  // If root JSON container closed and there is trailing conversational prose, slice it off
  if (closedIdx !== -1 && closedIdx < text.length - 1) {
    const trailing = text.slice(closedIdx + 1).trim();
    if (trailing) {
      text = text.slice(0, closedIdx + 1);
      changes.push("Stripped trailing conversational prose after JSON closing delimiter");
    }
  }

  if (inString) {
    text += '"';
    changes.push("Closed unterminated string quote");
  }

  // Clean trailing commas after closing string
  text = text.replace(/,\s*$/, "");

  if (openStack.length > 0) {
    const closers = openStack.reverse().join("");
    text += closers;
    changes.push(`Auto-closed unclosed delimiters: ${closers}`);
  }

  // Final validation attempt
  try {
    const parsed = JSON.parse(text);
    return {
      repaired: JSON.stringify(parsed, null, 2),
      isValid: true,
      changes: changes.length > 0 ? changes : ["Successfully normalized and formatted"],
    };
  } catch (err: unknown) {
    return {
      repaired: text,
      isValid: false,
      changes,
      error: err instanceof Error ? err.message : "Unknown syntax error remaining",
    };
  }
}

const PRESETS = [
  {
    name: "Truncated LLM Stream",
    badge: "Auto-Close",
    code: `Here is the user database schema you requested:
\`\`\`json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "name": 'Alice',
        "role": 'admin',
        "active": True,
        "preferences": None,
      },
      {
        "id": 2,
        "name": 'Bob',
        "role": 'developer'`,
  },
  {
    name: "Unquoted Keys & Single Quotes",
    badge: "Quotes",
    code: `{
  name: 'MegaTools AI',
  version: 2.5,
  features: ['client-side', 'zero-leakage',],
  // Internal config
  debug: False,
  timeout: undefined,
}`,
  },
  {
    name: "Trailing Commas & Prose",
    badge: "Clean Prose",
    code: `Certainly! Here is your requested payload:

[
  {"id": 101, "title": "First Entry",},
  {"id": 102, "title": "Second Entry",},
]

Let me know if you need any adjustments!`,
  },
];

export default function JsonRepairClient() {
  const [input, setInput] = useState(PRESETS[0].code);

  const repairResult = useMemo(() => repairJsonString(input), [input]);

  const inputLineCount = useMemo(() => input.split("\n").length, [input]);
  const outputLineCount = useMemo(
    () => (repairResult.repaired ? repairResult.repaired.split("\n").length : 0),
    [repairResult.repaired]
  );

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Parser Status:</span>
        <span className={repairResult.isValid ? "text-success font-bold" : "text-warning font-bold"}>
          {repairResult.isValid ? "Valid JSON" : "Syntax Needs Fix"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Repairs Applied:</span>
        <span className="text-accent font-bold">{repairResult.changes.length} rules</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Execution:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  const handleDownload = () => {
    if (!repairResult.repaired) return;
    const blob = new Blob([repairResult.repaired], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "repaired.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout toolId="json-repair" stats={stats}>
      <div className="space-y-6">
        {/* Preset Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-text-muted">Load Preset:</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setInput(p.code)}
              className="text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent hover:text-accent transition-colors flex items-center gap-1.5"
            >
              <span>{p.name}</span>
              <span className="text-[10px] px-1 rounded bg-bg-page border border-border-subtle text-text-muted">
                {p.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Input & Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Input Panel */}
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 font-mono flex flex-col">
            <div className="h-8 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">Raw / Broken JSON</span>
                <span className="text-[11px] text-text-muted">({inputLineCount} lines · {input.length} chars)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInput("")}
                  className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
                >
                  [Clear]
                </button>
                <CopyButton text={input} label="Copy" />
              </div>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste broken JSON, LLM output with markdown, single quotes, or truncated response..."
              rows={18}
              className="w-full flex-1 min-h-[420px] rounded-lg border border-border-subtle bg-bg-page p-3.5 font-mono text-xs text-text-primary placeholder:text-text-muted/50 focus:border-accent focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Output Panel */}
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 font-mono flex flex-col">
            <div className="h-8 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary">Repaired Output</span>
                {repairResult.isValid ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success border border-success/30 font-bold">
                    VALID
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/30 font-bold">
                    PARTIAL
                  </span>
                )}
                {outputLineCount > 0 && (
                  <span className="text-[11px] text-text-muted">({outputLineCount} lines)</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!repairResult.repaired}
                  className="text-xs text-text-muted hover:text-accent disabled:opacity-40 transition-colors px-2.5 py-0.5 rounded border border-border-subtle"
                >
                  [Download .json]
                </button>
                <CopyButton text={repairResult.repaired} label="Copy Repaired" />
              </div>
            </div>

            <textarea
              readOnly
              value={repairResult.repaired}
              rows={18}
              className="w-full flex-1 min-h-[420px] rounded-lg border border-border-subtle bg-bg-page p-3.5 font-mono text-xs text-text-primary focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Repair Audit Log */}
        {repairResult.changes.length > 0 && (
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 font-mono">
            <div className="h-8 flex items-center justify-between text-xs border-b border-border-subtle/50 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-accent">Automated Repair Actions Applied</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-accent/10 text-accent font-bold">
                  {repairResult.changes.length} rules
                </span>
              </div>
              <span className="text-text-muted text-[11px]">Instant AST token engine</span>
            </div>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
              {repairResult.changes.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2 text-text-secondary bg-bg-page/60 p-2 rounded border border-border-subtle/50">
                  <span className="text-accent font-bold">✓</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>

            {repairResult.error && (
              <div className="p-3 rounded border border-error/40 bg-error/10 text-error text-xs">
                ⚠️ Remaining syntax issue: {repairResult.error}
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
