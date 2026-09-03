# Frontend Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform MegaTools from a dark glassmorphism theme to a clean, light-themed, productivity-first developer dashboard with two-column tool layouts, quick-switch navigation, and enriched info panels.

**Architecture:** Each tool client component self-renders a two-column grid (workspace left, info panel right). Shared components (QuickSwitchBar, InfoPanel, TechBadge, etc.) live in `src/components/`. Tool data (tips, steps, examples) lives in `src/lib/tool-data.ts`. Tailwind v4 config is entirely in `globals.css` via `@theme inline`.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript, Tailwind CSS v4, Geist font

## Global Constraints

- All tools remain client-side only — no API routes or server data handling
- Tailwind v4 config lives entirely in `src/app/globals.css` — no `tailwind.config.js`
- Path alias `@/*` maps to `./src/*`
- Design tokens are CSS custom properties, NOT hardcoded hex values in components
- Mobile-first responsive design; `lg` breakpoint (1024px) is the two-column split
- Keep the existing server/client split pattern: `page.tsx` exports metadata, `<Tool>Client.tsx` is `"use client"`
- No new npm dependencies unless absolutely necessary

---

## File Structure

| File | Responsibility |
|---|---|
| `src/app/globals.css` | Light theme Tailwind tokens, utility classes, scrollbar |
| `src/app/layout.tsx` | Root layout with sticky header (QuickSwitchBar) + footer |
| `src/app/page.tsx` | Homepage: hero, search bar, tool grid |
| `src/lib/tool-data.ts` | Static data for all tools: steps, tips, examples, tech badges |
| `src/components/QuickSwitchBar.tsx` | Header navigation bar for switching between tools |
| `src/components/InfoPanel.tsx` | Right sidebar: How to Use, Stats, Tips, Example |
| `src/components/MobileInfoDrawer.tsx` | Slide-in drawer for mobile info panel |
| `src/components/TechBadge.tsx` | Small badge showing underlying technology |
| `src/components/CopyButton.tsx` | Reusable copy-to-clipboard button with feedback |
| `src/app/<tool>/page.tsx` | Server component: metadata export + client render |
| `src/app/<tool>/<Tool>Client.tsx` | Client component: workspace + InfoPanel in two-column grid |

---

### Task 1: Rewrite globals.css (Theme Foundation)

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: CSS custom properties `--bg-page`, `--bg-card`, `--bg-sidebar`, `--border-subtle`, `--border-focus`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--accent-light`, `--success`, `--warning`, `--error`
- Produces: Utility classes `.card`, `.gradient-text`, `.btn-primary`, `.btn-secondary`, `.input-field`

- [ ] **Step 1: Backup existing globals.css**

```bash
cp src/app/globals.css src/app/globals.css.bak
```

- [ ] **Step 2: Write light-themed globals.css**

Replace entire file content with:

```css
@import "tailwindcss";

