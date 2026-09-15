"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface RuleBlock {
  id: string;
  userAgent: string;
  disallows: string[];
  allows: string[];
  crawlDelay?: number;
}

const PRESETS = {
  standard: {
    blocks: [
      {
        id: "1",
        userAgent: "*",
        disallows: ["/admin/", "/private/", "/api/"],
        allows: ["/"],
      },
    ],
    sitemaps: ["https://example.com/sitemap.xml"],
  },
  blockAiScrapers: {
    blocks: [
      {
        id: "1",
        userAgent: "*",
        disallows: ["/admin/"],
        allows: ["/"],
      },
      {
        id: "2",
        userAgent: "GPTBot",
        disallows: ["/"],
        allows: [],
      },
      {
        id: "3",
        userAgent: "ClaudeBot",
        disallows: ["/"],
        allows: [],
      },
      {
        id: "4",
        userAgent: "CCBot",
        disallows: ["/"],
        allows: [],
      },
      {
        id: "5",
        userAgent: "Bytespider",
        disallows: ["/"],
        allows: [],
      },
    ],
    sitemaps: ["https://example.com/sitemap.xml"],
  },
  disallowAll: {
    blocks: [
      {
        id: "1",
        userAgent: "*",
        disallows: ["/"],
        allows: [],
      },
    ],
    sitemaps: [],
  },
};

function matchesPattern(pattern: string, urlPath: string): boolean {
  if (!pattern) return false;
  if (pattern === "/") return true;
  return urlPath.startsWith(pattern.replace(/\*$/, ""));
}

