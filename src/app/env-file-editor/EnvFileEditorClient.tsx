"use client";

import { useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

const SAMPLE = `# Local development\nNODE_ENV=development\nDATABASE_URL="postgres://user:password@localhost/app#dev"\nAPI_KEY=demo-secret\nPORT=3000`;

type Entry = { key: string; value: string; line: number; raw: string; prefix: string };
type Diagnostic = { line: number; message: string; kind: "error" | "warning" };

function parseValue(value: string) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    const quote = trimmed[0];
    const body = trimmed.slice(1, -1);
    return quote === '"' ? body.replace(/\\([\\"nrt$])/g, (_, ch: string) => ({ n: "\\n", r: "\\r", t: "\\t", $: "$", "\\": "\\", '"': '"' }[ch] ?? ch)) : body.replace(/''/g, "'");
  }
  const hash = trimmed.indexOf(" #");
  return (hash >= 0 ? trimmed.slice(0, hash) : trimmed).trim();
}

function parseEnv(source: string) {
  const lines = source.split(/\r?\n/);
  const entries: Entry[] = [];
  const diagnostics: Diagnostic[] = [];
  lines.forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = raw.match(/^(\s*)(export\s+)?([^=\s]+)\s*=([\s\S]*)$/);
    if (!match) {
      diagnostics.push({ line, kind: "error", message: trimmed.includes("=") ? "Invalid variable name; use letters, numbers, _, ., or - (not as the first character)." : "Unsupported continuation or syntax; multiline values are not supported. Put the value on one line or encode newlines." });
      return;
    }
    const [, indent, exported, key, value] = match;
    if (!/^[A-Za-z_][\w.-]*$/.test(key)) {
      diagnostics.push({ line, kind: "error", message: `Invalid key \"${key}\".` });
      return;
    }
    entries.push({ key, value: parseValue(value), line, raw, prefix: `${indent}${exported ?? ""}${key}=` });
  });
  const seen = new Map<string, number>();
  entries.forEach((entry) => {
    const first = seen.get(entry.key);
    if (first !== undefined) diagnostics.push({ line: entry.line, kind: "warning", message: `Duplicate key \"${entry.key}\" (first defined on line ${first}); JSON uses the last value.` });
    else seen.set(entry.key, entry.line);
  });
  return { lines, entries, diagnostics };
}

