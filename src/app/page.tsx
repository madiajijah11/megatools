"use client";

import Link from "next/link";
import { useState } from "react";
import { TOOLS } from "@/lib/tool-data";
import TechBadge from "@/components/TechBadge";

export default function Home() {
  const [query, setQuery] = useState("");
  const filtered = TOOLS.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      {/* Hero */}
      <section className="mb-16 text-center">
        <p className="text-sm text-text-muted mb-3">$ ./megatools --list</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
          Developer Tools,{" "}
          <span className="gradient-text">Zero Servers.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
          8 free tools running entirely in your browser. No uploads. No tracking.
        </p>

        {/* Search */}
        <div className="mx-auto mt-8 max-w-md">
          <div className="flex items-center input-field !py-0 h-12 text-base">
            <span className="text-accent select-none">&gt;</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search tools"
              className="w-full bg-transparent outline-none border-none pl-2 placeholder:text-text-muted"
              style={{ boxShadow: "none" }}
            />
          </div>
        </div>
      </section>

      {/* Tool Grid */}
      <section className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((tool) => (
          <Link
            key={tool.id}
            href={tool.href}
            className="card card-hover group p-6 flex flex-col"
          >
            <div className="mb-3 truncate text-sm font-semibold text-text-muted">
              ~/<span className="text-text-secondary">{tool.href.replace("/", "")}</span>
            </div>
            <h3 className="mb-1 text-base font-semibold text-text-primary group-hover:text-accent transition-colors break-words">
              <span className="text-accent">$</span> {tool.title.toLowerCase().replace(/\s+/g, "-")}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed flex-1">
              {tool.description}
            </p>
            <div className="mt-3">
              <TechBadge tech={tool.tech} />
            </div>
          </Link>
        ))}
      </section>

      {/* Empty state */}
      {filtered.length === 0 && (
        <p className="text-center text-text-muted mt-8">
          <span className="text-error">command not found:</span> {query}
        </p>
      )}

      {/* Features */}
      <section className="mt-20 grid gap-8 border border-border-subtle rounded bg-bg-card p-8 sm:grid-cols-3 text-center">
        <div>
          <div className="mb-2 font-semibold text-accent">[fast]</div>
          <h4 className="font-semibold text-text-primary">Blazing Fast</h4>
          <p className="mt-1 text-sm text-text-secondary">
            Client-side processing. No server round-trips.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-accent">[private]</div>
          <h4 className="font-semibold text-text-primary">100% Private</h4>
          <p className="mt-1 text-sm text-text-secondary">
            Your data never leaves your device.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-accent">[free]</div>
          <h4 className="font-semibold text-text-primary">Completely Free</h4>
          <p className="mt-1 text-sm text-text-secondary">
            No paywalls. No signups. Just tools that work.
          </p>
        </div>
      </section>
    </div>
  );
}
