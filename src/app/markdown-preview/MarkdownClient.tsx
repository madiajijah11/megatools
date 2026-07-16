"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

function parseMarkdown(text: string): string {
  let html = text;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre class="rounded-lg bg-bg-page border border-border-subtle p-4 overflow-x-auto"><code class="text-sm font-mono">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-bg-page px-1.5 py-0.5 text-sm font-mono text-accent">$1</code>');

  // Strip img and script tags entirely (prevent XSS)
  html = html.replace(/<img[^>]*>/gi, "");
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "");

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-text-primary mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-text-primary mt-5 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-text-primary mt-6 mb-3">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent underline hover:text-accent-hover transition-colors">$1</a>'
  );

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-2 space-y-1">$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="my-4 border-border-subtle" />');

  // Paragraphs: wrap remaining lines
  html = html.replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p class="my-1">$1</p>');

  // Line breaks
  html = html.replace(/\n\n/g, '<br />');

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitizeHtml(html: string): string {
  // Strip dangerous event handler attributes (onerror, onload, onclick, etc.)
  return html.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

export default function MarkdownClient() {
  const [markdown, setMarkdown] = useState(
    `# Hello World\n\nThis is a **bold** and *italic* demo.\n\n## Features\n\n- Headers\n- **Bold** and *italic*\n- [Links](https://example.com)\n- \`Inline code\` and code blocks\n\n\`\`\`js\nconsole.log("Hello!");\n\`\`\`\n\n---\n\nA [link](https://example.com) in a paragraph.`
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const html = useMemo(() => sanitizeHtml(parseMarkdown(markdown)), [markdown]);
  const charCount = markdown.length;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const lineCount = markdown ? markdown.split("\n").length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Characters</p>
        <p className="text-text-primary font-mono">{charCount}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Words</p>
        <p className="text-text-primary font-mono">{wordCount}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Lines</p>
        <p className="text-text-primary font-mono">{lineCount}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Read Time</p>
        <p className="text-text-primary font-mono">{readTime} min</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        ← Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Markdown Preview</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Write Markdown and see the rendered HTML preview side by side.
            </p>
          </div>

          {/* Editor + Preview */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Editor */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">
                  Markdown
                </label>
                <span className="text-xs text-text-muted">
                  {charCount} chars · {wordCount} words
                </span>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write your markdown here..."
                className="input-field min-h-[260px] sm:min-h-[320px] md:min-h-[32rem] resize-y font-mono text-sm"
                spellCheck={false}
              />
            </div>

            {/* Preview */}
            <div>
              <div className="mb-2">
                <label className="text-sm font-medium text-text-secondary">
                  Preview
                </label>
              </div>
              <div className="min-h-[260px] sm:min-h-[320px] md:min-h-[32rem] overflow-y-auto rounded-xl border border-border-subtle bg-bg-page p-4 text-sm text-text-primary leading-relaxed break-words">
                {markdown.trim() ? (
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                ) : (
                  <p className="text-text-muted">
                    Preview will appear here...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="markdown-preview" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl hover:bg-accent/90 transition-colors"
      >
        💡
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="markdown-preview" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
