"use client";

import { useState, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type DelimiterType = "," | ";" | "\t" | "|";

const PRESETS = {
  users: `[
  {
    "id": "usr_101",
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "role": "Admin",
    "location": {
      "city": "Los Angeles",
      "country": "USA"
    },
    "active": true
  },
  {
    "id": "usr_102",
    "name": "John Connor",
    "email": "john@example.com",
    "role": "Member",
    "location": {
      "city": "Austin",
      "country": "USA"
    },
    "active": false
  },
  {
    "id": "usr_103",
    "name": "Kyle Reese",
    "email": "kyle@example.com",
    "role": "Contributor",
    "location": {
      "city": "London",
      "country": "UK"
    },
    "active": true
  }
]`,
  products: `[
  { "sku": "KB-01", "name": "Mechanical Keyboard", "price": 129.99, "stock": 42, "category": "Hardware" },
  { "sku": "MS-02", "name": "Wireless Ergonomic Mouse", "price": 79.50, "stock": 115, "category": "Hardware" },
  { "sku": "HD-03", "name": "Noise Canceling Headset", "price": 199.00, "stock": 18, "category": "Audio" }
]`,
  metrics: `[
  { "timestamp": "2026-09-15T08:00:00Z", "cpu": 34.2, "memory": 68.5, "requests": 1420 },
  { "timestamp": "2026-09-15T08:05:00Z", "cpu": 41.8, "memory": 71.0, "requests": 1890 },
  { "timestamp": "2026-09-15T08:10:00Z", "cpu": 28.5, "memory": 65.2, "requests": 1100 }
]`,
};

function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(result, flattenObject(val as Record<string, unknown>, newKey));
    } else if (Array.isArray(val)) {
      result[newKey] = JSON.stringify(val);
    } else {
      result[newKey] = val;
    }
  }

  return result;
}

function escapeCsvCell(val: unknown, delimiter: DelimiterType): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  const needsQuotes = str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r");
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function JsonToCsvClient() {
  const [jsonInput, setJsonInput] = useState<string>(PRESETS.users);
  const [delimiter, setDelimiter] = useState<DelimiterType>(",");
  const [flatten, setFlatten] = useState<boolean>(true);
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [viewTab, setViewTab] = useState<"csv" | "table">("csv");

  const { parsedRows, headers, error } = useMemo(() => {
    const trimmed = jsonInput.trim();
    if (!trimmed) return { parsedRows: [], headers: [], error: null };

    try {
      let data = JSON.parse(trimmed);
      if (!Array.isArray(data)) {
        if (typeof data === "object" && data !== null) {
          data = [data];
        } else {
          return { parsedRows: [], headers: [], error: "Input must be a JSON array or object." };
        }
      }

      const rows: Record<string, unknown>[] = data.map((item: unknown) => {
        if (typeof item === "object" && item !== null && !Array.isArray(item)) {
          return flatten ? flattenObject(item as Record<string, unknown>) : (item as Record<string, unknown>);
        }
        return { value: item };
      });

      const headerSet = new Set<string>();
      rows.forEach((r) => Object.keys(r).forEach((k) => headerSet.add(k)));
      const allHeaders = Array.from(headerSet);

      return { parsedRows: rows, headers: allHeaders, error: null };
    } catch (err) {
      return { parsedRows: [], headers: [], error: (err as Error).message };
    }
  }, [jsonInput, flatten]);

  const compiledCsv = useMemo(() => {
    if (parsedRows.length === 0 || headers.length === 0) return "";

    const lines: string[] = [];
    if (includeHeaders) {
      lines.push(headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter));
    }

    parsedRows.forEach((row) => {
      const rowCells = headers.map((h) => escapeCsvCell(row[h], delimiter));
      lines.push(rowCells.join(delimiter));
    });

    return lines.join("\n");
  }, [parsedRows, headers, delimiter, includeHeaders]);

  const handleDownload = useCallback(() => {
    if (!compiledCsv) return;
    const ext = delimiter === "\t" ? "tsv" : "csv";
    const mime = delimiter === "\t" ? "text/tab-separated-values" : "text/csv";
    const blob = new Blob([compiledCsv], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exported-data.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [compiledCsv, delimiter]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Rows:</span>
        <span className="text-accent font-bold">{parsedRows.length} rows</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Columns:</span>
        <span className="text-text-primary">{headers.length} columns</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Delimiter:</span>
        <span className="text-text-primary uppercase font-bold">
          {delimiter === "," ? "Comma (,)" : delimiter === ";" ? "Semicolon (;)" : delimiter === "\t" ? "Tab (TSV)" : "Pipe (|)"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Status:</span>
        <span className={error ? "text-error font-bold" : "text-success font-bold"}>
          {error ? "PARSE ERROR" : "READY"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="json-to-csv" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle text-xs">
          <span className="text-text-muted">JSON Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setJsonInput(PRESETS.users)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [Users List (Nested)]
            </button>
            <button
              type="button"
              onClick={() => setJsonInput(PRESETS.products)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [Products Catalog]
            </button>
            <button
              type="button"
              onClick={() => setJsonInput(PRESETS.metrics)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [Server Metrics]
            </button>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Source JSON Array / Object</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setJsonInput("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
              <CopyButton text={jsonInput} label="Copy JSON" />
            </div>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste JSON array or objects to convert..."
            rows={7}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Exporter Settings Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border-subtle text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Delimiter:</span>
              {(
                [
                  { label: "CSV (,)", val: "," },
                  { label: "Semicolon (;)", val: ";" },
                  { label: "TSV (Tab)", val: "\t" },
                  { label: "Pipe (|)", val: "|" },
                ] as const
              ).map(({ label, val }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDelimiter(val)}
                  className={`px-2 py-0.5 rounded border text-xs font-mono transition-colors ${
                    delimiter === val
                      ? "border-accent text-accent bg-accent/10 font-bold"
                      : "border-border-subtle text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
              <input
                type="checkbox"
                checked={flatten}
                onChange={(e) => setFlatten(e.target.checked)}
                className="accent-accent cursor-pointer"
              />
              <span>Flatten Nested Keys (a.b.c)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
              <input
                type="checkbox"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="accent-accent cursor-pointer"
              />
              <span>Include Header Row</span>
            </label>
          </div>
        </div>

        {/* View Switcher & Output */}
        {compiledCsv && (
          <div className="pt-3 border-t border-border-subtle space-y-3">
            <div className="h-8 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setViewTab("csv")}
                  className={`px-3 py-1 rounded font-bold transition-colors ${
                    viewTab === "csv" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Raw CSV / TSV Output
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab("table")}
                  className={`px-3 py-1 rounded font-bold transition-colors ${
                    viewTab === "table" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Data Grid Table Preview ({parsedRows.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <CopyButton text={compiledCsv} label="Copy Output" />
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1 rounded bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
                >
                  Download {delimiter === "\t" ? ".tsv" : ".csv"}
                </button>
              </div>
            </div>

            {viewTab === "csv" ? (
              <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
                {compiledCsv}
              </pre>
            ) : (
              <div className="rounded-lg border border-border-subtle bg-bg-page overflow-x-auto max-h-72">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-card/70">
                      {headers.map((h) => (
                        <th key={h} className="p-2.5 font-bold text-accent whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {parsedRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-bg-card/40 transition-colors">
                        {headers.map((h) => (
                          <td key={h} className="p-2.5 whitespace-nowrap text-text-secondary">
                            {row[h] !== undefined ? String(row[h]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
