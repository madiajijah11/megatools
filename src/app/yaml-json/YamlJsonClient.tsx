"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

export default function YamlJsonClient() {
  const [mode, setMode] = useState<"yaml-to-json" | "json-to-yaml">("yaml-to-json");
  const [input, setInput] = useState(
    "name: megatools\nversion: 2.0\nfeatures:\n  - client-side\n  - privacy-first\n  - zero-server\nconfig:\n  port: 3000\n  debug: true"
  );
  const [output, setOutput] = useState("");
  const [minify, setMinify] = useState(false);
  const [indent, setIndent] = useState<number>(2);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const convertData = useCallback(() => {
    setError(null);
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (mode === "yaml-to-json") {
        const parsed = yamlLoad(input);
        if (parsed === undefined) {
          setOutput("");
          return;
        }
        setOutput(JSON.stringify(parsed, null, minify ? 0 : indent));
      } else {
        const parsed = JSON.parse(input);
        const yml = yamlDump(parsed, { indent });
        setOutput(yml);
      }
    } catch (err) {
      setError((err as Error).message);
      setOutput("");
    }
  }, [input, mode, minify, indent]);

  useEffect(() => {
    const t = setTimeout(convertData, 100);
    return () => clearTimeout(t);
  }, [convertData]);

  const handleDownload = () => {
    if (!output) return;
    const ext = mode === "yaml-to-json" ? "json" : "yaml";
    const mime = mode === "yaml-to-json" ? "application/json" : "text/yaml";
    const blob = new Blob([output], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `config.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Status</p>
        <p className={`font-mono ${error ? "text-error" : "text-success"}`}>
          {error ? "SYNTAX ERR" : "VALID"}
        </p>
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
              <span className="gradient-text">YAML ↔ JSON Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Convert configurations between YAML and JSON with live syntax checking.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="mb-6 flex rounded border border-border-subtle bg-bg-page p-1">
            <button
              onClick={() => {
                setMode("yaml-to-json");
                setInput("service: api\nreplicas: 3\nenvironment:\n  NODE_ENV: production");
              }}
              className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${
                mode === "yaml-to-json"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ mode --yaml-to-json
            </button>
            <button
              onClick={() => {
                setMode("json-to-yaml");
                setInput('{\n  "service": "api",\n  "replicas": 3,\n  "environment": {\n    "NODE_ENV": "production"\n  }\n}');
              }}
              className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${
                mode === "json-to-yaml"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ mode --json-to-yaml
            </button>
          </div>

          {/* Controls */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono rounded border border-border-subtle bg-bg-page p-3">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">Indent:</span>
              <select
                value={indent}
                onChange={(e) => setIndent(Number(e.target.value))}
                className="input-field py-1 text-xs w-28"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>

            {mode === "yaml-to-json" && (
              <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                <input
                  type="checkbox"
                  checked={minify}
                  onChange={(e) => setMinify(e.target.checked)}
                  className="accent-accent"
                />
                Minify JSON Output
              </label>
            )}
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary">
                {mode === "yaml-to-json" ? "YAML Input" : "JSON Input"}
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
              placeholder={mode === "yaml-to-json" ? "Paste YAML config..." : "Paste JSON..."}
              className="input-field min-h-[150px] resize-y font-mono text-xs"
            />
          </div>

          {error && (
            <div className="mb-4 rounded border border-error/30 bg-error/10 p-3 text-xs font-mono text-error">
              {error}
            </div>
          )}

          {/* Output Area */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary">
                {mode === "yaml-to-json" ? "JSON Output" : "YAML Output"}
              </label>
              <div className="flex items-center gap-2">
                <CopyButton text={output} label="copy" />
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
                >
                  Download .{mode === "yaml-to-json" ? "json" : "yaml"}
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
          <InfoPanel toolId="yaml-json" stats={stats} />
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
        <InfoPanel toolId="yaml-json" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