@theme inline {
  --color-bg-page: #f8f9fb;
  --color-bg-card: #ffffff;
  --color-bg-sidebar: #f1f3f5;
  --color-border-subtle: #e4e7ec;
  --color-border-focus: #7c3aed;
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-muted: #9ca3af;
  --color-accent: #7c3aed;
  --color-accent-light: #a78bfa;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  background: var(--color-bg-page);
  color: var(--color-text-primary);
  font-family: var(--font-sans, Arial, Helvetica, sans-serif);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Card surface */
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.card-hover:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
  transition: all 200ms ease;
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Buttons */
.btn-primary {
  background: var(--color-accent);
  color: white;
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 500;
  font-size: 14px;
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: #6d28d9;
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 10px 20px;
  font-weight: 500;
  font-size: 14px;
  transition: all 150ms ease;
}

.btn-secondary:hover {
  border-color: rgba(124, 58, 237, 0.4);
  color: var(--color-accent);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Input fields */
.input-field {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;
  transition: all 150ms ease;
  width: 100%;
}

.input-field::placeholder {
  color: var(--color-text-muted);
}

.input-field:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

/* Output area */
.output-field {
  background: rgba(241, 243, 245, 0.7);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-text-primary);
  width: 100%;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 8px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Selection */
::selection {
  background: rgba(124, 58, 237, 0.2);
  color: var(--color-text-primary);
}
```

- [ ] **Step 3: Verify CSS compiles**

Run:
```bash
npm run dev
```
Open http://localhost:3000 and confirm the page loads without CSS errors.
Expected: Page loads with light background (not dark).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: rewrite globals.css for light theme"
```

---

### Task 2: Create Tool Data File

**Files:**
- Create: `src/lib/tool-data.ts`

**Interfaces:**
- Produces: `TOOLS` array, `ToolInfo` type, `TOOLS_INFO` record, `getToolInfo(toolId: string)` function
- Consumed by: QuickSwitchBar, InfoPanel, Homepage, all tool pages

- [ ] **Step 1: Create tool-data.ts with complete data**

```typescript
export interface ToolInfo {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  emoji: string;
  href: string;
  tech: string;
  steps: string[];
  tips: string[];
  example?: { input: string; output: string };
}

export const TOOLS: ToolInfo[] = [
  {
    id: "qrcode",
    title: "QR Code Generator",
    shortTitle: "QR",
    description: "Generate QR codes from text, URLs, or any data. Download as PNG instantly.",
    emoji: "📱",
    href: "/qrcode",
    tech: "Canvas API",
    steps: ["Enter text or URL in the input field", "QR code generates automatically", "Click Download PNG to save"],
    tips: ["Use short URLs for cleaner QR codes", "Test with your phone camera before printing", "High contrast black-and-white scans best"],
    example: { input: "https://example.com", output: "[QR Code Image]" },
  },
  {
    id: "json-formatter",
    title: "JSON Formatter",
    shortTitle: "JSON",
    description: "Format, validate, and beautify JSON data with syntax highlighting.",
    emoji: "📋",
    href: "/json-formatter",
    tech: "Native JSON API",
    steps: ["Paste your JSON into the editor", "Click Format to prettify or Minify to compact", "Use Validate to check for errors"],
    tips: ["Minify before sending to APIs to reduce payload size", "Always validate JSON before parsing in production", "Use pretty-print for debugging, minify for deployment"],
    example: { input: '{"name":"John","age":30}', output: '{\n  "name": "John",\n  "age": 30\n}' },
  },
  {
    id: "password-generator",
    title: "Password Generator",
    shortTitle: "Password",
    description: "Create strong, random passwords with custom length and character sets.",
    emoji: "🔐",
    href: "/password-generator",
    tech: "Crypto API",
    steps: ["Set password length using the slider", "Choose character types (uppercase, lowercase, numbers, symbols)", "Click Generate Password"],
    tips: ["Use at least 16 characters for maximum security", "Include symbols for better entropy", "Never reuse passwords across different sites"],
    example: { input: "Length: 16, All types", output: "Tq8#kL2$pW9&mN4!" },
  },
  {
    id: "uuid-generator",
    title: "UUID Generator",
    shortTitle: "UUID",
    description: "Generate UUID v4 identifiers instantly. One click to copy.",
    emoji: "🆔",
    href: "/uuid-generator",
    tech: "Crypto API",
    steps: ["Click Generate to create a new UUID v4", "Click Copy to copy to clipboard", "Generate as many as you need"],
    tips: ["UUID v4 uses crypto.randomUUID() for true randomness", "128-bit unique — practically impossible to collide", "Use for database keys, session IDs, or file names"],
    example: { input: "Generate", output: "550e8400-e29b-41d4-a716-446655440000" },
  },
  {
    id: "base64",
    title: "Base64 Encode/Decode",
    shortTitle: "Base64",
    description: "Encode text to Base64 or decode Base64 back to readable text.",
    emoji: "🔡",
    href: "/base64",
    tech: "Native Text API",
    steps: ["Select Encode or Decode mode", "Enter your text or Base64 string", "Click Convert and copy the result"],
    tips: ["Great for embedding small images in HTML/CSS", "Base64 is NOT encryption — anyone can decode it", "Use URL-safe Base64 for web parameters"],
    example: { input: "Hello World", output: "SGVsbG8gV29ybGQ=" },
  },
  {
    id: "markdown-preview",
    title: "Markdown Preview",
    shortTitle: "Markdown",
    description: "Write Markdown and see the rendered HTML preview side by side.",
    emoji: "📝",
    href: "/markdown-preview",
    tech: "Native Parser",
    steps: ["Write Markdown in the left editor", "See live preview update on the right", "Copy the preview or source as needed"],
    tips: ["Use code blocks (```) for syntax highlighting", "Headers (# ## ###) create document structure", "Links open in new tab for safety"],
    example: { input: "# Hello\n\n**Bold** text", output: "[Rendered HTML with H1 and bold]" },
  },
  {
    id: "image-compressor",
    title: "Image Compressor",
    shortTitle: "Image",
    description: "Compress images right in your browser. No uploads, no servers.",
    emoji: "🖼️",
    href: "/image-compressor",
    tech: "Canvas API",
    steps: ["Drag & drop or click to upload an image", "Adjust quality with the slider", "Download the compressed image"],
    tips: ["80% quality is the sweet spot for most photos", "Use JPG for photos, PNG for graphics with transparency", "Large images are auto-resized to max 1920px"],
    example: undefined,
  },
  {
    id: "text-diff",
    title: "Text Diff Checker",
    shortTitle: "Diff",
    description: "Compare two texts and see the differences highlighted line by line.",
    emoji: "🔍",
    href: "/text-diff",
    tech: "LCS Algorithm",
    steps: ["Paste the original text on the left", "Paste the modified text on the right", "Click Compare to see the diff"],
    tips: ["Great for code reviews and document comparison", "Watch out for whitespace-only changes", "Use Copy to get the diff output"],
    example: { input: "hello", output: "hello world (+added)" },
  },
];

