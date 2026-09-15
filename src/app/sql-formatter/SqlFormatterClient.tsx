"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useCallback, useEffect } from "react";

import { format as formatSql, type FormatOptionsWithLanguage } from "sql-formatter";


import CopyButton from "@/components/CopyButton";

type Dialect = "sql" | "postgresql" | "mysql" | "sqlite" | "transactsql" | "bigquery";
type KeywordCase = "upper" | "lower" | "preserve";

const SAMPLE_SQL = `select u.id, u.username, u.email, count(o.id) as total_orders, sum(o.amount) as total_spent from users u left join orders o on u.id = o.user_id where u.active = 1 and u.created_at >= '2026-01-01' group by u.id, u.username, u.email having count(o.id) > 5 order by total_spent desc limit 50;`;

export default function SqlFormatterClient() {
  const [input, setInput] = useState(SAMPLE_SQL);
  const [output, setOutput] = useState("");
  const [dialect, setDialect] = useState<Dialect>("sql");
  const [keywordCase, setKeywordCase] = useState<KeywordCase>("upper");
  const [tabWidth, setTabWidth] = useState<number>(2);
  const [mode, setMode] = useState<"beautify" | "minify">("beautify");
  const [error, setError] = useState<string | null>(null);

  const formatQuery = useCallback(() => {
    setError(null);
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (mode === "minify") {
        // Compact minification: remove comments & collapse whitespace
        const minified = input
          .replace(/--.*$/gm, "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/\s+/g, " ")
          .trim();
        setOutput(minified);
      } else {
        const options: FormatOptionsWithLanguage = {
          language: dialect,
          keywordCase: keywordCase,
          tabWidth: tabWidth,
          useTabs: false,
        };
        const formatted = formatSql(input, options);
        setOutput(formatted);
      }
    } catch (err) {
      setError(`Format error: ${(err as Error).message}`);
      setOutput("");
    }
  }, [input, dialect, keywordCase, tabWidth, mode]);

  useEffect(() => {
    const t = setTimeout(formatQuery, 100);
    return () => clearTimeout(t);
  }, [formatQuery]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "query.sql";
    link.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = output ? output.split("\n").length : 0;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Lines</p>
        <p className="text-text-primary font-mono">{lineCount || "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Dialect</p>
        <p className="text-text-primary font-mono uppercase text-xs">{dialect}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="sql-formatter" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Controls toolbar */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono rounded border border-border-subtle bg-bg-page p-3">
            <div>
              <label className="text-text-muted block mb-1">MODE</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setMode("beautify")}
                  className={`flex-1 py-1 px-2 rounded border text-xs transition-colors ${
                    mode === "beautify"
                      ? "border-accent bg-accent text-bg-page font-bold"
                      : "border-border-subtle bg-bg-card text-text-secondary"
                  }`}
                >
                  Beautify
                </button>
                <button
                  onClick={() => setMode("minify")}
                  className={`flex-1 py-1 px-2 rounded border text-xs transition-colors ${
                    mode === "minify"
                      ? "border-accent bg-accent text-bg-page font-bold"
                      : "border-border-subtle bg-bg-card text-text-secondary"
                  }`}
                >
                  Minify
                </button>
              </div>
            </div>

            <div>
              <label className="text-text-muted block mb-1">DIALECT</label>
              <select
                value={dialect}
                disabled={mode === "minify"}
                onChange={(e) => setDialect(e.target.value as Dialect)}
                className="input-field py-1 text-xs"
              >
                <option value="sql">Standard SQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="transactsql">T-SQL (MS SQL)</option>
                <option value="bigquery">BigQuery</option>
              </select>
            </div>

            <div>
              <label className="text-text-muted block mb-1">KEYWORD CASE</label>
              <select
                value={keywordCase}
                disabled={mode === "minify"}
                onChange={(e) => setKeywordCase(e.target.value as KeywordCase)}
                className="input-field py-1 text-xs"
              >
                <option value="upper">UPPERCASE</option>
                <option value="lower">lowercase</option>
                <option value="preserve">Preserve</option>
              </select>
            </div>

            <div>
              <label className="text-text-muted block mb-1">INDENT</label>
              <select
                value={tabWidth}
                disabled={mode === "minify"}
                onChange={(e) => setTabWidth(Number(e.target.value))}
                className="input-field py-1 text-xs"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary font-mono">
                SQL Input Query
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
              placeholder="Paste SQL query here..."
              className="input-field min-h-[140px] resize-y font-mono text-xs"
            />
          </div>

          {error && <p className="mb-4 text-xs text-error font-mono">{error}</p>}

          {/* Output Area */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary font-mono">
                Formatted SQL
              </label>
              <div className="flex items-center gap-2">
                <CopyButton text={output} label="copy sql" />
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
                >
                  Download .sql
                </button>
              </div>
            </div>
            <textarea
              readOnly
              value={output}
              placeholder="Formatted SQL will appear here..."
              className="output-field min-h-[200px] resize-y font-mono text-xs text-accent whitespace-pre"
            />
          </div>
      </div>
    </ToolLayout>
  );
}