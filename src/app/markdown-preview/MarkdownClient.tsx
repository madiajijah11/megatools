"use client";

import { useState, useMemo, useEffect, ComponentType } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";

const DEFAULT_MARKDOWN = "# Markdown Live Studio\n\n" +
  "MegaTools **Markdown & MDX Previewer** executes entirely in your browser with zero data leakage.\n\n" +
  "## Features\n" +
  "- Full GitHub Flavored Markdown (GFM)\n" +
  "- Instant HTML / MDX AST compilation\n" +
  "- Clean monospace terminal UI\n\n" +
  "```typescript\n" +
  "interface ToolConfig {\n" +
  "  id: string;\n" +
  "  clientOnly: boolean;\n" +
  "  zeroLeakage: true;\n" +
  "}\n" +
  "```\n\n" +
  "> \"Simplicity is prerequisite for reliability.\" — Edsger W. Dijkstra\n";

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href="#"');
}

async function parseMDX(
  code: string
): Promise<{ Content: ComponentType | null; error: string | null }> {
  try {
    const cleanCode = sanitizeHtml(code);
    const exports = await evaluate(cleanCode, {
      ...runtime,
      baseUrl: typeof window !== "undefined" ? window.location.href : undefined,
    });
    return { Content: exports.default, error: null };
  } catch (err) {
    return { Content: null, error: (err as Error).message };
  }
}

export default function MarkdownClient() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [MDXContent, setMDXContent] = useState<ComponentType | null>(null);
  const [mdxError, setMdxError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (markdown.trim()) {
      parseMDX(markdown).then(({ Content, error }) => {
        if (!active) return;
        setMDXContent(() => Content);
        setMdxError(error);
      });
    } else {
      setMDXContent(null);
      setMdxError(null);
    }
    return () => {
      active = false;
    };
  }, [markdown]);

  const charCount = markdown.length;
  const wordCount = useMemo(() => {
    return markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  }, [markdown]);
  const lineCount = useMemo(() => {
    return markdown ? markdown.split("\n").length : 0;
  }, [markdown]);
  const readTimeMin = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Characters:</span>
        <span className="text-accent font-bold">{charCount}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Words:</span>
        <span className="text-text-primary">{wordCount}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Lines:</span>
        <span className="text-text-primary">{lineCount}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Read Time:</span>
        <span className="text-success font-bold">~{readTimeMin} min</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="markdown-preview" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* View Mode Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="flex items-center gap-1.5 p-1 bg-bg-page rounded-lg border border-border-subtle text-xs">
            <button
              onClick={() => setViewMode("split")}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                viewMode === "split" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                viewMode === "edit" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Editor Only
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                viewMode === "preview" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Preview Only
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMarkdown("")}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
            >
              [Clear]
            </button>
            <CopyButton text={markdown} label="Copy MD" />
          </div>
        </div>

        {/* Content View Grid */}
        <div
          className={`grid gap-4 ${
            viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Editor */}
          {(viewMode === "split" || viewMode === "edit") && (
            <div className="space-y-2">
              <div className="h-8 flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">Markdown Source</span>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write markdown or MDX code here..."
                rows={16}
                className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {/* Preview */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className="space-y-2">
              <div className="h-8 flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">Compiled Preview</span>
              </div>
              <div className="rounded-lg border border-border-subtle bg-bg-page p-4 min-h-[360px] max-h-[500px] overflow-y-auto prose prose-invert prose-green text-xs leading-relaxed max-w-none">
                {MDXContent ? (
                  <MDXContent />
                ) : mdxError ? (
                  <div className="text-error font-mono">
                    <p className="font-bold mb-1">MDX Compile Error:</p>
                    <pre className="text-[11px] whitespace-pre-wrap bg-error/10 p-2 rounded border border-error/30">
                      {mdxError}
                    </pre>
                  </div>
                ) : (
                  <p className="text-text-muted italic">Nothing to preview.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  );
}