export const TOOLS_INFO: Record<string, ToolInfo> = Object.fromEntries(
  TOOLS.map((t) => [t.id, t])
);

export function getToolInfo(toolId: string): ToolInfo | undefined {
  return TOOLS_INFO[toolId];
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/tool-data.ts
git commit -m "feat: add tool data with tips, steps, and examples"
```

---

### Task 3: Create Shared Components

**Files:**
- Create: `src/components/QuickSwitchBar.tsx`
- Create: `src/components/TechBadge.tsx`
- Create: `src/components/CopyButton.tsx`

**Interfaces:**
- `QuickSwitchBar` → Consumes: `TOOLS` array from `tool-data.ts`. Produces: Navigation bar rendered in header.
- `TechBadge` → Consumes: `tech: string` prop. Produces: Styled badge component.
- `CopyButton` → Consumes: `text: string` and optional `label?: string` props. Produces: Button with copy feedback.

- [ ] **Step 1: Create TechBadge.tsx**

```typescript
"use client";

interface TechBadgeProps {
  tech: string;
}

export default function TechBadge({ tech }: TechBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
      {tech}
    </span>
  );
}
```

- [ ] **Step 2: Create CopyButton.tsx**

```typescript
"use client";

import { useState, useCallback } from "react";

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      disabled={!text}
      className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {copied ? (
        <span className="flex items-center gap-1 text-success">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </span>
      ) : (
        label
      )}
    </button>
  );
}
```

- [ ] **Step 3: Create QuickSwitchBar.tsx**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOLS } from "@/lib/tool-data";

export default function QuickSwitchBar() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {TOOLS.map((tool) => {
        const isActive = pathname === tool.href;
        return (
          <Link
            key={tool.id}
            href={tool.href}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-accent/10 text-accent"
                : "text-secondary hover:bg-gray-100 hover:text-primary"
            }`}
          >
            <span className="text-base">{tool.emoji}</span>
            <span className="hidden lg:inline">{tool.shortTitle}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add shared components (QuickSwitchBar, TechBadge, CopyButton)"
