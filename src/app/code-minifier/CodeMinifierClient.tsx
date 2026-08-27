"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .trim();
}

function beautifyHtml(html: string): string {
  let formatted = "";
  let indent = 0;
  const tab = "  ";

  // Clean raw html slightly
  const clean = html.replace(/>\s*</g, ">\n<").trim();
  const lines = clean.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const isClosing = line.startsWith("</");
    const isSelfClosing =
      line.endsWith("/>") ||
      /<(img|meta|link|br|hr|input|source|area|base|col|embed|param|track|wbr)[^>]*>/i.test(line);
    const isOpening = line.startsWith("<") && !isClosing && !isSelfClosing && !line.startsWith("<!--");

    if (isClosing) indent = Math.max(0, indent - 1);
    formatted += tab.repeat(indent) + line + "\n";
    if (isOpening) indent++;
  }

  return formatted.trim();
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{:;,>+~])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function beautifyCss(css: string): string {
  // First minify to standardize
  const clean = minifyCss(css);
  let formatted = "";
  let indent = 0;
  const tab = "  ";

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === "{") {
      formatted += " {\n";
      indent++;
      formatted += tab.repeat(indent);
    } else if (char === "}") {
      indent = Math.max(0, indent - 1);
      formatted = formatted.trimEnd() + "\n" + tab.repeat(indent) + "}\n\n" + tab.repeat(indent);
    } else if (char === ";") {
      formatted += ";\n" + tab.repeat(indent);
    } else {
      formatted += char;
    }
  }

  return formatted.trim();
}

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
  <!-- Main Header -->
  <head>
    <meta charset="UTF-8" />
    <title>MegaTools Demo</title>
  </head>
  <body>
    <div class="container">
      <h1>Hello World</h1>
      <p>Fast & Private Dev Tools</p>
    </div>
  </body>
</html>`;

const SAMPLE_CSS = `/* Navigation Styles */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0a0f0d;
  padding: 1rem 2rem;
}

.navbar .brand {
  color: #4ade80;
  font-family: monospace;
  font-weight: 700;
}`;

export default function CodeMinifierClient() {
  const [lang, setLang] = useState<"html" | "css">("html");
  const [action, setAction] = useState<"minify" | "beautify">("minify");
  const [input, setInput] = useState(SAMPLE_HTML);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const output = useMemo(() => {
    if (!input.trim()) return "";
    if (lang === "html") {
      return action === "minify" ? minifyHtml(input) : beautifyHtml(input);
    }
    return action === "minify" ? minifyCss(input) : beautifyCss(input);
  }, [input, lang, action]);

  const originalBytes = new TextEncoder().encode(input).length;
  const outputBytes = new TextEncoder().encode(output).length;
  const reductionPercent =
    originalBytes && outputBytes
      ? (((originalBytes - outputBytes) / originalBytes) * 100).toFixed(1)
      : null;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Original Size</p>
        <p className="text-text-primary font-mono">{originalBytes ? `${originalBytes} B` : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Result Size</p>
        <p className="text-text-primary font-mono">{outputBytes ? `${outputBytes} B` : "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">HTML &amp; CSS Minifier</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Minify or beautify HTML and CSS code to boost website speed and clean syntax.
            </p>
          </div>

          {/* Lang & Action Tabs */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="flex rounded border border-border-subtle bg-bg-page p-1">
              <button
                onClick={() => {
                  setLang("html");
                  setInput(SAMPLE_HTML);
                }}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  lang === "html"
                    ? "bg-accent text-bg-page font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                HTML Mode
              </button>
              <button
                onClick={() => {
                  setLang("css");
                  setInput(SAMPLE_CSS);
                }}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  lang === "css"
                    ? "bg-accent text-bg-page font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                CSS Mode
              </button>
            </div>

            <div className="flex rounded border border-border-subtle bg-bg-page p-1">
              <button
                onClick={() => setAction("minify")}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  action === "minify"
                    ? "border border-accent bg-accent-soft text-accent font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                $ minify
              </button>
              <button
                onClick={() => setAction("beautify")}
                className={`flex-1 py-1.5 rounded transition-colors ${
                  action === "beautify"
                    ? "border border-accent bg-accent-soft text-accent font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                $ beautify
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary font-mono">
                {lang.toUpperCase()} Source Input
              </label>
              <button
                onClick={() => setInput("")}
                className="text-xs text-text-muted hover:text-text-primary font-mono"
              >
                clear
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Paste ${lang.toUpperCase()} code here...`}
              className="input-field min-h-[140px] resize-y font-mono text-xs"
            />
          </div>

          {/* Output Area */}
          <div>
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-secondary font-mono">
                  {action === "minify" ? "Minified Output" : "Beautified Output"}
                </label>
                {action === "minify" && reductionPercent && Number(reductionPercent) > 0 && (
                  <span className="px-2 py-0.5 rounded bg-success/15 border border-success/30 text-success text-[11px] font-mono">
                    -{reductionPercent}% saved
                  </span>
                )}
              </div>
              <CopyButton text={output} label={`copy ${lang}`} />
            </div>
            <textarea
              readOnly
              value={output}
              placeholder="Processed code will appear here..."
              className="output-field min-h-[180px] resize-y font-mono text-xs text-accent whitespace-pre"
            />
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="code-minifier" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="code-minifier" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
