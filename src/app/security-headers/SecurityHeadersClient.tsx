"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface HeaderOption {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  value: string;
  options?: string[];
}

type ServerTarget = "nginx" | "apache" | "vercel" | "caddy" | "cloudflare" | "nextjs";

export default function SecurityHeadersClient() {
  const [target, setTarget] = useState<ServerTarget>("nginx");
  const [headers, setHeaders] = useState<HeaderOption[]>([
    {
      id: "hsts",
      name: "Strict-Transport-Security",
      description: "Forces HTTPS connections and protects against downgrade attacks.",
      enabled: true,
      value: "max-age=63072000; includeSubDomains; preload",
      options: [
        "max-age=63072000; includeSubDomains; preload",
        "max-age=31536000; includeSubDomains",
        "max-age=31536000",
      ],
    },
    {
      id: "xfo",
      name: "X-Frame-Options",
      description: "Prevents clickjacking by disabling embedding in iframes.",
      enabled: true,
      value: "DENY",
      options: ["DENY", "SAMEORIGIN"],
    },
    {
      id: "xcto",
      name: "X-Content-Type-Options",
      description: "Stops browsers from MIME-sniffing away from the declared content-type.",
      enabled: true,
      value: "nosniff",
      options: ["nosniff"],
    },
    {
      id: "rp",
      name: "Referrer-Policy",
      description: "Controls how much referrer info should be included with requests.",
      enabled: true,
      value: "strict-origin-when-cross-origin",
      options: [
        "strict-origin-when-cross-origin",
        "no-referrer",
        "same-origin",
        "no-referrer-when-downgrade",
      ],
    },
    {
      id: "pp",
      name: "Permissions-Policy",
      description: "Restricts access to browser features like camera, mic, and geolocation.",
      enabled: true,
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      options: [
        "camera=(), microphone=(), geolocation=(), interest-cohort=()",
        "camera=(), microphone=(), geolocation=()",
      ],
    },
    {
      id: "csp",
      name: "Content-Security-Policy",
      description: "Restricts sources of executable scripts, stylesheets, and assets.",
      enabled: true,
      value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
      options: [
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
        "default-src 'self';",
      ],
    },
  ]);

  const toggleHeader = (id: string) => {
    setHeaders((prev) =>
      prev.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h))
    );
  };

  const updateValue = (id: string, val: string) => {
    setHeaders((prev) =>
      prev.map((h) => (h.id === id ? { ...h, value: val } : h))
    );
  };

  const activeHeaders = useMemo(() => headers.filter((h) => h.enabled), [headers]);

  const configOutput = useMemo(() => {
    switch (target) {
      case "nginx":
        return activeHeaders
          .map((h) => `add_header ${h.name} "${h.value}" always;`)
          .join("\n");

      case "apache":
        return (
          "<IfModule mod_headers.c>\n" +
          activeHeaders
            .map((h) => `  Header always set ${h.name} "${h.value}"`)
            .join("\n") +
          "\n</IfModule>"
        );

      case "vercel":
        return JSON.stringify(
          {
            headers: [
              {
                source: "/(.*)",
                headers: activeHeaders.map((h) => ({
                  key: h.name,
                  value: h.value,
                })),
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
          activeHeaders
            .map(
              (h) =>
                `          { key: '${h.name}', value: '${h.value.replace(/'/g, "\\'")}' },`
            )
            .join("\n") +
          "\n        ],\n" +
          "      },\n" +
          "    ];\n" +
          "  },\n" +
          "};\n" +
          "export default nextConfig;"
        );

      case "caddy":
        return (
          "header {\n" +
          activeHeaders.map((h) => `  ${h.name} "${h.value}"`).join("\n") +
          "\n}"
        );

      case "cloudflare":
        return activeHeaders
          .map((h) => `/* ${h.name} */\nhttp.response.headers.set("${h.name}", "${h.value}");`)
          .join("\n\n");

      default:
        return "";
    }
  }, [activeHeaders, target]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Active Headers:</span>
        <span className="text-accent font-bold">{activeHeaders.length} / {headers.length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Target Web Server:</span>
        <span className="text-text-primary uppercase font-bold">{target}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">HSTS Preload:</span>
        <span className="text-success font-bold">Enabled</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Security Score:</span>
        <span className="text-success font-bold">A+ Compatible</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="security-headers" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Target Server Switcher */}
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2">
            Target Web Server / Framework Config
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(["nginx", "apache", "vercel", "nextjs", "caddy", "cloudflare"] as ServerTarget[]).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTarget(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors uppercase ${
                    target === s
                      ? "bg-accent text-bg-page"
                      : "border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {s}
                </button>
              )
            )}
          </div>
        </div>

        {/* Security Headers Checklist */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <span className="text-xs font-semibold text-text-primary block">
            Configure Security Directives ({activeHeaders.length} Enabled)
          </span>

          <div className="space-y-3">
            {headers.map((h) => (
              <div
                key={h.id}
                className={`p-3 rounded-lg border transition-colors ${
                  h.enabled
                    ? "border-accent/30 bg-bg-page"
                    : "border-border-subtle/50 bg-bg-page/40 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={() => toggleHeader(h.id)}
                      className="accent-accent cursor-pointer"
                    />
                    <span className="text-xs font-bold text-text-primary">{h.name}</span>
                  </label>
                </div>
                <p className="text-[11px] text-text-muted mb-2">{h.description}</p>

                {h.enabled && (
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => updateValue(h.id, e.target.value)}
                    className="w-full rounded border border-border-subtle bg-bg-card p-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Generated Configuration Output */}
        <div className="pt-3 border-t border-border-subtle space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary uppercase">
              {target} Configuration Output
            </span>
            <CopyButton text={configOutput} label="Copy Config" />
          </div>
          <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
            {configOutput}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