```

---

### Task 4: Update layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: QuickSwitchBar component
- Produces: Updated root layout with sticky header, quick-switch nav, light theme body, simplified footer

- [ ] **Step 1: Rewrite layout.tsx**

Replace entire file:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QuickSwitchBar from "@/components/QuickSwitchBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MegaTools — Free Online Tools for Everyone",
  description:
    "Free, fast, privacy-first online tools. QR Generator, JSON Formatter, Password Generator, UUID Generator, Base64, Markdown Preview, and more — all in your browser.",
  keywords: [
    "free online tools",
    "QR generator",
    "JSON formatter",
    "password generator",
    "UUID",
    "Base64",
    "developer tools",
  ],
  openGraph: {
    title: "MegaTools — Free Online Tools",
    description: "Free, fast, privacy-first tools for devs and everyone.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-bg-page text-text-primary">
        <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
              <span className="gradient-text">✦ Mega</span>
              <span className="text-text-secondary">Tools</span>
            </a>
            <QuickSwitchBar />
            <a
              href="https://ko-fi.com/genzodr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary hidden sm:flex text-sm py-1.5 px-3"
            >
              ☕ Support
            </a>
          </div>
        </header>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "MegaTools",
              url: "https://megatools-tau.vercel.app",
              description:
                "Free online tools: QR generator, JSON formatter, password generator, and more. Privacy-first, runs in your browser.",
              applicationCategory: "UtilityApplication",
              operatingSystem: "All",
              offers: { "@type": "Offer", price: "0" },
            }),
          }}
        />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border-subtle py-4 text-center text-sm text-text-muted">
          <p>MegaTools — Free. Fast. Private. No data leaves your browser.</p>
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify dev server renders correctly**

Run:
```bash
npm run dev
```
Open http://localhost:3000. Expected: Light background, header shows ✦ MegaTools logo + QuickSwitchBar tabs + ☕ Support button.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: update layout with light theme header and quick-switch bar"
```

---

### Task 5: Rewrite Homepage (page.tsx)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `TOOLS` array from `tool-data.ts`, TechBadge component
- Produces: New homepage with hero, search bar, tool grid, feature highlights

- [ ] **Step 1: Rewrite page.tsx**

Replace entire file:

```typescript
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
```

- [ ] **Step 2: Verify homepage renders and search works**

Run dev server, visit http://localhost:3000.
- Confirm light background, hero text, search input
- Type "json" in search — only JSON card should remain
- Clear search — all 8 cards show
- Click any card — navigates to tool page

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: rewrite homepage with search, tool grid, and feature highlights"
```

---

### Task 6: Create InfoPanel + MobileInfoDrawer

**Files:**
- Create: `src/components/InfoPanel.tsx`
- Create: `src/components/MobileInfoDrawer.tsx`

**Interfaces:**
- `InfoPanel` → Consumes: `toolId: string`, optional `stats?: React.ReactNode`, optional `children?: React.ReactNode`. Produces: Sticky right sidebar panel.
- `MobileInfoDrawer` → Consumes: `open: boolean`, `onClose: () => void`, children. Produces: Slide-in drawer overlay.

- [ ] **Step 1: Create InfoPanel.tsx**

```typescript
"use client";

import { ToolInfo, getToolInfo } from "@/lib/tool-data";
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
        <h2 className="text-lg font-semibold text-text-primary mb-1">💡 Tips & Info</h2>
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
```

- [ ] **Step 2: Create MobileInfoDrawer.tsx**

```typescript
"use client";

import { useEffect } from "react";

