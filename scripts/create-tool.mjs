#!/usr/bin/env node

/**
 * MegaTools Scaffolding Script
 * Usage: node scripts/create-tool.mjs <tool-slug> [title] [category-id] [tech]
 * Example: node scripts/create-tool.mjs csp-builder "Content Security Policy Builder" crypto-security "CSP AST Engine"
 */

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Usage:
  node scripts/create-tool.mjs <tool-slug> [title] [category-id] [tech]

Examples:
  node scripts/create-tool.mjs csp-builder "CSP Policy Builder" crypto-security "CSP AST Engine"
  node scripts/create-tool.mjs har-viewer "HAR Waterfall Viewer" dev-network "HAR JSON Parser"
`);
  process.exit(1);
}

const slug = args[0].toLowerCase().trim();
const title = args[1] || slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
const category = args[2] || "dev-network";
const tech = args[3] || "Web Standards API";

// PascalCase component name
const pascalName = slug
  .split("-")
  .map(s => s.charAt(0).toUpperCase() + s.slice(1))
  .join("");

const rootDir = process.cwd();
const targetDir = path.join(rootDir, "src", "app", slug);

if (fs.existsSync(targetDir)) {
  console.error(`Error: Directory already exists at ${targetDir}`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// 1. Generate page.tsx
const pageContent = `import type { Metadata } from "next";
import ${pascalName}Client from "./${pascalName}Client";

export const metadata: Metadata = {
  title: "${title} — MegaTools",
  description: "Free client-side ${title.toLowerCase()} tool with zero data leakage.",
  keywords: ["${slug}", "${title.toLowerCase()}", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/${slug}",
  },
  openGraph: {
    title: "${title} — MegaTools",
    description: "Free client-side ${title.toLowerCase()} tool.",
    url: "https://megatools-tau.vercel.app/${slug}",
    type: "website",
  },
};

export default function ${pascalName}Page() {
  return <${pascalName}Client />;
}
`;

fs.writeFileSync(path.join(targetDir, "page.tsx"), pageContent, "utf8");

// 2. Generate Client Component with ToolLayout & BIP-39 Dark Terminal UI
const clientContent = `"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

export default function ${pascalName}Client() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Length:</span>
        <span className="text-accent font-bold">{input.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Execution Mode:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="${slug}" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Input Header */}
        <div className="h-8 flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary">Input Payload</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInput("")}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
            >
              [Clear]
            </button>
            <CopyButton text={input} label="Copy" />
          </div>
        </div>

        {/* Input Textarea */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter data here..."
          rows={6}
          className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
        />

        {/* Action Controls */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOutput(input.toUpperCase())}
            disabled={!input.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-bg-page font-mono text-xs font-bold hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Process
          </button>
        </div>

        {/* Output Area */}
        {output && (
          <div className="pt-4 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Processed Output</span>
              <CopyButton text={output} label="Copy Output" />
            </div>
            <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed">
              {output}
            </pre>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
`;

fs.writeFileSync(path.join(targetDir, `${pascalName}Client.tsx`), clientContent, "utf8");

console.log(`✅ Created tool route at src/app/${slug}/`);
console.log(`  - page.tsx`);
console.log(`  - ${pascalName}Client.tsx (using <ToolLayout />)`);
console.log(`\n👉 Next steps:`);
console.log(`1. Register "${slug}" in src/lib/tool-data.ts (TOOLS and TOOL_CATEGORIES)`);
console.log(`2. Add changelog entry in src/lib/changelog-data.ts`);
console.log(`3. Run `npx tsc --noEmit` to verify`);
