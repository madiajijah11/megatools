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
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
          Streamline Your{" "}
          <span className="gradient-text">Workflow.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
          8 free developer tools — right in your browser. No uploads. No tracking.
        </p>

        {/* Search */}
        <div className="mx-auto mt-8 max-w-md">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools..."
            className="input-field h-12 pl-4 pr-4 text-base"
          />
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
            <div className="mb-3 text-2xl">{tool.emoji}</div>
            <h3 className="mb-1 text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
              {tool.title}
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
          No tools match your search.
        </p>
      )}

      {/* Features */}
      <section className="mt-20 grid gap-8 border border-border-subtle rounded-2xl bg-bg-card p-8 sm:grid-cols-3 text-center">
        <div>
          <div className="mb-2 text-2xl">⚡</div>
          <h4 className="font-semibold text-text-primary">Blazing Fast</h4>
          <p className="mt-1 text-sm text-text-secondary">
            Client-side processing. No server round-trips.
          </p>
        </div>
        <div>
          <div className="mb-2 text-2xl">🔒</div>
          <h4 className="font-semibold text-text-primary">100% Private</h4>
          <p className="mt-1 text-sm text-text-secondary">
            Your data never leaves your device.
          </p>
        </div>
        <div>
          <div className="mb-2 text-2xl">🆓</div>
          <h4 className="font-semibold text-text-primary">Completely Free</h4>
          <p className="mt-1 text-sm text-text-secondary">
            No paywalls. No signups. Just tools that work.
          </p>
        </div>
      </section>
    </div>
  );
}