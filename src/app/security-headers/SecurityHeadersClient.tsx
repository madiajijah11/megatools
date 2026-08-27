"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type ServerTarget = "nginx" | "vercel" | "apache" | "caddy" | "cloudflare";
type Preset = "strict" | "recommended" | "relaxed";

interface HeaderConfig {
  csp: boolean;
  cspValue: string;
  hsts: boolean;
  hstsValue: string;
  xFrame: boolean;
  xFrameValue: string;
  xContentType: boolean;
  referrerPolicy: boolean;
  referrerValue: string;
  permissionsPolicy: boolean;
  permissionsValue: string;
  coop: boolean;
  corp: boolean;
}

const PRESETS: Record<Preset, HeaderConfig> = {
  strict: {
    csp: true,
    cspValue: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
    hsts: true,
    hstsValue: "max-age=63072000; includeSubDomains; preload",
    xFrame: true,
    xFrameValue: "DENY",
    xContentType: true,
    referrerPolicy: true,
    referrerValue: "no-referrer",
    permissionsPolicy: true,
    permissionsValue: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    coop: true,
    corp: true,
  },
  recommended: {
    csp: true,
    cspValue: "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; object-src 'none';",
    hsts: true,
    hstsValue: "max-age=31536000; includeSubDomains",
    xFrame: true,
    xFrameValue: "SAMEORIGIN",
    xContentType: true,
    referrerPolicy: true,
    referrerValue: "strict-origin-when-cross-origin",
    permissionsPolicy: true,
    permissionsValue: "camera=(), microphone=(), geolocation=()",
    coop: false,
    corp: false,
  },
  relaxed: {
    csp: false,
    cspValue: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
    hsts: true,
    hstsValue: "max-age=15552000",
    xFrame: true,
    xFrameValue: "SAMEORIGIN",
    xContentType: true,
    referrerPolicy: true,
    referrerValue: "strict-origin-when-cross-origin",
    permissionsPolicy: false,
    permissionsValue: "camera=(), microphone=()",
    coop: false,
    corp: false,
  },
};

function formatHeaders(cfg: HeaderConfig, target: ServerTarget): string {
  const headersList: { name: string; value: string }[] = [];

  if (cfg.hsts) headersList.push({ name: "Strict-Transport-Security", value: cfg.hstsValue });
  if (cfg.xContentType) headersList.push({ name: "X-Content-Type-Options", value: "nosniff" });
  if (cfg.xFrame) headersList.push({ name: "X-Frame-Options", value: cfg.xFrameValue });
  if (cfg.referrerPolicy) headersList.push({ name: "Referrer-Policy", value: cfg.referrerValue });
  if (cfg.permissionsPolicy) headersList.push({ name: "Permissions-Policy", value: cfg.permissionsValue });
  if (cfg.csp) headersList.push({ name: "Content-Security-Policy", value: cfg.cspValue });
  if (cfg.coop) headersList.push({ name: "Cross-Origin-Opener-Policy", value: "same-origin" });
  if (cfg.corp) headersList.push({ name: "Cross-Origin-Resource-Policy", value: "same-origin" });

  switch (target) {
    case "nginx":
      return headersList.map((h) => `add_header ${h.name} "${h.value}" always;`).join("\n");

    case "apache":
      return (
        "<IfModule mod_headers.c>\n" +
        headersList.map((h) => `  Header always set ${h.name} "${h.value}"`).join("\n") +
        "\n</IfModule>"
      );

    case "caddy":
      return (
        "header {\n" +
        headersList.map((h) => `  ${h.name} "${h.value}"`).join("\n") +
        "\n}"
      );

    case "cloudflare":
      return (
        "/*\n" +
        headersList.map((h) => `  ${h.name}: ${h.value}`).join("\n")
      );

    case "vercel":
      return (
        "// next.config.mjs or next.config.ts\n" +
        JSON.stringify(
          [
            {
              source: "/(.*)",
              headers: headersList.map((h) => ({ key: h.name, value: h.value })),
            },
          ],
          null,
          2
        )
      );
  }
}

