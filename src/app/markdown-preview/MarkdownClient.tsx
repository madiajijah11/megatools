"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

function parseMarkdown(text: string): string {
  let html = text;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre class="rounded-lg bg-mega-dark/70 border border-mega-border p-4 overflow-x-auto"><code class="text-sm font-mono">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-mega-dark/70 px-1.5 py-0.5 text-sm font-mono text-mega-accent-light">$1</code>');

  // Strip img and script tags entirely (prevent XSS)
  html = html.replace(/<img[^>]*>/gi, "");
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "");

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-white mt-5 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-3">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-mega-accent-light underline hover:text-white transition-colors">$1</a>'
  );

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul class="my-2 space-y-1">$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="my-4 border-mega-border" />');

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

  const html = useMemo(() => sanitizeHtml(parseMarkdown(markdown)), [markdown]);
  const charCount = markdown.length;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-8 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-mega-muted hover:text-mega-accent-light transition-colors mb-6 sm:mb-8"
      >
        ← Back to Tools
      </Link>

      <div className="glass rounded-2xl p-4 sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Markdown Preview</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-mega-muted">
            Write Markdown and see the rendered HTML preview side by side.
          </p>
        </div>

        {/* Editor + Preview */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Editor */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-mega-muted">
                Markdown
              </label>
              <span className="text-xs text-mega-muted">
                {charCount} chars &middot; {wordCount} words
              </span>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Write your markdown here..."
              className="w-full h-64 sm:h-80 md:h-[32rem] rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm font-mono text-mega-text placeholder-mega-muted/40 outline-none transition-colors focus:border-mega-accent resize-y"
              spellCheck={false}
            />
          </div>

          {/* Preview */}
          <div>
            <div className="mb-2">
              <label className="text-sm font-medium text-mega-muted">
                Preview
              </label>
            </div>
            <div className="h-64 sm:h-80 md:h-[32rem] overflow-y-auto rounded-xl border border-mega-border bg-mega-dark/50 p-3 sm:p-4 text-sm text-mega-text leading-relaxed break-words">
              {markdown.trim() ? (
                <div dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <p className="text-mega-muted/40">
                  Preview will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
