"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const pipeCount = (firstLine.match(/\|/g) || []).length;

  const max = Math.max(commaCount, semicolonCount, tabCount, pipeCount);
  if (max === 0) return ",";
  if (max === tabCount) return "\t";
  if (max === semicolonCount) return ";";
  if (max === pipeCount) return "|";
  return ",";
}

function parseCsv(csvText: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell !== "" || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== "")) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function jsonToCsv(jsonText: string): string {
  const parsed = JSON.parse(jsonText);

  if (Array.isArray(parsed) && parsed.length > 0) {
    // Array of objects
    if (typeof parsed[0] === "object" && parsed[0] !== null && !Array.isArray(parsed[0])) {
      const headers = Array.from(
        new Set(parsed.flatMap((obj) => Object.keys(obj as Record<string, unknown>)))
      );

      const headerRow = headers.map(escapeCsvValue).join(",");
      const dataRows = parsed.map((item) => {
        const obj = item as Record<string, unknown>;
        return headers.map((h) => escapeCsvValue(String(obj[h] ?? ""))).join(",");
      });

      return [headerRow, ...dataRows].join("\n");
    }

    // 2D Array
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

export default function CsvJsonClient() {
  const [mode, setMode] = useState<"csv-to-json" | "json-to-csv">("csv-to-json");
  const [input, setInput] = useState(
    'id,name,role,active\n1,"Alice",admin,true\n2,"Bob, Jr.",developer,false\n3,"Charlie",designer,true'
  );
  const [output, setOutput] = useState("");
  const [jsonFormat, setJsonFormat] = useState<"objects" | "arrays">("objects");
  const [minify, setMinify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const convertData = useCallback(() => {
    setError(null);
    if (!input.trim()) {
      setOutput("");
      setRowCount(0);
      return;
    }

    try {
      if (mode === "csv-to-json") {
        const delimiter = detectDelimiter(input);
        const rows = parseCsv(input, delimiter);

        if (rows.length === 0) {
          setOutput("[]");
          setRowCount(0);
          return;
        }

        setRowCount(rows.length);

        if (jsonFormat === "objects") {
          const headers = rows[0];
          const data = rows.slice(1).map((row) => {
            const obj: Record<string, string | number | boolean | null> = {};
            headers.forEach((h, idx) => {
              const val = row[idx] ?? "";
              // Auto-cast booleans and numbers if clean
              if (val.toLowerCase() === "true") obj[h] = true;
              else if (val.toLowerCase() === "false") obj[h] = false;
              else if (val === "" || val.toLowerCase() === "null") obj[h] = null;
              else if (!isNaN(Number(val)) && val.trim() !== "") obj[h] = Number(val);
              else obj[h] = val;
            });
            return obj;
          });
          setOutput(JSON.stringify(data, null, minify ? 0 : 2));
        } else {
          setOutput(JSON.stringify(rows, null, minify ? 0 : 2));
        }
      } else {
        const csv = jsonToCsv(input);
        setOutput(csv);
        setRowCount(csv.split("\n").length);
      }
    } catch (err) {
      setError((err as Error).message);
      setOutput("");
    }
  }, [input, mode, jsonFormat, minify]);

  useEffect(() => {
    const t = setTimeout(convertData, 100);
    return () => clearTimeout(t);
  }, [convertData]);

  const handleDownload = () => {
    if (!output) return;
    const mime = mode === "csv-to-json" ? "application/json" : "text/csv";
    const ext = mode === "csv-to-json" ? "json" : "csv";
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Rows</p>
        <p className="text-text-primary font-mono">{rowCount || "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Mode</p>
        <p className="text-text-primary font-mono uppercase text-xs">{mode}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">CSV ↔ JSON Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Bidirectional table-to-JSON and JSON-to-CSV parser with delimiter detection.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="mb-6 flex rounded border border-border-subtle bg-bg-page p-1">
            <button
              onClick={() => {
                setMode("csv-to-json");
                setInput('name,role,age\n"Alice",admin,28\n"Bob",developer,34');
              }}
              className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${
                mode === "csv-to-json"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ mode --csv-to-json
            </button>
            <button
              onClick={() => {
                setMode("json-to-csv");
                setInput('[\n  { "name": "Alice", "role": "admin", "age": 28 },\n  { "name": "Bob", "role": "developer", "age": 34 }\n]');
              }}
              className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${
                mode === "json-to-csv"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ mode --json-to-csv
            </button>
          </div>

          {/* Extra options for CSV to JSON */}
          {mode === "csv-to-json" && (
            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-mono rounded border border-border-subtle bg-bg-page p-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                <input
                  type="radio"
                  name="structure"
                  checked={jsonFormat === "objects"}
                  onChange={() => setJsonFormat("objects")}
                  className="accent-accent"
                />
                Array of Objects
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                <input
                  type="radio"
                  name="structure"
                  checked={jsonFormat === "arrays"}
                  onChange={() => setJsonFormat("arrays")}
                  className="accent-accent"
                />
                2D Array
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary ml-auto">
                <input
                  type="checkbox"
                  checked={minify}
                  onChange={(e) => setMinify(e.target.checked)}
                  className="accent-accent"
                />
                Minify Output
              </label>
            </div>
          )}

          {/* Input Area */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary">
                {mode === "csv-to-json" ? "CSV Input" : "JSON Input"}
              </label>
              <button
                onClick={() => setInput("")}
                className="text-xs text-text-muted hover:text-text-primary font-mono"
              >
                clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === "csv-to-json" ? "Paste CSV text..." : "Paste JSON array..."}
              className="input-field min-h-[140px] resize-y font-mono text-xs"
            />
          </div>

          {error && <p className="mb-4 text-sm text-error font-mono">{error}</p>}

          {/* Output Area */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary">
                {mode === "csv-to-json" ? "JSON Output" : "CSV Output"}
              </label>
              <div className="flex items-center gap-2">
                <CopyButton text={output} label="copy" />
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
                >
                  Download .{mode === "csv-to-json" ? "json" : "csv"}
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              placeholder="Converted output will appear here..."
              className="output-field min-h-[180px] resize-y font-mono text-xs text-accent"
            />
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="csv-json" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="csv-json" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