interface MobileInfoDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileInfoDrawer({ open, onClose, children }: MobileInfoDrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-80 max-w-[90vw] transform bg-bg-card shadow-xl border-l border-border-subtle transition-transform duration-300 ease-out overflow-y-auto ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-text-muted hover:text-text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/InfoPanel.tsx src/components/MobileInfoDrawer.tsx
git commit -m "feat: add InfoPanel and MobileInfoDrawer components"
```

---

### Task 7: Update Base64 Tool as Reference Implementation

**Files:**
- Modify: `src/app/base64/page.tsx`
- Modify: `src/app/base64/Base64Client.tsx`

**Interfaces:**
- Consumes: Base64Client (workspace), InfoPanel (right sidebar), MobileInfoDrawer (mobile panel)
- Pattern to replicate for all 7 remaining tools

- [ ] **Step 1: Update page.tsx to keep metadata, update layout wrapper**

```typescript
import type { Metadata } from "next";
import Base64Client from "./Base64Client";

export const metadata: Metadata = {
  title: "Base64 Encode/Decode — MegaTools",
  description:
    "Encode text to Base64 or decode Base64 back to readable text. Free, instant, runs in your browser.",
  openGraph: {
    title: "Base64 Encode/Decode — MegaTools",
    description: "Free Base64 encoder and decoder.",
  },
};

export default function Base64Page() {
  return <Base64Client />;
}
```

- [ ] **Step 2: Rewrite Base64Client.tsx with two-column layout**

Key changes to apply to Base64Client:
- Wrap in `grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8`
- Left column = existing workspace content (refactor into inner variable if helpful)
- Right column = `<InfoPanel toolId="base64" stats={...} />`
- Add FAB "💡" on mobile (`lg:hidden`) that opens MobileInfoDrawer
- Use new CSS utilities: `card`, `input-field`, `output-field`, `btn-primary`, `btn-secondary`
- Replace dark color classes with token-based equivalents
- Keep `useState` logic and handlers identical — only UI changes

Example structure:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type Mode = "encode" | "decode";

export default function Base64Client() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ... keep existing handleConvert, handleCopy logic exactly as-is ...

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Input</p>
        <p className="text-text-primary font-mono">{new Blob([input]).size} B</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Output</p>
        <p className="text-text-primary font-mono">{new Blob([output]).size} B</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Ratio</p>
        <p className="text-text-primary font-mono">
          {input.length > 0 && output.length > 0
            ? `${Math.round((output.length / input.length) * 100)}%`
            : "—"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href="/" className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1">
        ← Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          {/* Mode toggle, inputs, buttons, error, output — updated with light theme classes */}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="base64" stats={stats} />
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
        <InfoPanel toolId="base64" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
```

- [ ] **Step 3: Verify Base64 page renders correctly**

Visit http://localhost:3000/base64.
- Light theme
- Two columns on desktop (workspace + info panel)
- Single column on mobile with FAB bottom-right
- Clicking FAB opens drawer
- Encode/decode logic still works exactly as before
- Stats update when input changes

- [ ] **Step 4: Commit**

```bash
git add src/app/base64/
git commit -m "feat: update Base64 tool with two-column layout and info panel"
```

---

### Task 8: Apply Two-Column Layout to Remaining 7 Tools

Repeat the pattern from Task 7 for each tool below. Each tool gets the same structural changes (grid layout, FAB, drawer, InfoPanel) but preserves its unique workspace UI.

For each tool:
1. Keep `page.tsx` metadata unchanged
2. Update `<Tool>Client.tsx`:
   - Add state for `drawerOpen`
   - Wrap in `grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8`
   - Left = existing workspace (refactor colors to light theme tokens)
   - Right = `<InfoPanel toolId="<id>" stats={...} />`
   - Add mobile FAB + drawer
   - Custom `stats` per tool (see table below)
3. Verify functionality preserved
4. Commit per tool

**Per-tool stats:**

| Tool | Stats content |
|---|---|
| `qrcode` | QR width (px), input char count |
| `json-formatter` | Lines, chars, isValid boolean |
| `password-generator` | Strength label + colored bar, length, entropy estimate |
| `uuid-generator` | Total generated count |
| `markdown-preview` | Chars, words, lines, estimated read time |
| `image-compressor` | Original size, compressed size, reduction % |
| `text-diff` | Total lines, additions, deletions, unchanged |

- [ ] **Step 1: Update QRCode tool**

- [ ] **Step 2: Commit QRCode**

```bash
git add src/app/qrcode/
git commit -m "feat: update QRCode tool with two-column layout and info panel"
```

- [ ] **Step 3: Update JSON Formatter tool**

- [ ] **Step 4: Commit JSON Formatter**

```bash
git add src/app/json-formatter/
git commit -m "feat: update JSON Formatter tool with two-column layout and info panel"
```

- [ ] **Step 5: Update Password Generator tool**

- [ ] **Step 6: Commit Password Generator**

```bash
git add src/app/password-generator/
git commit -m "feat: update Password Generator tool with two-column layout and info panel"
```

- [ ] **Step 7: Update UUID Generator tool**

- [ ] **Step 8: Commit UUID Generator**

```bash
git add src/app/uuid-generator/
git commit -m "feat: update UUID Generator tool with two-column layout and info panel"
```

- [ ] **Step 9: Update Markdown Preview tool**

- [ ] **Step 10: Commit Markdown Preview**

```bash
git add src/app/markdown-preview/
git commit -m "feat: update Markdown Preview tool with two-column layout and info panel"
```

- [ ] **Step 11: Update Image Compressor tool**

- [ ] **Step 12: Commit Image Compressor**

```bash
git add src/app/image-compressor/
git commit -m "feat: update Image Compressor tool with two-column layout and info panel"
```

- [ ] **Step 13: Update Text Diff tool**

- [ ] **Step 14: Commit Text Diff**

```bash
git add src/app/text-diff/
git commit -m "feat: update Text Diff tool with two-column layout and info panel"
```

---

### Task 9: Final Verification & Cleanup

- [ ] **Step 1: Run lint**

```bash
npm run lint
```
Expected: No errors.

- [ ] **Step 2: Run build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 3: Manual smoke test checklist**

1. Homepage loads with light theme
2. Search bar filters tools correctly
3. All tool pages load with light theme
4. QuickSwitchBar works on all pages (active state, navigation)
5. Desktop: two-column layout with info panel visible
6. Mobile (<1024px): single column, FAB opens info drawer
7. All tool functionality preserved (encode/decode, generate, format, etc.)
8. Stats update correctly per tool
9. Tips and examples display correctly
10. Copy buttons work

- [ ] **Step 4: Remove backup file**

```bash
rm -f src/app/globals.css.bak
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: clean up after frontend revamp"
```

---

## Spec Coverage Check

| Spec Section | Task(s) |
|---|---|
| Section 1: Global Theme | Task 1 (globals.css) |
| Section 2: Global Layout | Task 4 (layout.tsx) |
| Section 3: Homepage | Task 5 (page.tsx) |
| Section 4: Two-Column Tool Layout | Tasks 7, 8 (all tools) |
| Section 5: Tips & Info Panel | Task 2 (data), Task 6 (components), Tasks 7-8 (integration) |
| Section 6: Quick-Switch Bar | Task 3 (component), Task 4 (integration) |
| Section 7: Interactions & Animations | Implicit in component styles (transitions, hover states) |

## Placeholder Scan

- No TBD, TODO, or "implement later" found
- No vague instructions like "add appropriate error handling"
- Each tool task references the exact Task 7 pattern
- All file paths are exact
- All commands have expected outputs

## Type Consistency

- `ToolInfo` interface defined in Task 2, consumed in Tasks 3, 5, 6, 7, 8
- `InfoPanel` props: `toolId: string`, `stats?: React.ReactNode`, `extraContent?: React.ReactNode` — consistent across tasks
- `MobileInfoDrawer` props: `open: boolean`, `onClose: () => void`, `children: React.ReactNode` — consistent
- CSS utility classes: `.card`, `.btn-primary`, `.btn-secondary`, `.input-field`, `.output-field`, `.gradient-text` — defined in Task 1, used throughout