export default function RobotsGeneratorClient() {
  const [blocks, setBlocks] = useState<RuleBlock[]>(PRESETS.standard.blocks);
  const [sitemaps, setSitemaps] = useState<string[]>(PRESETS.standard.sitemaps);
  const [newSitemap, setNewSitemap] = useState("");
  const [testPath, setTestPath] = useState("/admin/dashboard");
  const [testBot, setTestBot] = useState("*");

  const [newDisallow, setNewDisallow] = useState<Record<string, string>>({});
  const [newAllow, setNewAllow] = useState<Record<string, string>>({});

  const addBlock = () => {
    const newId = String(Date.now());
    setBlocks((prev) => [
      ...prev,
      { id: newId, userAgent: "*", disallows: ["/"], allows: [] },
    ]);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBlockUa = (id: string, ua: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, userAgent: ua } : b))
    );
  };

  const addRule = (id: string, type: "disallow" | "allow", val: string) => {
    if (!val.trim()) return;
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (type === "disallow") {
          return { ...b, disallows: [...b.disallows, val.trim()] };
        }
        return { ...b, allows: [...b.allows, val.trim()] };
      })
    );
  };

  const removeRule = (id: string, type: "disallow" | "allow", index: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        if (type === "disallow") {
          return { ...b, disallows: b.disallows.filter((_, i) => i !== index) };
        }
        return { ...b, allows: b.allows.filter((_, i) => i !== index) };
      })
    );
  };

  const addSitemapUrl = () => {
    if (!newSitemap.trim()) return;
    setSitemaps((prev) => [...prev, newSitemap.trim()]);
    setNewSitemap("");
  };

  const removeSitemapUrl = (index: number) => {
    setSitemaps((prev) => prev.filter((_, i) => i !== index));
  };

  const loadPreset = (key: keyof typeof PRESETS) => {
    setBlocks(PRESETS[key].blocks);
    setSitemaps(PRESETS[key].sitemaps);
  };

  // Compile robots.txt content
  const robotsTxtOutput = useMemo(() => {
    const lines: string[] = [];

    blocks.forEach((b, idx) => {
      lines.push(`User-agent: ${b.userAgent}`);
      if (b.crawlDelay !== undefined && b.crawlDelay > 0) {
        lines.push(`Crawl-delay: ${b.crawlDelay}`);
      }
      b.disallows.forEach((d) => lines.push(`Disallow: ${d}`));
      b.allows.forEach((a) => lines.push(`Allow: ${a}`));
      if (idx < blocks.length - 1) lines.push("");
    });

    if (sitemaps.length > 0) {
      lines.push("");
      sitemaps.forEach((s) => lines.push(`Sitemap: ${s}`));
    }

    return lines.join("\n");
  }, [blocks, sitemaps]);

  // Real-time URL Tester
  const testOutcome = useMemo(() => {
    if (!testPath) return { status: "allowed", reason: "Empty path matches root allow" };

    const matchingBlock =
      blocks.find((b) => b.userAgent.toLowerCase() === testBot.toLowerCase()) ||
      blocks.find((b) => b.userAgent === "*");

    if (!matchingBlock) {
      return { status: "allowed", reason: "No matching User-agent rule found (defaults to allowed)" };
    }

    for (const a of matchingBlock.allows) {
      if (matchesPattern(a, testPath)) {
        return { status: "allowed", reason: `Explicitly permitted by "Allow: ${a}"` };
      }
    }

    for (const d of matchingBlock.disallows) {
      if (matchesPattern(d, testPath)) {
        return { status: "blocked", reason: `Blocked by "Disallow: ${d}" for User-agent ${matchingBlock.userAgent}` };
      }
    }

    return { status: "allowed", reason: "No Disallow directive matched this path." };
  }, [blocks, testPath, testBot]);

  const downloadRobots = () => {
    const blob = new Blob([robotsTxtOutput], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">User-agent Blocks:</span>
        <span className="text-accent font-bold">{blocks.length} blocks</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Sitemaps:</span>
        <span className="text-text-primary">{sitemaps.length} URLs</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">URL Test Status:</span>
        <span className={testOutcome.status === "allowed" ? "text-success font-bold" : "text-error font-bold"}>
          {testOutcome.status.toUpperCase()}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Validation:</span>
        <span className="text-success font-bold">Standard RFC 9309</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="robots-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Presets Bar */}
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2">
            Robots.txt Archetypes
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => loadPreset("standard")}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [Standard Web App]
            </button>
            <button
              type="button"
              onClick={() => loadPreset("blockAiScrapers")}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [Block AI Bots (GPT/Claude/Byte)]
            </button>
            <button
              type="button"
              onClick={() => loadPreset("disallowAll")}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [Private Staging (Disallow All)]
            </button>
          </div>
        </div>

        {/* Live URL Match Tester */}
        <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-accent">Real-Time URL Path Match Tester</span>
            <span
              className={`font-bold ${
                testOutcome.status === "allowed" ? "text-success" : "text-error"
              }`}
            >
              {testOutcome.status === "allowed" ? "✓ ALLOWED ACCESS" : "✗ ACCESS BLOCKED"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-text-muted block mb-1">Simulate User-agent:</label>
              <select
                value={testBot}
                onChange={(e) => setTestBot(e.target.value)}
                className="w-full rounded border border-border-subtle bg-bg-card p-1.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="*">* (All Crawlers)</option>
                <option value="Googlebot">Googlebot</option>
                <option value="Bingbot">Bingbot</option>
                <option value="GPTBot">GPTBot (OpenAI)</option>
                <option value="ClaudeBot">ClaudeBot (Anthropic)</option>
                <option value="Bytespider">Bytespider (ByteDance)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-text-muted block mb-1">URL Path to Test:</label>
              <input
                type="text"
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                placeholder="e.g. /admin/login or /blog/post-1..."
                className="w-full rounded border border-border-subtle bg-bg-card p-1.5 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <p className="text-[11px] text-text-muted pt-1">
            Result: <span className="text-text-primary">{testOutcome.reason}</span>
          </p>
        </div>

        {/* Rule Blocks List */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-text-primary text-xs">
              Crawler Directive Blocks ({blocks.length})
            </span>
            <button
              type="button"
              onClick={addBlock}
              className="px-2.5 py-1 rounded bg-accent/10 text-accent border border-accent/30 text-xs font-bold hover:bg-accent hover:text-bg-page transition-colors"
            >
              + Add User-agent Block
            </button>
          </div>

          <div className="space-y-3">
            {blocks.map((b) => (
              <div key={b.id} className="p-3 rounded-lg border border-border-subtle bg-bg-page space-y-3 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">User-agent:</span>
                    <input
                      type="text"
                      value={b.userAgent}
                      onChange={(e) => updateBlockUa(b.id, e.target.value)}
                      className="rounded border border-border-subtle bg-bg-card px-2 py-0.5 font-bold text-accent font-mono text-xs focus:border-accent focus:outline-none"
                    />
                  </div>
                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeBlock(b.id)}
                      className="text-text-muted hover:text-error text-xs"
                    >
                      Delete Block
                    </button>
                  )}
                </div>

                {/* Disallow Rules */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-error font-bold text-[11px]">Disallow Rules:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newDisallow[b.id] || ""}
                      onChange={(e) =>
                        setNewDisallow((prev) => ({ ...prev, [b.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRule(b.id, "disallow", newDisallow[b.id] || "");
                          setNewDisallow((prev) => ({ ...prev, [b.id]: "" }));
                        }
                      }}
                      placeholder="e.g. /admin/ or /private/..."
                      className="flex-1 rounded border border-border-subtle bg-bg-card p-1 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addRule(b.id, "disallow", newDisallow[b.id] || "");
                        setNewDisallow((prev) => ({ ...prev, [b.id]: "" }));
                      }}
                      className="px-2 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-error text-xs"
                    >
                      + Disallow
                    </button>
                  </div>

                  {b.disallows.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {b.disallows.map((d, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-error/10 text-error border border-error/25 text-[11px]"
                        >
                          Disallow: {d}
                          <button
                            type="button"
                            onClick={() => removeRule(b.id, "disallow", i)}
                            className="hover:text-text-primary ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Allow Rules */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-success font-bold text-[11px]">Allow Rules:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newAllow[b.id] || ""}
                      onChange={(e) =>
                        setNewAllow((prev) => ({ ...prev, [b.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRule(b.id, "allow", newAllow[b.id] || "");
                          setNewAllow((prev) => ({ ...prev, [b.id]: "" }));
                        }
                      }}
                      placeholder="e.g. / or /public/..."
                      className="flex-1 rounded border border-border-subtle bg-bg-card p-1 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addRule(b.id, "allow", newAllow[b.id] || "");
                        setNewAllow((prev) => ({ ...prev, [b.id]: "" }));
                      }}
                      className="px-2 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-success text-xs"
                    >
                      + Allow
                    </button>
                  </div>

                  {b.allows.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {b.allows.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/25 text-[11px]"
                        >
                          Allow: {a}
                          <button
                            type="button"
                            onClick={() => removeRule(b.id, "allow", i)}
                            className="hover:text-text-primary ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sitemaps */}
        <div className="space-y-2 pt-2 border-t border-border-subtle text-xs">
          <span className="font-semibold text-text-primary block">Sitemap XML Declarations</span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSitemap}
              onChange={(e) => setNewSitemap(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSitemapUrl();
                }
              }}
              placeholder="https://yourdomain.com/sitemap.xml..."
              className="flex-1 rounded border border-border-subtle bg-bg-page p-2 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              onClick={addSitemapUrl}
              className="px-3 py-2 rounded bg-accent/10 text-accent border border-accent/30 font-bold hover:bg-accent hover:text-bg-page text-xs"
            >
              + Add Sitemap
            </button>
          </div>

          {sitemaps.map((s, i) => (
            <div
              key={i}
              className="p-2 rounded border border-border-subtle bg-bg-page flex items-center justify-between text-xs font-mono"
            >
              <span className="text-accent truncate">{s}</span>
              <button
                type="button"
                onClick={() => removeSitemapUrl(i)}
                className="text-text-muted hover:text-error text-xs"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

        {/* Output Area */}
        <div className="pt-3 border-t border-border-subtle space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Compiled robots.txt File</span>
            <div className="flex items-center gap-2">
              <CopyButton text={robotsTxtOutput} label="Copy robots.txt" />
              <button
                type="button"
                onClick={downloadRobots}
                className="px-3 py-1 rounded bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors"
              >
                Download robots.txt
              </button>
            </div>
          </div>
          <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
            {robotsTxtOutput}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
