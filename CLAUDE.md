# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build with type-checking (Next.js + Turbopack)
- `npm run lint` — ESLint (Flat Config via `eslint.config.mjs`)
- No test framework is configured.

## Architecture

**MegaTools** is a Next.js 16 App Router site — 8 client-side developer tools that run entirely in the browser (no server-side data handling). Built with React 19, TypeScript, Tailwind CSS v4.

### Tech Stack

- Next.js 16.2.6 / React 19.2.4 / TypeScript 5
- Tailwind CSS v4 — configured entirely via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css`. No `tailwind.config.js`.
- `qrcode` npm package is the only external dependency beyond Next/React.
- All other tools use native browser APIs (Canvas, Crypto, TextEncoder, clipboard).
- Deployed on Vercel at `https://megatools.vercel.app`.

### Directory Layout

```
src/
  app/
    globals.css                   # Tailwind + custom utility classes + animations
    layout.tsx                    # Root layout: sticky header, footer, JSON-LD
    page.tsx                      # Homepage: hero, search, tool grid
    sitemap.ts / robots.ts        # SEO outputs
    <tool-name>/
      page.tsx                    # Server component — exports Metadata
      <Tool>Client.tsx            # "use client" — all interactive logic
  components/
    InfoPanel.tsx                 # Sidebar: steps, stats, tips, example
    MobileInfoDrawer.tsx          # Slide-in drawer for mobile
    CopyButton.tsx                # Clipboard copy with feedback
    TechBadge.tsx                 # Tech label badge
    QuickSwitchBar.tsx            # Top nav bar (tool switcher)
  lib/
    tool-data.ts                  # ToolInfo interface + TOOLS array + getToolInfo()
```

### Tool Page Pattern (CRITICAL)

Every tool uses a two-file pattern:

1. **`page.tsx`** — Server component. Exports `Metadata` for SEO. Renders the client component. This enables static metadata without client-side JS.
2. **`<Tool>Client.tsx`** — `"use client"`. Contains all state, event handlers, and browser API calls.

The client component follows this layout structure:

```tsx
<div className="mx-auto max-w-7xl px-4 py-8">
  {/* Back link */}
  <Link href="/" className="...">← Back to Tools</Link>

  <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
    {/* Left: Tool workspace inside .card */}
    <div className="card p-6 sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">
          <span className="gradient-text">Tool Title</span>
        </h1>
        <p className="mt-2 text-sm text-text-secondary">Description</p>
      </div>
      {/* Tool-specific inputs, buttons, output */}
    </div>

    {/* Right: Info Panel (hidden on mobile) */}
    <div className="hidden lg:block">
      <InfoPanel toolId="tool-id" stats={perToolStats} />
    </div>
  </div>

  {/* Mobile FAB + Drawer */}
  <button onClick={() => setDrawerOpen(true)}
    className="fixed bottom-6 right-6 z-30 lg:hidden ...">💡</button>
  <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
    <InfoPanel toolId="tool-id" stats={perToolStats} />
  </MobileInfoDrawer>
</div>
```

Each tool defines its own `stats` JSX (a `div.grid.grid-cols-2.gap-3.text-sm`) with tool-specific metrics (chars, lines, strength, reduction %, etc.).

### Design System — Light Theme

Custom tokens in `globals.css` via `@theme inline`. Use these Tailwind classes instead of hardcoded colors:

| Token | Tailwind Class | Value |
|---|---|---|
| `--color-bg-page` | `bg-bg-page` | `#f8fafc` |
| `--color-bg-card` | `bg-bg-card` | `#ffffff` |
| `--color-border-subtle` | `border-border-subtle` | `#e2e8f0` |
| `--color-accent` | `bg-accent` / `text-accent` | `#7c3aed` |
| `--color-accent-hover` | `hover:bg-accent-hover` | `#6d28d9` |
| `--color-accent-soft` | `bg-accent-soft` | `#f5f0ff` |
| `--color-text-primary` | `text-text-primary` | `#1e293b` |
| `--color-text-secondary` | `text-text-secondary` | `#475569` |
| `--color-text-muted` | `text-text-muted` | `#94a3b8` |
| `--color-success` | `text-success` / `bg-success` | `#10b981` |
| `--color-error` | `text-error` / `bg-error` | `#ef4444` |
| `--color-warning` | `text-warning` / `bg-warning` | `#f59e0b` |