export default function EnvFileEditorClient() {
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState<"env" | "example" | "json">("env");
  const [mask, setMask] = useState(false);
  const [blankSecrets, setBlankSecrets] = useState(true);
  const [secretPattern, setSecretPattern] = useState("KEY|TOKEN|SECRET|PASSWORD|PASS|PRIVATE|CREDENTIAL");
  const parsed = useMemo(() => parseEnv(input), [input]);
  const secretRe = useMemo(() => {
    try { return new RegExp(secretPattern || "$^", "i"); } catch { return /$^/; }
  }, [secretPattern]);
  const isSecret = (key: string) => secretRe.test(key);
  const masked = (value: string) => value ? "•".repeat(Math.min(12, Math.max(4, value.length))) : "";
  const output = useMemo(() => {
    if (mode === "env") return input;
    if (mode === "json") {
      const object: Record<string, string> = {};
      parsed.entries.forEach(({ key, value }) => { object[key] = value; });
      return JSON.stringify(object, Object.keys(object).sort(), 2);
    }
    return parsed.lines.map((line) => {
      const entry = parsed.entries.find((item) => item.raw === line);
      if (!entry || (!blankSecrets && !isSecret(entry.key))) return line;
      if (!isSecret(entry.key)) return line;
      const original = line.slice(line.indexOf("=") + 1);
      return `${line.slice(0, line.indexOf("=") + 1)}${original.trim() ? "" : original}`;
    }).join("\n");
  }, [blankSecrets, input, mode, parsed.entries, parsed.lines, secretPattern]);
  const visibleOutput = mask && mode !== "env" ? output.split(/\r?\n/).map((line) => {
    const entry = parsed.entries.find((item) => item.raw === line);
    return entry && isSecret(entry.key) && line.includes("=") ? `${line.slice(0, line.indexOf("=") + 1)}${masked(entry.value)}` : line;
  }).join("\n") : output;
  const errors = parsed.diagnostics.filter((item) => item.kind === "error");
  const warnings = parsed.diagnostics.filter((item) => item.kind === "warning");
  const stats = <div className="text-xs font-mono space-y-1"><div className="flex justify-between"><span className="text-text-muted">Variables</span><b className="text-accent">{parsed.entries.length}</b></div><div className="flex justify-between"><span className="text-text-muted">Diagnostics</span><b className={parsed.diagnostics.length ? "text-warning" : "text-success"}>{parsed.diagnostics.length}</b></div></div>;
  return <ToolLayout toolId="env-file-editor" stats={stats}><div className="space-y-4 font-mono">
    <div className="flex flex-wrap gap-2 text-xs"><button onClick={() => setMode("env")} className={`px-3 py-1 rounded border ${mode === "env" ? "border-accent text-accent" : "border-border-subtle text-text-muted"}`}>.env</button><button onClick={() => setMode("example")} className={`px-3 py-1 rounded border ${mode === "example" ? "border-accent text-accent" : "border-border-subtle text-text-muted"}`}>.env.example</button><button onClick={() => setMode("json")} className={`px-3 py-1 rounded border ${mode === "json" ? "border-accent text-accent" : "border-border-subtle text-text-muted"}`}>JSON</button><button onClick={() => setMask(!mask)} className="px-3 py-1 rounded border border-border-subtle text-text-muted">{mask ? "Show values" : "Mask secrets"}</button></div>
    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded border border-border-subtle bg-bg-card overflow-hidden"><div className="h-8 flex items-center justify-between px-3 border-b border-border-subtle text-xs"><span className="text-text-muted">SOURCE .ENV</span><button className="font-mono text-accent" onClick={() => setInput("")}>Clear</button></div><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-label="Environment file source" className="w-full min-h-80 resize-y bg-transparent p-3 text-sm text-text-primary outline-none" placeholder="KEY=value" /></section><section className="rounded border border-border-subtle bg-bg-card overflow-hidden"><div className="h-8 flex items-center justify-between px-3 border-b border-border-subtle text-xs"><span className="text-text-muted">OUTPUT {mode === "example" ? ".ENV.EXAMPLE" : mode.toUpperCase()}</span><CopyButton text={visibleOutput} label="Copy" className="font-mono text-xs text-accent" /></div><pre className="min-h-80 overflow-auto whitespace-pre-wrap p-3 text-sm text-text-primary">{visibleOutput || <span className="text-text-muted">No output yet.</span>}</pre></section></div>
    <div className="grid gap-3 rounded border border-border-subtle bg-bg-card p-3 text-xs"><label className="flex items-center gap-2"><input type="checkbox" checked={blankSecrets} onChange={(event) => setBlankSecrets(event.target.checked)} /> Blank classified secrets in .env.example</label><label className="flex items-center gap-2"><span className="text-text-muted shrink-0">Secret name pattern</span><input value={secretPattern} onChange={(event) => setSecretPattern(event.target.value)} className="min-w-0 flex-1 rounded border border-border-subtle bg-transparent px-2 py-1 text-text-primary" aria-label="Secret name pattern" /></label></div>
    {errors.length === 0 && warnings.length === 0 && !input.trim() && <p className="text-xs text-text-muted">Empty input. Paste a .env file to begin; nothing leaves your browser.</p>}
    {parsed.diagnostics.length > 0 && <div className="space-y-1 rounded border border-border-subtle p-3 text-xs">{parsed.diagnostics.map((item, index) => <p key={`${item.line}-${index}`} className={item.kind === "error" ? "text-error" : "text-warning"}>Line {item.line}: {item.message}</p>)}</div>}
    {mode === "json" && warnings.length > 0 && <p className="text-xs text-warning">JSON export is deterministic: duplicate keys use the last occurrence; keys are sorted.</p>}
  </div></ToolLayout>;
}
