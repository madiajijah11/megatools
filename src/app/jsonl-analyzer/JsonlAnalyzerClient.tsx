"use client";

import { useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

const SAMPLE = `{"id":1,"event":"login","ok":true}
{"id":2,"event":"upload","ok":true}
not valid json

{"id":3,"event":"logout","ok":false}`;

type Row = { line: number; text: string; value?: unknown; error?: string; blank: boolean };
type Field = { frequency: number; types: Map<string, number> };

function valueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function formatValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

export default function JsonlAnalyzerClient() {
  const [input, setInput] = useState(SAMPLE);
  const rows = useMemo<Row[]>(() => input.split(/\r?\n/).map((text, index) => {
    const line = index + 1;
    if (!text.trim()) return { line, text, blank: true };
    try { return { line, text, value: JSON.parse(text), blank: false }; }
    catch (error) { return { line, text, blank: false, error: error instanceof Error ? error.message : "Invalid JSON" }; }
  }), [input]);
  const valid = rows.filter((row) => !row.blank && !row.error);
  const invalid = rows.filter((row) => Boolean(row.error));
  const blanks = rows.filter((row) => row.blank);
  const objects = valid.filter((row): row is Row & { value: Record<string, unknown> } =>
    typeof row.value === "object" && row.value !== null && !Array.isArray(row.value));
  const analysis = useMemo(() => {
    const fields = new Map<string, Field>();
    objects.forEach(({ value }) => Object.entries(value).forEach(([key, fieldValue]) => {
      const entry = fields.get(key) ?? { frequency: 0, types: new Map<string, number>() };
      entry.frequency += 1;
      entry.types.set(valueType(fieldValue), (entry.types.get(valueType(fieldValue)) ?? 0) + 1);
      fields.set(key, entry);
    }));
    const schema = [...fields.entries()].map(([name, field]) => ({
      name, required: field.frequency === objects.length,
      types: [...field.types.keys()].join(" | "),
      frequency: field.frequency,
    }));
    const names = schema.map((field) => field.name);
    const drift = objects.flatMap(({ line, value }) => {
      const missing = names.filter((name) => !(name in value));
      const extra = Object.keys(value).filter((name) => !names.includes(name));
      return missing.length || extra.length ? [{ line, missing, extra }] : [];
    });
    return { schema, drift };
  }, [objects]);
  const validReport = valid.map(({ line, value }) => ({ line, value }));
  const invalidReport = invalid.map(({ line, text, error }) => ({ line, text, error }));
  const report = JSON.stringify({ valid: validReport, invalid: invalidReport, blanks: blanks.map(({ line }) => line) }, null, 2);
  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between border-b border-border-subtle/50 py-1"><span className="text-text-muted">Lines:</span><span>{rows.length}</span></div>
      <div className="flex justify-between border-b border-border-subtle/50 py-1"><span className="text-text-muted">Valid:</span><span className="text-success">{valid.length}</span></div>
      <div className="flex justify-between border-b border-border-subtle/50 py-1"><span className="text-text-muted">Invalid:</span><span className="text-error">{invalid.length}</span></div>
      <div className="flex justify-between border-b border-border-subtle/50 py-1"><span className="text-text-muted">Blank:</span><span>{blanks.length}</span></div>
      <div className="flex justify-between py-1"><span className="text-text-muted">Objects:</span><span>{objects.length}</span></div>
    </div>
  );
  return (
    <ToolLayout toolId="jsonl-analyzer" stats={stats}>
      <div className="space-y-4 font-mono">
        <section className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5">
          <div className="mb-2 flex h-8 items-center justify-between border-b border-border-subtle pb-2"><label htmlFor="jsonl-input" className="text-xs text-text-muted">JSONL INPUT</label><button type="button" className="text-xs text-accent" onClick={() => setInput("")}>Clear</button></div>
          <textarea id="jsonl-input" value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} className="min-h-56 w-full resize-y bg-transparent text-sm text-text-primary outline-none" placeholder="One JSON value per line…" />
        </section>
        <section className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5">
          <div className="mb-3 flex h-8 items-center justify-between border-b border-border-subtle"><h2 className="text-sm text-text-primary">Physical line diagnostics</h2><span className="text-xs text-text-muted">{rows.length} lines</span></div>
          {rows.length === 0 ? <p className="text-xs text-text-muted">No lines to analyze.</p> : <div className="max-h-80 space-y-1 overflow-auto text-xs">{rows.map((row) => <div key={row.line} className="grid grid-cols-[3rem_1fr_auto] gap-2 border-b border-border-subtle/40 py-1"><span className="text-text-muted">{row.line}</span><span className="truncate text-text-secondary">{row.text || "(blank)"}</span><span className={row.error ? "text-error" : row.blank ? "text-warning" : "text-success"}>{row.error ? `INVALID: ${row.error}` : row.blank ? "BLANK" : `VALID · ${valueType(row.value)}`}</span></div>)}</div>}
        </section>
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5"><div className="mb-3 flex h-8 items-center justify-between border-b border-border-subtle"><h2 className="text-sm">Valid report</h2><CopyButton text={JSON.stringify(validReport, null, 2)} /></div>{valid.length ? <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-success">{JSON.stringify(validReport, null, 2)}</pre> : <p className="text-xs text-text-muted">No valid JSON values.</p>}</section>
          <section className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5"><div className="mb-3 flex h-8 items-center justify-between border-b border-border-subtle"><h2 className="text-sm">Invalid report</h2><CopyButton text={JSON.stringify(invalidReport, null, 2)} /></div>{invalid.length ? <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-error">{JSON.stringify(invalidReport, null, 2)}</pre> : <p className="text-xs text-text-muted">No invalid lines.</p>}</section>
        </div>
        <section className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5"><div className="mb-3 flex h-8 items-center justify-between border-b border-border-subtle"><h2 className="text-sm">Field / type / schema analysis</h2><span className="text-xs text-text-muted">{objects.length} object records</span></div>{!objects.length ? <p className="text-xs text-text-muted">Object field analysis is unavailable for empty, primitive, array-only, or invalid input.</p> : <><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-text-muted"><tr><th className="py-2">Field</th><th>Required</th><th>Types</th><th>Frequency</th></tr></thead><tbody>{analysis.schema.map((field) => <tr key={field.name} className="border-t border-border-subtle/40"><td className="py-2 text-accent">{field.name}</td><td>{field.required ? "yes" : "no"}</td><td>{field.types}</td><td>{field.frequency}/{objects.length}</td></tr>)}</tbody></table></div>{analysis.drift.length > 0 && <div className="mt-3 text-xs text-warning">Schema drift: {analysis.drift.map(({ line, missing, extra }) => <div key={line}>Line {line}{missing.length ? ` · missing: ${missing.join(", ")}` : ""}{extra.length ? ` · extra: ${extra.join(", ")}` : ""}</div>)}</div>}</>}</section>
        <section className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5"><div className="mb-3 flex h-8 items-center justify-between border-b border-border-subtle"><h2 className="text-sm">Complete analysis report</h2><CopyButton text={report} /></div><pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs text-text-secondary">{report}</pre></section>
        <p className="text-center text-xs text-text-muted">All analysis runs locally in your browser. Input is never uploaded.</p>
      </div>
    </ToolLayout>
  );
}
