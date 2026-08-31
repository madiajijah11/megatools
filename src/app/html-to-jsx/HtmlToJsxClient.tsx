"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const ATTRIBUTE_MAP: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  maxlength: "maxLength",
  minlength: "minLength",
  novalidate: "noValidate",
  crossorigin: "crossOrigin",
  srcset: "srcSet",
  // SVG Attributes
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-opacity": "strokeOpacity",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "clip-rule": "clipRule",
  "clip-path": "clipPath",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-weight": "fontWeight",
  "text-anchor": "textAnchor",
  "dominant-baseline": "dominantBaseline",
  "color-interpolation-filters": "colorInterpolationFilters",
  "xmlns:xlink": "xmlnsXlink",
  "xlink:href": "xlinkHref",
};

const VOID_TAGS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr"
]);

function cssPropToCamelCase(prop: string): string {
  return prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function parseStyleString(styleStr: string): string {
  const declarations = styleStr.split(";").filter((d) => d.trim().length > 0);
  const objEntries: string[] = [];

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;
    const key = decl.slice(0, colonIdx).trim();
    const val = decl.slice(colonIdx + 1).trim();
    if (!key) continue;

    const camelKey = cssPropToCamelCase(key);
    objEntries.push(`${camelKey}: "${val.replace(/"/g, '\\"')}"`);
  }

  return `style={{ ${objEntries.join(", ")} }}`;
}

function convertHtmlToJsx(html: string): string {
  if (!html.trim()) return "";

  let result = html;

  // 1. Convert HTML comments <!-- ... --> to {/* ... */}
  result = result.replace(/<!--([\s\S]*?)-->/g, "{/*$1*/}");

  // 2. Replace style="..." with style={{ ... }}
  result = result.replace(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (_, doubleVal, singleVal) => {
    const styleContent = doubleVal !== undefined ? doubleVal : singleVal;
    return parseStyleString(styleContent);
  });

  // 3. Replace standard & SVG attributes
  for (const [htmlAttr, jsxAttr] of Object.entries(ATTRIBUTE_MAP)) {
    const regex = new RegExp(`\\b${htmlAttr}\\s*=`, "gi");
    result = result.replace(regex, `${jsxAttr}=`);
  }

  // 4. Ensure void tags are self-closing: <img src="..."> -> <img src="..." />
  result = result.replace(/<([a-zA-Z0-9_-]+)([^>]*?)>/g, (fullMatch, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();
    if (VOID_TAGS.has(lowerTag) && !attrs.trim().endsWith("/")) {
      return `<${tagName}${attrs} />`;
    }
    return fullMatch;
  });

  return result;
}

const SAMPLE_HTML = `<div class="card-container" id="main">
  <!-- User notification banner -->
  <div class="alert alert-info" style="margin-top: 12px; font-weight: bold;">
    <span>Welcome back!</span>
    <img src="/avatar.png" alt="Profile" class="avatar">
  </div>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 8v4l3 3"></path>
  </svg>
  <label for="username">Username</label>
  <input type="text" id="username" class="form-control" tabindex="1">
</div>`;

export default function HtmlToJsxClient() {
  const [htmlInput, setHtmlInput] = useState(SAMPLE_HTML);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const jsxOutput = useMemo(() => convertHtmlToJsx(htmlInput), [htmlInput]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">JSX Output Lines</p>
        <p className="text-accent font-mono font-bold">{jsxOutput.split("\n").length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Transformations</p>
        <p className="text-text-primary font-mono text-xs">HTML / SVG / Style</p>
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
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">HTML & SVG to JSX Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Transform standard HTML and raw SVG into React & Next.js compliant JSX with camelCase attributes and style objects.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              HTML / SVG Input:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHtmlInput(SAMPLE_HTML)}
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                [Sample HTML]
              </button>
              <button
                type="button"
                onClick={() =>
                  setHtmlInput(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-activity"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`
                  )
                }
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                [Sample SVG]
              </button>
              <button
                type="button"
                onClick={() => setHtmlInput("")}
                className="text-xs text-text-muted hover:text-error transition-colors"
              >
                [Clear]
              </button>
            </div>
          </div>

          {/* Side-by-side or stacked layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="h-8 flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  HTML / SVG Input:
                </label>
                {htmlInput && (
                  <button
                    type="button"
                    onClick={() => setHtmlInput("")}
                    className="text-xs font-mono text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle/60 hover:border-error/40 bg-bg-page/60"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="Paste HTML or SVG code here..."
                className="w-full h-[320px] rounded-lg bg-bg-page border border-border-subtle p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-none"
                spellCheck={false}
              />
            </div>

            <div>
              <div className="h-8 flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  React JSX Output:
                </label>
                {jsxOutput && (
                  <CopyButton
                    text={jsxOutput}
                    className="text-xs font-mono px-2 py-1 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 hover:bg-accent-soft transition-colors cursor-pointer"
                  />
                )}
              </div>
              <div className="relative rounded-lg bg-bg-page border border-border-subtle p-3 font-mono text-xs text-text-primary overflow-x-auto h-[320px] overflow-y-auto">
                <pre className="whitespace-pre">{jsxOutput || "// Converted JSX will appear here"}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden lg:block">
          <InfoPanel toolId="html-to-jsx" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="html-to-jsx" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
