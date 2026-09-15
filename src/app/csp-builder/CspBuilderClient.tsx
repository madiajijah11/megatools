"use client";

import { useState, useMemo, useCallback } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface Directive {
  name: string;
  description: string;
  values: string[];
  enabled: boolean;
  requiredForHardening?: boolean;
}

const COMMON_SOURCES = ["'self'", "'none'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'", "data:", "https:", "blob:"];

const PRESETS = {
  strictSpa: {
    name: "Strict Modern SPA (Next.js / React)",
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'wasm-unsafe-eval'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:", "blob:"],
      "font-src": ["'self'", "https:", "data:"],
      "connect-src": ["'self'", "https:", "wss:"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  },
  ultraHardened: {
    name: "Zero-Trust Military Hardened (Nonce Required)",
    directives: {
      "default-src": ["'none'"],
      "script-src": ["'self'", "'strict-dynamic'"],
      "style-src": ["'self'"],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'"],
      "connect-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'none'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  },
  analyticsVercel: {
    name: "Vercel + Google Analytics & Fonts",
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://va.vercel-scripts.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "img-src": ["'self'", "data:", "https:", "https://www.google-analytics.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "connect-src": ["'self'", "https://www.google-analytics.com", "https://vitals.vercel-insights.com"],
      "object-src": ["'none'"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    },
  },
  apiOnly: {
    name: "API Server / Backend JSON Only",
    directives: {
      "default-src": ["'none'"],
      "frame-ancestors": ["'none'"],
      "object-src": ["'none'"],
      "base-uri": ["'none'"],
    },
  },
};

type ExportFormat = "header" | "meta" | "nginx" | "apache" | "vercel" | "nextjs";

export default function CspBuilderClient() {
  const [directives, setDirectives] = useState<Record<string, { values: string[]; enabled: boolean }>>({
    "default-src": { values: ["'self'"], enabled: true },
    "script-src": { values: ["'self'", "'wasm-unsafe-eval'"], enabled: true },
    "style-src": { values: ["'self'", "'unsafe-inline'"], enabled: true },
    "img-src": { values: ["'self'", "data:", "https:"], enabled: true },
    "font-src": { values: ["'self'", "https:", "data:"], enabled: true },
    "connect-src": { values: ["'self'", "https:"], enabled: true },
    "object-src": { values: ["'none'"], enabled: true },
    "media-src": { values: ["'self'"], enabled: false },
    "frame-src": { values: ["'none'"], enabled: false },
    "frame-ancestors": { values: ["'none'"], enabled: true },
    "base-uri": { values: ["'self'"], enabled: true },
    "form-action": { values: ["'self'"], enabled: true },
    "upgrade-insecure-requests": { values: [], enabled: true },
  });

  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [exportFormat, setExportFormat] = useState<ExportFormat>("header");
  const [generatedNonce, setGeneratedNonce] = useState<string>("");

  const generateRandomNonce = useCallback(() => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const nonce = btoa(bin);
    setGeneratedNonce(nonce);
  }, []);

  const addNonceToScripts = () => {
    if (!generatedNonce) generateRandomNonce();
    const nonceTag = `'nonce-${generatedNonce || "generate_first"}'`;
    setDirectives((prev) => {
      const current = prev["script-src"] || { values: [], enabled: true };
      if (current.values.includes(nonceTag)) return prev;
      return {
        ...prev,
        "script-src": {
          ...current,
          enabled: true,
          values: [...current.values.filter((v) => !v.startsWith("'nonce-")), nonceTag],
        },
      };
    });
  };

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setDirectives((prev) => {
      const next: Record<string, { values: string[]; enabled: boolean }> = {};
      Object.keys(prev).forEach((key) => {
        if (key in preset.directives) {
          next[key] = {
            values: preset.directives[key as keyof typeof preset.directives] as string[],
            enabled: true,
          };
        } else {
          next[key] = { values: prev[key].values, enabled: false };
        }
      });
      return next;
    });
  };

  const toggleDirective = (name: string) => {
    setDirectives((prev) => ({
      ...prev,
      [name]: { ...prev[name], enabled: !prev[name].enabled },
    }));
  };

  const toggleValue = (directive: string, value: string) => {
    setDirectives((prev) => {
      const current = prev[directive];
      const exists = current.values.includes(value);
      let newVals = exists
        ? current.values.filter((v) => v !== value)
        : [...current.values, value];

      // Handle 'none' exclusive logic
      if (value === "'none'" && !exists) {
        newVals = ["'none'"];
      } else if (value !== "'none'" && exists === false) {
        newVals = newVals.filter((v) => v !== "'none'");
      }

      return {
        ...prev,
        [directive]: { ...current, values: newVals },
      };
    });
  };

  const addCustomValue = (directive: string) => {
    const val = (customInputs[directive] || "").trim();
    if (!val) return;
    setDirectives((prev) => {
      const current = prev[directive];
      if (current.values.includes(val)) return prev;
      return {
        ...prev,
        [directive]: {
          ...current,
          values: current.values.filter((v) => v !== "'none'").concat(val),
        },
      };
    });
    setCustomInputs((prev) => ({ ...prev, [directive]: "" }));
  };

  // Compile CSP string
  const rawCspString = useMemo(() => {
    const parts: string[] = [];
    Object.entries(directives).forEach(([name, config]) => {
      if (!config.enabled) return;
      if (name === "upgrade-insecure-requests") {
        parts.push(name);
      } else if (config.values.length > 0) {
        parts.push(`${name} ${config.values.join(" ")}`);
      }
    });
    return parts.join("; ");
  }, [directives]);

  // Security Audit
  const auditWarnings = useMemo(() => {
    const warnings: { level: "error" | "warning" | "info"; msg: string }[] = [];
    const scriptSrc = directives["script-src"];
    const objectSrc = directives["object-src"];

    if (scriptSrc?.enabled && scriptSrc.values.includes("'unsafe-eval'")) {
      warnings.push({
        level: "warning",
        msg: "'unsafe-eval' allows eval() and setTimeout strings, reducing XSS resilience.",
      });
    }

    if (scriptSrc?.enabled && scriptSrc.values.includes("'unsafe-inline'")) {
      warnings.push({
        level: "error",
        msg: "'unsafe-inline' in script-src allows arbitrary inline script injection.",
      });
    }

    if (!objectSrc?.enabled || !objectSrc.values.includes("'none'")) {
      warnings.push({
        level: "error",
        msg: "Missing object-src 'none' — plugins (Flash/Java) can execute malicious code.",
      });
    }

    if (!directives["base-uri"]?.enabled) {
      warnings.push({
        level: "warning",
        msg: "Missing base-uri directive — attackers can hijack relative script paths.",
      });
    }

    if (!directives["frame-ancestors"]?.enabled) {
      warnings.push({
        level: "warning",
        msg: "Missing frame-ancestors — page vulnerable to clickjacking iframe embedding.",
      });
    }

    return warnings;
  }, [directives]);

  // Output formatting
  const formattedOutput = useMemo(() => {
    if (!rawCspString) return "";
    switch (exportFormat) {
      case "header":
        return `Content-Security-Policy: ${rawCspString};`;
      case "meta":
        return `<meta http-equiv="Content-Security-Policy" content="${rawCspString};">`;
      case "nginx":
        return `add_header Content-Security-Policy "${rawCspString};" always;`;
      case "apache":
        return `Header set Content-Security-Policy "${rawCspString};"`;
      case "vercel":
        return JSON.stringify(
          {
            headers: [
              {
                source: "/(.*)",
                headers: [{ key: "Content-Security-Policy", value: `${rawCspString};` }],
              },
            ],
          },
          null,
          2
        );
      case "nextjs":
        return (
          "// next.config.mjs\n" +
          "const nextConfig = {\n" +
          "  async headers() {\n" +
          "    return [\n" +
          "      {\n" +
          "        source: '/:path*',\n" +
          "        headers: [\n" +
          `          { key: 'Content-Security-Policy', value: '${rawCspString.replace(/'/g, "\\'")};' },\n` +
          "        ],\n" +
          "      },\n" +
          "    ];\n" +
          "  },\n" +
          "};\n" +
          "export default nextConfig;"
        );
      default:
        return rawCspString;
    }
  }, [rawCspString, exportFormat]);

  const enabledCount = Object.values(directives).filter((d) => d.enabled).length;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Active Directives:</span>
        <span className="text-accent font-bold">{enabledCount} / {Object.keys(directives).length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Security Audit:</span>
        <span
          className={`font-bold ${
            auditWarnings.some((w) => w.level === "error")
              ? "text-error"
              : auditWarnings.length > 0
              ? "text-warning"
              : "text-success"
          }`}
        >
          {auditWarnings.some((w) => w.level === "error")
            ? "CRITICAL WARNINGS"
            : auditWarnings.length > 0
            ? "MODERATE"
            : "HARDENED A+"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Generated Nonce:</span>
        <span className="text-text-primary truncate max-w-[120px]">
          {generatedNonce ? `${generatedNonce.slice(0, 10)}...` : "None"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="csp-builder" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Presets Bar */}
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2">
            Security Architecture Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => loadPreset(key)}
                className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                [{PRESETS[key].name}]
              </button>
            ))}
          </div>
        </div>

        {/* Cryptographic Nonce Generator */}
        <div className="p-3 rounded-lg border border-border-subtle bg-bg-page flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-accent block">Cryptographic Nonce Generator (128-bit)</span>
            <span className="text-text-muted text-[11px]">
              {generatedNonce ? `Active Nonce: ${generatedNonce}` : "Generate random CSP nonce for strict dynamic execution"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generateRandomNonce}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary text-xs"
            >
              Generate New Nonce
            </button>
            <button
              type="button"
              onClick={addNonceToScripts}
              className="px-2.5 py-1 rounded bg-accent text-bg-page font-bold text-xs hover:bg-accent-hover transition-colors"
            >
              + Inject into script-src
            </button>
          </div>
        </div>

        {/* Security Audit Warnings Box */}
        {auditWarnings.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {auditWarnings.map((w, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                  w.level === "error"
                    ? "border-error/30 bg-error/10 text-error"
                    : "border-warning/30 bg-warning/10 text-warning"
                }`}
              >
                <span className="font-bold shrink-0">{w.level === "error" ? "🚨 ERROR:" : "⚠️ WARN:"}</span>
                <span>{w.msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Directives Builder List */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <span className="text-xs font-semibold text-text-primary block">
            Directives Configuration Matrix ({enabledCount} Active)
          </span>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {Object.entries(directives).map(([name, config]) => (
              <div
                key={name}
                className={`p-3 rounded-lg border transition-colors ${
                  config.enabled
                    ? "border-border-subtle bg-bg-page"
                    : "border-border-subtle/40 bg-bg-page/40 opacity-50"
                }`}
              >
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-border-subtle/50">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={() => toggleDirective(name)}
                      className="accent-accent cursor-pointer"
                    />
                    <span className="text-xs font-bold text-accent">{name}</span>
                  </label>
                  <span className="text-[10px] text-text-muted">
                    {config.values.length ? `${config.values.length} sources` : "empty"}
                  </span>
                </div>

                {config.enabled && name !== "upgrade-insecure-requests" && (
                  <div className="space-y-2 text-xs">
                    {/* Common preset tokens */}
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_SOURCES.map((src) => {
                        const isSelected = config.values.includes(src);
                        return (
                          <button
                            key={src}
                            type="button"
                            onClick={() => toggleValue(name, src)}
                            className={`px-2 py-0.5 rounded text-[11px] border font-mono transition-colors ${
                              isSelected
                                ? "border-accent text-accent bg-accent/10 font-bold"
                                : "border-border-subtle text-text-muted hover:text-text-secondary"
                            }`}
                          >
                            {src}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom Source Token Adder */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={customInputs[name] || ""}
                        onChange={(e) =>
                          setCustomInputs((prev) => ({ ...prev, [name]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomValue(name);
                          }
                        }}
                        placeholder="Add custom host (e.g. api.example.com or *.cdn.com)..."
                        className="flex-1 rounded border border-border-subtle bg-bg-card p-1.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => addCustomValue(name)}
                        className="px-2.5 py-1.5 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-accent hover:border-accent text-xs"
                      >
                        + Add Source
                      </button>
                    </div>

                    {/* Active Values Chips */}
                    {config.values.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {config.values.map((v) => (
                          <span
                            key={v}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle text-[10px] text-text-primary"
                          >
                            {v}
                            <button
                              type="button"
                              onClick={() => toggleValue(name, v)}
                              className="text-text-muted hover:text-error ml-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Compiled Output Section */}
        <div className="pt-3 border-t border-border-subtle space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-semibold text-xs text-text-primary">Target Integration Format</span>
            <div className="flex flex-wrap gap-1 text-xs">
              {(["header", "meta", "nginx", "apache", "vercel", "nextjs"] as ExportFormat[]).map(
                (fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setExportFormat(fmt)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-colors uppercase ${
                      exportFormat === fmt
                        ? "bg-accent text-bg-page"
                        : "border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {fmt}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="text-text-muted text-[11px] uppercase">
                {exportFormat} Output ({rawCspString.length} chars)
              </span>
              <CopyButton text={formattedOutput} label="Copy CSP" />
            </div>
            <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-60 overflow-y-auto leading-relaxed">
              {formattedOutput}
            </pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
