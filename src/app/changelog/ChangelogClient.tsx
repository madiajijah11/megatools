"use client";

import { useState } from "react";
import Link from "next/link";
import { CHANGELOG_ITEMS, ChangeType } from "@/lib/changelog-data";

function getBadgeStyle(type: ChangeType) {
  switch (type) {
    case "added":
      return "border-accent/40 bg-accent-soft text-accent";
    case "updated":
      return "border-warning/40 bg-warning/10 text-warning";
    case "improved":
      return "border-success/40 bg-success/10 text-success";
    case "fixed":
      return "border-error/40 bg-error/10 text-error";
    default:
      return "border-border-subtle bg-bg-card text-text-secondary";
  }
}

export default function ChangelogClient() {
  const [filter, setFilter] = useState<"all" | ChangeType>("all");

  const filteredItems = CHANGELOG_ITEMS.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="card p-6 sm:p-10 space-y-8">
        <div>
          <p className="text-xs font-mono text-text-muted mb-2">
            $ git log --oneline --decorate
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-text">Changelog & Updates</span>
          </h1>
          <p className="mt-3 text-base text-text-secondary leading-relaxed">
            Stay up to date with newly added utilities, feature updates, performance boosts, and fixes.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 border-y border-border-subtle py-4 font-mono text-xs">
          <span className="text-text-muted mr-1">filter:</span>
          {(["all", "added", "updated", "improved", "fixed"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 rounded transition-colors uppercase font-medium ${
                filter === type
                  ? "bg-accent text-bg-page font-bold shadow-sm"
                  : "border border-border-subtle bg-bg-page/60 text-text-secondary hover:border-accent/40 hover:text-text-primary"
              }`}
            >
              {type === "all" ? "[ALL]" : `[${type}]`}
            </button>
          ))}
        </div>

        {/* Timeline List */}
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-subtle">
          {filteredItems.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[27px] sm:-left-[35px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-border-subtle bg-bg-card group-hover:border-accent group-hover:bg-accent-soft transition-colors" />

              <div className="rounded-lg border border-border-subtle/80 bg-bg-page/60 p-5 sm:p-6 transition-all hover:border-accent/40">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-mono uppercase font-semibold border ${getBadgeStyle(
                        item.type
                      )}`}
                    >
                      [{item.type}]
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-text-primary">
                      {item.title}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-text-muted">
                    {item.date}
                  </span>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {item.description}
                </p>

                {item.highlights && item.highlights.length > 0 && (
                  <ul className="space-y-1.5 font-mono text-xs text-text-secondary border-t border-border-subtle/60 pt-3 mb-3">
                    {item.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-accent font-bold mt-0.5">+</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {item.toolHref && (
                  <div className="pt-2">
                    <Link
                      href={item.toolHref}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-accent hover:underline"
                    >
                      <span>Try tool: {item.toolName || "Open"}</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-sm font-mono text-text-muted">
              No changelog entries found matching [{filter}].
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