Utility CSS classes (defined in `globals.css`):
- `.card` — White rounded card with subtle border
- `.card-hover` — Adds hover lift + accent border effect (for homepage grid)
- `.btn-primary` — Solid accent button (purple). Uses `btn-primary` class, not Tailwind utilities.
- `.btn-secondary` — Outlined button with card background. Uses `btn-secondary` class.
- `.input-field` — Text input/textarea with focus ring. Uses `input-field` class.
- `.output-field` — Read-only output display (mono font, page bg). Uses `output-field` class.
- `.gradient-text` — Accent-to-indigo gradient on headings. Uses `gradient-text` class.

### Tool Data Layer

All tool metadata lives in `src/lib/tool-data.ts` as `TOOLS: ToolInfo[]`. Each entry includes id, title, shortTitle, description, emoji, href, tech, steps[], tips[], and optional example. The `TOOLS` array drives:
- The homepage grid (`src/app/page.tsx`)
- QuickSwitchBar navigation (`src/components/QuickSwitchBar.tsx`)
- InfoPanel content (`src/components/InfoPanel.tsx` via `getToolInfo(id)`)

When adding a new tool: add to `TOOLS` array, then create `page.tsx` + `<Tool>Client.tsx`.

### Tool Implementations

| Tool | Key APIs | Notes |
|---|---|---|
| QR Code Generator | `qrcode` npm library, canvas download | Only tool with an external dep |
| JSON Formatter | `JSON.parse`/`JSON.stringify` | Format, minify, validate modes |
| Password Generator | `Math.random`, clipboard API | Strength scoring, 4 char sets |
| UUID Generator | `crypto.randomUUID()` | Single + bulk (up to 100) |
| Base64 Encode/Decode | `TextEncoder`/`TextDecoder`, `btoa`/`atob` | Encode/decode toggle |
| Markdown Preview | Custom regex parser with XSS sanitization | Strips `<img>`, `<script>`, `<iframe>`, `on*` handlers |
| Image Compressor | Canvas `toBlob`, drag-and-drop | Auto-resize >1920px, `URL.revokeObjectURL` cleanup |
| Text Diff Checker | LCS via DP table | Line-by-line diff |

### Shared Components

- **InfoPanel** (`src/components/InfoPanel.tsx`) — Consumes `getToolInfo(toolId)`, renders numbered steps, stats slot, tips list, optional example block, optional extra content slot.
- **MobileInfoDrawer** (`src/components/MobileInfoDrawer.tsx`) — Slide-in from right, backdrop overlay, locks body scroll when open. Max width 90vw / 320px.
- **QuickSwitchBar** (`src/components/QuickSwitchBar.tsx`) — Horizontal scrollable nav of emoji+shortTitle links, highlights active route via `usePathname()`.
- **CopyButton** (`src/components/CopyButton.tsx`) — Clipboard write with 2s "Copied!" feedback and checkmark icon.
- **TechBadge** (`src/components/TechBadge.tsx`) — Accent-colored pill label.

### Path Aliases

`@/*` maps to `./src/*` in `tsconfig.json`. Import shared components as `import Foo from "@/components/Foo"`.

### SEO

- Every tool page has its own `Metadata` export.
- `src/app/sitemap.ts` enumerates all tool routes.
- `src/app/robots.ts` allows all crawlers.
- Root layout includes `application/ld+json` structured data (WebApplication schema).

## AGENTS.md

Next.js 16 may have breaking changes vs training data. When writing Next.js code, check `node_modules/next/dist/docs/` for current API docs. Heed deprecation notices.
