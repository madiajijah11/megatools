"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Mode = "csv2json" | "json2csv";

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentVal.trim());
        currentVal = "";
      } else if (char === "\r") {
        // ignore
      } else if (char === "\n") {
        currentRow.push(currentVal.trim());
        if (currentRow.some((c) => c !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal !== "" || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function jsonToCsv(jsonStr: string): string {
  const parsed = JSON.parse(jsonStr);

  if (Array.isArray(parsed)) {
    if (parsed.length === 0) return "";

    if (typeof parsed[0] === "object" && parsed[0] !== null && !Array.isArray(parsed[0])) {
      const headers = Array.from(
        new Set(parsed.flatMap((item: Record<string, unknown>) => Object.keys(item)))
      );
      const headerRow = headers.map(escapeCsvValue).join(",");
      const dataRows = parsed.map((item: Record<string, unknown>) =>
        headers.map((h) => escapeCsvValue(String(item[h] ?? ""))).join(",")
      );
      return [headerRow, ...dataRows].join("\n");
    }

    if (Array.isArray(parsed[0])) {
      return parsed
        .map((row: unknown[]) => row.map((cell) => escapeCsvValue(String(cell ?? ""))).join(","))
        .join("\n");
    }
  }

  throw new Error("JSON must be an array of objects or an array of arrays.");
}

function escapeCsvValue(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

const SAMPLE_CSV = `name,age,city,role
Alice,28,New York,Engineer
Bob,34,San Francisco,Designer
Charlie,22,Chicago,Developer`;

const SAMPLE_JSON = `[
  { "name": "Alice", "age": 28, "city": "New York", "role": "Engineer" },
  { "name": "Bob", "age": 34, "city": "San Francisco", "role": "Designer" },
  { "name": "Charlie", "age": 22, "city": "Chicago", "role": "Developer" }
]`;

export default function CsvJsonClient() {
  const [mode, setMode] = useState<Mode>("csv2json");
  const [input, setInput] = useState(SAMPLE_CSV);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [firstRowAsHeaders, setFirstRowAsHeaders] = useState(true);
  const [minify, setMinify] = useState(false);
  const [rowsCount, setRowsCount] = useState<number | null>(null);
  const [colsCount, setColsCount] = useState<number | null>(null);

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) {
      setOutput("");
      setRowsCount(null);
      setColsCount(null);
      return;
    }

    try {
      if (mode === "csv2json") {
        const rows = parseCsv(input);
        if (rows.length === 0) {
          setOutput("[]");
          setRowsCount(0);
          setColsCount(0);
          return;
        }

        setRowsCount(rows.length);
        setColsCount(rows[0]?.length ?? 0);

        if (firstRowAsHeaders && rows.length > 1) {
          const headers = rows[0];
          const data = rows.slice(1).map((row) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, idx) => {
              obj[h || `col_${idx + 1}`] = row[idx] ?? "";
            });
            return obj;
          });
          setOutput(JSON.stringify(data, null, minify ? 0 : 2));
        } else {
          setOutput(JSON.stringify(rows, null, minify ? 0 : 2));
        }
      } else {
        const csvResult = jsonToCsv(input);
        setOutput(csvResult);
        const lines = csvResult.split("\n").filter((l) => l.trim() !== "");
        setRowsCount(lines.length);
        setColsCount(lines[0] ? lines[0].split(",").length : 0);
      }
    } catch (err) {
      setError((err as Error).message);
      setOutput("");
      setRowsCount(null);
      setColsCount(null);
    }
  }, [input, mode, firstRowAsHeaders, minify]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setInput(newMode === "csv2json" ? SAMPLE_CSV : SAMPLE_JSON);
  };

  const handleDownload = () => {
    const ext = mode === "csv2json" ? "json" : "csv";
    const mime = mode === "csv2json" ? "application/json" : "text/csv";
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Conversion Mode:</span>
        <span className="text-accent font-bold uppercase">{mode === "csv2json" ? "CSV → JSON" : "JSON → CSV"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Rows Count:</span>
        <span className="text-text-primary">{rowsCount !== null ? rowsCount : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Columns Count:</span>
        <span className="text-text-primary">{colsCount !== null ? colsCount : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Status:</span>
        <span className={error ? "text-error font-bold" : "text-success font-bold"}>
          {error ? "ERROR" : "VALID"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="csv-json" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Mode & Options Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 p-1 bg-bg-page rounded-lg border border-border-subtle">
            <button
              onClick={() => handleModeSwitch("csv2json")}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                mode === "csv2json"
                  ? "bg-accent text-bg-page"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              CSV → JSON
            </button>
            <button
              onClick={() => handleModeSwitch("json2csv")}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                mode === "json2csv"
                  ? "bg-accent text-bg-page"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              JSON → CSV
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {mode === "csv2json" && (
              <>
                <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={firstRowAsHeaders}
                    onChange={(e) => setFirstRowAsHeaders(e.target.checked)}
                    className="accent-accent cursor-pointer"
                  />
                  <span>First row as headers</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                  <input
                    type="checkbox"
                    checked={minify}
                    onChange={(e) => setMinify(e.target.checked)}
                    className="accent-accent cursor-pointer"
                  />
                  <span>Minify JSON</span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">
              {mode === "csv2json" ? "CSV Source Data" : "JSON Source Array"}
            </span>
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
            placeholder={
              mode === "csv2json"
                ? "Paste CSV text here..."
                : "Paste JSON array here..."
            }
            rows={7}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Output Area */}
        {output && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                {mode === "csv2json" ? "JSON Converted Result" : "CSV Converted Result"}
              </span>
              <div className="flex items-center gap-2">
                <CopyButton text={output} label="Copy Output" />
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2.5 py-0.5 rounded border border-border-subtle bg-bg-page text-text-secondary hover:text-accent hover:border-accent transition-colors text-xs font-mono"
                >
                  [Download]
                </button>
              </div>
            </div>
            <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-80 overflow-y-auto leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
