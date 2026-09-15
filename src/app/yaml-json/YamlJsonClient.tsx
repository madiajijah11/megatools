"use client";

import { useState, useCallback, useEffect } from "react";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Mode = "yaml2json" | "json2yaml";

const SAMPLE_YAML = `server:
  host: 127.0.0.1
  port: 8080
  ssl:
    enabled: true
    cert: /etc/ssl/cert.pem
services:
  - name: auth
    replicas: 3
    env:
      NODE_ENV: production
  - name: api
    replicas: 5`;

const SAMPLE_JSON = `{
  "server": {
    "host": "127.0.0.1",
    "port": 8080,
    "ssl": {
      "enabled": true,
      "cert": "/etc/ssl/cert.pem"
    }
  },
  "services": [
    {
      "name": "auth",
      "replicas": 3,
      "env": {
        "NODE_ENV": "production"
      }
    },
    {
      "name": "api",
      "replicas": 5
    }
  ]
}`;

export default function YamlJsonClient() {
  const [mode, setMode] = useState<Mode>("yaml2json");
  const [input, setInput] = useState(SAMPLE_YAML);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<number>(2);

  const convert = useCallback(() => {
    setError(null);
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (mode === "yaml2json") {
        const parsed = yamlLoad(input);
        if (parsed === undefined) {
          setOutput("");
          return;
        }
        setOutput(JSON.stringify(parsed, null, indent));
      } else {
        const parsed = JSON.parse(input);
        setOutput(yamlDump(parsed, { indent }));
      }
    } catch (err) {
      setError((err as Error).message);
      setOutput("");
    }
  }, [input, mode, indent]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode);
    setInput(newMode === "yaml2json" ? SAMPLE_YAML : SAMPLE_JSON);
  };

  const handleDownload = () => {
    const ext = mode === "yaml2json" ? "json" : "yaml";
    const mime = mode === "yaml2json" ? "application/json" : "text/yaml";
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `config.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Conversion:</span>
        <span className="text-accent font-bold uppercase">{mode === "yaml2json" ? "YAML → JSON" : "JSON → YAML"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Size:</span>
        <span className="text-text-primary">{input.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Output Size:</span>
        <span className="text-text-primary">{output ? `${output.length} chars` : "—"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Syntax Check:</span>
        <span className={error ? "text-error font-bold" : "text-success font-bold"}>
          {error ? "SYNTAX ERROR" : "VALID"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="yaml-json" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Mode Selector & Indent */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 p-1 bg-bg-page rounded-lg border border-border-subtle">
            <button
              onClick={() => handleModeSwitch("yaml2json")}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                mode === "yaml2json"
                  ? "bg-accent text-bg-page"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              YAML → JSON
            </button>
            <button
              onClick={() => handleModeSwitch("json2yaml")}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                mode === "json2yaml"
                  ? "bg-accent text-bg-page"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              JSON → YAML
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-text-muted">Indent:</span>
            {[2, 4].map((n) => (
              <button
                key={n}
                onClick={() => setIndent(n)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  indent === n
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border-subtle text-text-muted hover:text-text-secondary"
                }`}
              >
                {n} spaces
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">
              {mode === "yaml2json" ? "YAML Source Document" : "JSON Source Document"}
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
              mode === "yaml2json"
                ? "Paste YAML configuration here..."
                : "Paste JSON configuration here..."
            }
            rows={8}
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

        {/* Output */}
        {output && (
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">
                {mode === "yaml2json" ? "JSON Converted Output" : "YAML Converted Output"}
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
