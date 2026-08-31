"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type Alignment = "left" | "center" | "right";
type ExportFormat = "markdown" | "html" | "latex" | "csv";

const INITIAL_HEADERS = ["Feature", "Standard Plan", "Pro Plan", "Enterprise"];
const INITIAL_ROWS = [
  ["Browser Execution", "Yes", "Yes", "Yes"],
  ["Max File Size", "50 MB", "500 MB", "Unlimited"],
  ["Custom Branding", "No", "Yes", "Yes"],
  ["API Rate Limit", "100 req/min", "1,000 req/min", "Custom"],
];
const INITIAL_ALIGNMENTS: Alignment[] = ["left", "center", "center", "center"];

export default function MarkdownTableClient() {
  const [headers, setHeaders] = useState<string[]>(INITIAL_HEADERS);
  const [rows, setRows] = useState<string[][]>(INITIAL_ROWS);
  const [alignments, setAlignments] = useState<Alignment[]>(INITIAL_ALIGNMENTS);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("markdown");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Add Row
  const addRow = () => {
    setRows([...rows, new Array(headers.length).fill("")]);
  };

  // Remove Row
  const removeRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== rowIndex));
  };

  // Add Column
  const addColumn = () => {
    setHeaders([...headers, `Col ${headers.length + 1}`]);
    setRows(rows.map((row) => [...row, ""]));
    setAlignments([...alignments, "left"]);
  };

  // Remove Column
  const removeColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== colIndex));
    setRows(rows.map((row) => row.filter((_, i) => i !== colIndex)));
    setAlignments(alignments.filter((_, i) => i !== colIndex));
  };

  // Update cell
  const updateCell = (rowIndex: number, colIndex: number, val: string) => {
    const updated = [...rows];
    updated[rowIndex] = [...updated[rowIndex]];
    updated[rowIndex][colIndex] = val;
    setRows(updated);
  };

  // Update header
  const updateHeader = (colIndex: number, val: string) => {
    const updated = [...headers];
    updated[colIndex] = val;
    setHeaders(updated);
  };

  // Toggle alignment
  const toggleAlignment = (colIndex: number) => {
    const order: Alignment[] = ["left", "center", "right"];
    const current = alignments[colIndex] || "left";
    const next = order[(order.indexOf(current) + 1) % order.length];
    const updated = [...alignments];
    updated[colIndex] = next;
    setAlignments(updated);
  };

  // Generate outputs
  const generatedCode = useMemo(() => {
    if (exportFormat === "markdown") {
      const headerLine = `| ${headers.map((h) => h || " ").join(" | ")} |`;
      const alignLine = `| ${alignments
        .map((a) => {
          if (a === "center") return ":---:";
          if (a === "right") return "---:";
          return ":---";
        })
        .join(" | ")} |`;
      const rowLines = rows.map((r) => `| ${r.map((c) => c || " ").join(" | ")} |`).join("\n");
      return `${headerLine}\n${alignLine}\n${rowLines}`;
    }

    if (exportFormat === "html") {
      let html = `<table border="1" cellpadding="8" cellspacing="0">\n  <thead>\n    <tr>\n`;
      headers.forEach((h, i) => {
        html += `      <th align="${alignments[i]}">${h || ""}</th>\n`;
      });
      html += `    </tr>\n  </thead>\n  <tbody>\n`;
      rows.forEach((row) => {
        html += `    <tr>\n`;
        row.forEach((cell, i) => {
          html += `      <td align="${alignments[i]}">${cell || ""}</td>\n`;
        });
        html += `    </tr>\n`;
      });
      html += `  </tbody>\n</table>`;
      return html;
    }

    if (exportFormat === "latex") {
      const alignCols = alignments.map((a) => a[0]).join("");
      let latex = `\\begin{table}[h]\n\\centering\n\\begin{tabular}{${alignCols}}\n\\hline\n`;
      latex += `${headers.join(" & ")} \\\\\n\\hline\n`;
      rows.forEach((row) => {
        latex += `${row.join(" & ")} \\\\\n`;
      });
      latex += `\\hline\n\\end{tabular}\n\\end{table}`;
      return latex;
    }

    if (exportFormat === "csv") {
      const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
      const hLine = headers.map(escapeCsv).join(",");
      const rLines = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
      return `${hLine}\n${rLines}`;
    }

    return "";
  }, [headers, rows, alignments, exportFormat]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Dimensions</p>
        <p className="text-accent font-mono text-xs font-bold">
          {rows.length}R × {headers.length}C
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Export</p>
        <p className="text-text-primary font-mono text-xs uppercase">{exportFormat}</p>
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
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Markdown Table Generator & Editor</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Visually edit and generate clean GitHub-Flavored Markdown, HTML, LaTeX, and CSV tables.
            </p>
          </div>

          {/* Grid Toolbar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-bg-page border border-border-subtle">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={addRow}
                className="px-3 py-1.5 text-xs font-mono rounded bg-bg-card border border-border-subtle hover:border-accent text-text-primary transition-colors flex items-center gap-1"
              >
                + Add Row
              </button>
              <button
                type="button"
                onClick={addColumn}
                className="px-3 py-1.5 text-xs font-mono rounded bg-bg-card border border-border-subtle hover:border-accent text-text-primary transition-colors flex items-center gap-1"
              >
                + Add Column
              </button>
            </div>

            <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-border-subtle">
              {(
                [
                  { id: "markdown", label: "Markdown" },
                  { id: "html", label: "HTML" },
                  { id: "latex", label: "LaTeX" },
                  { id: "csv", label: "CSV" },
                ] as const
              ).map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setExportFormat(fmt.id)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    exportFormat === fmt.id
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="mb-6 overflow-x-auto rounded-xl border border-border-subtle bg-bg-page p-4">
            <table className="w-full border-collapse font-mono text-xs">
              <thead>
                <tr>
                  <th className="p-1 w-8 text-center text-text-muted font-normal">#</th>
                  {headers.map((h, cIdx) => (
                    <th key={cIdx} className="p-1 min-w-[140px]">
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          type="text"
                          value={h}
                          onChange={(e) => updateHeader(cIdx, e.target.value)}
                          className="w-full px-2 py-1.5 rounded bg-bg-card border border-border-subtle text-accent font-bold focus:border-accent focus:outline-none"
                        />
                        <button
                          type="button"
                          title="Toggle text alignment"
                          onClick={() => toggleAlignment(cIdx)}
                          className="px-1.5 py-1 rounded bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary uppercase text-[10px]"
                        >
                          {alignments[cIdx] === "left" ? "⇤" : alignments[cIdx] === "center" ? "⇥⇤" : "⇥"}
                        </button>
                        {headers.length > 1 && (
                          <button
                            type="button"
                            title="Remove Column"
                            onClick={() => removeColumn(cIdx)}
                            className="px-1.5 py-1 rounded bg-bg-card border border-border-subtle text-text-muted hover:text-error text-[10px]"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-1 text-center text-text-muted">
                      <div className="flex items-center justify-center gap-1">
                        <span>{rIdx + 1}</span>
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(rIdx)}
                            className="text-text-muted hover:text-error"
                            title="Remove Row"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-1">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                          className={`w-full px-2 py-1.5 rounded bg-bg-card border border-border-subtle text-text-primary focus:border-accent focus:outline-none text-${alignments[cIdx]}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Generated Code Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                Generated {exportFormat.toUpperCase()} Code:
              </label>
              <CopyButton text={generatedCode} />
            </div>
            <div className="p-3.5 bg-bg-page border border-border-subtle rounded-xl font-mono text-xs text-text-primary overflow-x-auto max-h-[220px] overflow-y-auto">
              <pre className="whitespace-pre">{generatedCode}</pre>
            </div>
          </div>
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="markdown-table" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="markdown-table" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
