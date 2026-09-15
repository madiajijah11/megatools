"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { TOOLS, TOOL_CATEGORIES } from "@/lib/tool-data";
import TechBadge from "@/components/TechBadge";

const ASCII_LOGO = `███╗   ███╗███████╗ ██████╗  █████╗ ████████╗ ██████╗  ██████╗ ██╗     ███████╗
████╗ ████║██╔════╝██╔════╝ ██╔══██╗╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
██╔████╔██║█████╗  ██║  ███╗███████║   ██║   ██║   ██║██║   ██║██║     ███████╗
██║╚██╔╝██║██╔══╝  ██║   ██║██╔══██║   ██║   ██║   ██║██║   ██║██║     ╚════██║
██║ ╚═╝ ██║███████╗╚██████╔╝██║  ██║   ██║   ╚██████╔╝╚██████╔╝███████╗███████║
╚═╝     ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝`;

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categoryToolMap = useMemo(() => {
    const map = new Map<string, string>();
    TOOL_CATEGORIES.forEach((cat) => {
      cat.toolIds.forEach((id) => map.set(id, cat.id));
    });
    return map;
  }, []);

  const filtered = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesQuery =
        tool.title.toLowerCase().includes(query.toLowerCase()) ||
        tool.description.toLowerCase().includes(query.toLowerCase()) ||
        tool.href.toLowerCase().includes(query.toLowerCase()) ||
        tool.tech.toLowerCase().includes(query.toLowerCase());

      if (!matchesQuery) return false;
      if (selectedCategory === "all") return true;
      return categoryToolMap.get(tool.id) === selectedCategory;
    });
  }, [query, selectedCategory, categoryToolMap]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
      {/* ASCII Art Hero Banner */}
      <section className="mb-10 text-center flex flex-col items-center">
        <div className="max-w-full overflow-hidden mb-3 flex justify-center">
          <pre className="text-[5.5px] min-[380px]:text-[7px] sm:text-[9px] md:text-[11px] lg:text-[12px] font-mono text-accent leading-none tracking-tight select-none opacity-90 drop-shadow-[0_0_12px_rgba(74,222,128,0.4)]">
            {ASCII_LOGO}
          </pre>
        </div>

        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-subtle bg-bg-card font-mono text-xs text-text-secondary mb-4 shadow-sm">
          <span className="text-accent">$</span>
          <span>megatools --client-sandbox --zero-telemetry</span>
          <span className="animate-pulse text-accent">▊</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary">
          {TOOLS.length}+ Browser-Based <span className="gradient-text">Hacker & Dev Utilities</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-text-secondary">
          100% Client-Side. Zero server processing. Offline-ready cryptographic, media, and networking tools.
        </p>

        {/* CLI Interactive Search */}
        <div className="mx-auto mt-6 max-w-xl">
          <div className="flex items-center rounded border border-border-subtle bg-bg-card/90 px-3 py-2 text-sm font-mono shadow-inner focus-within:border-accent focus-within:shadow-[0_0_12px_rgba(74,222,128,0.2)] transition-all">
            <span className="text-accent font-bold mr-2 select-none">root@megatools:~$</span>
            <input
              type="text"
              id="tool-search-input"
              aria-label="Search tools by name, technology, or algorithm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="grep -i 'tool name / algorithm'..."
              className="w-full bg-transparent outline-none border-none text-xs sm:text-sm text-text-primary placeholder:text-text-muted font-mono"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-1.5"
                title="Clear filter"
                aria-label="Clear search input"
              >
                [ESC]
              </button>
            )}
          </div>

          {/* Category Filter Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 font-mono text-xs">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedCategory === "all"
                  ? "border border-accent bg-accent-soft text-accent font-bold"
                  : "border border-border-subtle bg-bg-page/50 text-text-muted hover:text-text-primary"
              }`}
            >
              [ALL_PACKAGES]
            </button>
            {TOOL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  selectedCategory === cat.id
                    ? "border border-accent bg-accent-soft text-accent font-bold"
                    : "border border-border-subtle bg-bg-page/50 text-text-muted hover:text-text-primary"
                }`}
              >
                [{cat.name.toUpperCase().replace(/\s+/g, "_")}]
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-text-muted px-1">
            <span>&gt; RESULTS: {filtered.length} / {TOOLS.length} BINARIES</span>
            <span>PRESS [CMD+K] ANYWHERE</span>
          </div>
        </div>
      </section>

      {/* Tool Grid */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="group relative rounded border border-border-subtle bg-bg-card p-4 transition-all duration-150 hover:border-accent hover:shadow-[0_0_16px_rgba(74,222,128,0.12)] hover:-translate-y-0.5 flex flex-col justify-between"
          >
            {/* Corner Bracket Accent */}
            <div className="absolute top-1.5 right-2 text-[10px] font-mono text-text-muted group-hover:text-accent transition-colors select-none">
              [+]
            </div>

            <div>
              <div className="mb-2 truncate text-xs font-mono font-semibold text-text-muted">
                ~<span className="text-text-secondary">{tool.href}</span>
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-text-primary group-hover:text-accent transition-colors break-words font-mono">
                <span className="text-accent">&gt;</span> {tool.title}
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                {tool.description}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex items-center justify-between text-[11px] font-mono">
              <TechBadge tech={tool.tech} />
              <span className="text-text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all">
                run →
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-16 font-mono">
          <p className="text-sm text-error mb-2">
            bash: command not found: &quot;{query}&quot;
          </p>
          <p className="text-xs text-text-muted">
            Try searching for &quot;base64&quot;, &quot;jwt&quot;, &quot;hash&quot;, &quot;qr&quot;, or &quot;audio&quot;.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setSelectedCategory("all");
            }}
            className="mt-4 text-xs font-mono text-accent hover:underline"
          >
            $ reset --all
          </button>
        </div>
      )}

      {/* Terminal Sandbox Specs */}
      <section className="mt-16 grid gap-4 border border-border-subtle rounded bg-bg-card/70 p-6 sm:grid-cols-3 text-left font-mono text-xs">
        <div className="border-l-2 border-accent pl-3">
          <div className="font-bold text-accent mb-1">[01_AIR_GAPPED]</div>
          <h4 className="font-semibold text-text-primary">100% In-Browser Execution</h4>
          <p className="mt-1 text-text-secondary text-[11px] leading-relaxed">
            Data, files, keys, and tokens are processed in browser memory and never hit any external API.
          </p>
        </div>
        <div className="border-l-2 border-accent pl-3">
          <div className="font-bold text-accent mb-1">[02_ZERO_LATENCY]</div>
          <h4 className="font-semibold text-text-primary">WebAssembly & Native APIs</h4>
          <p className="mt-1 text-text-secondary text-[11px] leading-relaxed">
            Harnesses Web Crypto, Canvas 2D, Web Audio, and Intl for near-instant execution speed.
          </p>
        </div>
        <div className="border-l-2 border-accent pl-3">
          <div className="font-bold text-accent mb-1">[03_OPEN_ARCHITECTURE]</div>
          <h4 className="font-semibold text-text-primary">Auditable & Transparent</h4>
          <p className="mt-1 text-text-secondary text-[11px] leading-relaxed">
            Strict client-side architecture without tracking cookies, intrusive analytics, or storage sync.
          </p>
        </div>
      </section>
    </div>
  );
}
