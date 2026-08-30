"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type SyntaxType = "json" | "js" | "sql" | "regex" | "shell" | "html";

function escapeString(str: string, type: SyntaxType): string {
  switch (type) {
    case "json":
      return JSON.stringify(str).slice(1, -1);
    case "js":
      return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/`/g, "\\`")
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
    case "sql":
      return str.replace(/'/g, "''").replace(/\\/g, "\\\\");
    case "regex":
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    case "shell":
      return str.replace(/(["\\$`!*?~<>|&;()[\]{}^])/g, "\\$1");
    case "html":
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
  }
}

function unescapeString(str: string, type: SyntaxType): string {
  switch (type) {
    case "json":
    case "js":
      try {
        return JSON.parse(`"${str.replace(/"/g, '\\"')}"`);
      } catch {
        return str
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, "\\");
      }
    case "sql":
      return str.replace(/''/g, "'").replace(/\\\\/g, "\\");
    case "regex":
    case "shell":
      return str.replace(/\\(.)/g, "$1");
    case "html":
      return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'");
  }
}

export default function StringEscapeClient() {
  const [input, setInput] = useState(`Hello "World"!\nSpecial characters: $VAR, [0-9]+, 'O'Connor' & <tag>`);
  const [syntax, setSyntax] = useState<SyntaxType>("json");
  const [mode, setMode] = useState<"escape" | "unescape">("escape");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "escape" ? escapeString(input, syntax) : unescapeString(input, syntax);
  }, [input, syntax, mode]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Operation</p>
        <p className="text-accent font-mono uppercase text-xs font-bold">{mode}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Target Syntax</p>
        <p className="text-text-primary font-mono uppercase text-xs">{syntax}</p>
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
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">String & Regex Escaper / Unescaper</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Escape special characters or unescape raw strings for JSON, JavaScript, SQL, Regex, Shell, and HTML.
            </p>
          </div>

          {/* Mode & Syntax Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-bg-page rounded-lg border border-border-subtle">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-border-subtle">
              <button
                type="button"
                onClick={() => setMode("escape")}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  mode === "escape"
                    ? "bg-accent-soft text-accent font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Escape
              </button>
              <button
                type="button"
                onClick={() => setMode("unescape")}
                className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                  mode === "unescape"
                    ? "bg-accent-soft text-accent font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Unescape
              </button>
            </div>

            {/* Syntax Tabs */}
            <div className="flex flex-wrap items-center gap-1">
              {(
                [
                  { id: "json", label: "JSON" },
                  { id: "js", label: "JavaScript" },
                  { id: "sql", label: "SQL" },
                  { id: "regex", label: "RegEx" },
                  { id: "shell", label: "Shell / Bash" },
                  { id: "html", label: "HTML" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSyntax(tab.id)}
                  className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                    syntax === tab.id
                      ? "bg-accent-soft text-accent border-accent font-semibold"
                      : "bg-bg-card border-border-subtle text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                {mode === "escape" ? "Raw Input Text:" : "Escaped Input Text:"}
              </label>
              <button
                type="button"
                onClick={() => setInput("")}
                className="text-xs font-mono text-text-muted hover:text-error transition-colors"
              >
                [Clear]
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to process..."
              rows={6}
              className="w-full rounded-lg bg-bg-page border border-border-subtle p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y"
              spellCheck={false}
            />
          </div>

          {/* Output Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                {mode === "escape" ? "Escaped Output:" : "Unescaped Output:"}
              </label>
              <CopyButton text={output} />
            </div>
            <div className="relative rounded-lg bg-bg-page border border-border-subtle p-4 font-mono text-xs text-text-primary overflow-x-auto min-h-[120px]">
              <pre className="whitespace-pre-wrap">{output || "// Output will appear here"}</pre>
            </div>
          </div>
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden lg:block">
          <InfoPanel toolId="string-escape" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="string-escape" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
