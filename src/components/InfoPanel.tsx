"use client";

import { getToolInfo } from "@/lib/tool-data";
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

      {/* Extra */}
      {extraContent}
    </aside>
  );
}
