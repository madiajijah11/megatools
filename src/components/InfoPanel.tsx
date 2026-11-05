"use client";

import Link from "next/link";
import { getToolInfo, TOOL_CATEGORIES, TOOLS } from "@/lib/tool-data";
import CopyButton from "./CopyButton";
import TechBadge from "./TechBadge";

interface InfoPanelProps {
  toolId: string;
  stats?: React.ReactNode;
  extraContent?: React.ReactNode;
}

export default function InfoPanel({ toolId, stats, extraContent }: InfoPanelProps) {
  const tool = getToolInfo(toolId);
  if (!tool) return null;

  // Find related tools in the same category
  const category = TOOL_CATEGORIES.find((cat) => cat.toolIds.includes(toolId));
  const relatedTools = category
    ? category.toolIds
        .filter((id) => id !== toolId)
        .slice(0, 4)
        .map((id) => TOOLS.find((t) => t.id === id))
        .filter(Boolean)
    : [];

  return (
    <aside className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          <span className="text-accent">$</span> cat tips.txt
        </h2>
        <TechBadge tech={tool.tech} />
      </div>

      {/* How to Use */}
      <section className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">How to Use</h3>
        <ol className="space-y-2">
          {tool.steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-text-secondary">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Stats */}
      {stats && (
        <section className="card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Stats</h3>
          {stats}
        </section>
      )}

      {/* Tips */}
      <section className="card p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">Tips</h3>
        <ul className="space-y-2">
          {tool.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-sm text-text-secondary">
              <span className="text-accent">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* Example */}
      {tool.example && (
        <section className="card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Example</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-text-muted mb-1">Input</p>
              <div className="output-field text-sm font-mono">{tool.example.input}</div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Output</p>
              <div className="output-field text-sm font-mono">{tool.example.output}</div>
            </div>
            <CopyButton text={tool.example.output} label="Copy Output" />
          </div>
        </section>
      )}

      {/* Related Tools for SEO Crawlability & Internal Linking */}
      {relatedTools.length > 0 && (
        <section className="card p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center justify-between">
            <span>Related Tools</span>
            {category && (
              <span className="text-xs font-mono text-text-muted">
                {category.emoji} {category.name}
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {relatedTools.map((rt) => {
              if (!rt) return null;
              return (
                <Link
                  key={rt.id}
                  href={rt.href}
                  className="block p-2 rounded border border-border-subtle bg-bg-page/50 hover:border-accent hover:bg-bg-page transition-all group"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-text-primary group-hover:text-accent transition-colors flex items-center gap-1.5">
                      <span>{rt.emoji}</span>
                      <span>{rt.title}</span>
                    </span>
                    <span className="text-text-muted group-hover:text-accent">→</span>
                  </div>
                  <p className="text-[11px] text-text-secondary line-clamp-1 mt-1 font-sans">
                    {rt.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Extra */}
      {extraContent}
    </aside>
  );
}