export default function SecurityHeadersClient() {
  const [preset, setPreset] = useState<Preset>("strict");
  const [target, setTarget] = useState<ServerTarget>("nginx");
  const [config, setConfig] = useState<HeaderConfig>(PRESETS.strict);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handlePreset = (p: Preset) => {
    setPreset(p);
    setConfig(PRESETS[p]);
  };

  const outputCode = useMemo(() => {
    return formatHeaders(config, target);
  }, [config, target]);

  const activeHeadersCount = [
    config.hsts,
    config.xContentType,
    config.xFrame,
    config.referrerPolicy,
    config.permissionsPolicy,
    config.csp,
    config.coop,
    config.corp,
  ].filter(Boolean).length;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Security Grade</p>
        <p className="text-success font-mono font-bold">
          {preset === "strict" ? "A+ RATING" : preset === "recommended" ? "A RATING" : "B RATING"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Active Headers</p>
        <p className="text-text-primary font-mono">{activeHeadersCount} / 8</p>
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
              <span className="gradient-text">Security Headers Generator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Generate hardened HTTP security headers for Nginx, Vercel, Apache, and Caddy.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="mb-6 flex flex-wrap rounded border border-border-subtle bg-bg-page p-1 gap-1">
            <button
              onClick={() => handlePreset("strict")}
              className={`flex-1 py-1.5 px-2 text-xs font-mono rounded transition-colors ${
                preset === "strict"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ preset --strict (A+)
            </button>
            <button
              onClick={() => handlePreset("recommended")}
              className={`flex-1 py-1.5 px-2 text-xs font-mono rounded transition-colors ${
                preset === "recommended"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ preset --recommended
            </button>
            <button
              onClick={() => handlePreset("relaxed")}
              className={`flex-1 py-1.5 px-2 text-xs font-mono rounded transition-colors ${
                preset === "relaxed"
                  ? "bg-accent text-bg-page font-bold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              $ preset --relaxed
            </button>
          </div>

          {/* Server Format Selection */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-text-muted uppercase block mb-2">
              Target Web Server / Platform Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(["nginx", "vercel", "apache", "caddy", "cloudflare"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setTarget(s)}
                  className={`py-1.5 px-2 text-xs font-mono rounded border transition-colors ${
                    target === s
                      ? "border-accent bg-accent-soft text-accent font-bold"
                      : "border-border-subtle bg-bg-page text-text-secondary hover:border-accent"
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Header Checkbox Toggles */}
          <div className="mb-6 space-y-3 rounded border border-border-subtle bg-bg-page p-4 text-xs font-mono">
            <p className="text-text-muted font-semibold uppercase mb-2">Configure Active Headers</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-secondary">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.hsts}
                  onChange={(e) => setConfig({ ...config, hsts: e.target.checked })}
                  className="accent-accent"
                />
                <span>HSTS (Strict-Transport)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.xContentType}
                  onChange={(e) => setConfig({ ...config, xContentType: e.target.checked })}
                  className="accent-accent"
                />
                <span>X-Content-Type-Options</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.xFrame}
                  onChange={(e) => setConfig({ ...config, xFrame: e.target.checked })}
                  className="accent-accent"
                />
                <span>X-Frame-Options (Clickjacking)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.referrerPolicy}
                  onChange={(e) => setConfig({ ...config, referrerPolicy: e.target.checked })}
                  className="accent-accent"
                />
                <span>Referrer-Policy</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.permissionsPolicy}
                  onChange={(e) => setConfig({ ...config, permissionsPolicy: e.target.checked })}
                  className="accent-accent"
                />
                <span>Permissions-Policy</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.csp}
                  onChange={(e) => setConfig({ ...config, csp: e.target.checked })}
                  className="accent-accent"
                />
                <span>Content-Security-Policy (CSP)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.coop}
                  onChange={(e) => setConfig({ ...config, coop: e.target.checked })}
                  className="accent-accent"
                />
                <span>COOP (Opener-Policy)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.corp}
                  onChange={(e) => setConfig({ ...config, corp: e.target.checked })}
                  className="accent-accent"
                />
                <span>CORP (Resource-Policy)</span>
              </label>
            </div>
          </div>

          {/* Generated Code Output */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary font-mono">
                Generated Configuration ({target.toUpperCase()})
              </label>
              <CopyButton text={outputCode} label="copy config" />
            </div>
            <pre className="output-field min-h-[220px] text-xs font-mono text-text-primary overflow-x-auto whitespace-pre">
              <code>{outputCode}</code>
            </pre>
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="security-headers" stats={stats} />
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
        <InfoPanel toolId="security-headers" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
