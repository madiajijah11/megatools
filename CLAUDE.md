# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build with type-checking (Next.js + Turbopack)
- `npm run lint` — ESLint (Flat Config via `eslint.config.mjs`)
- No test framework is configured.

## Architecture

**MegaTools** is a Next.js 16 App Router site — 28 client-side developer and cybersecurity tools that run entirely in the browser (no server-side data handling). Built with React 19, TypeScript, and Tailwind CSS v4.

### Tech Stack

- Next.js 16 / React 19 / TypeScript 5
- Tailwind CSS v4 — configured entirely via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css`. No `tailwind.config.js`.
- Dependencies: `pdf-lib` (PDF manipulation), `js-yaml` (YAML parser), `qrcode` (QR generator), `@mdx-js/mdx` (Markdown renderer), `@vercel/analytics` (Vercel Analytics).
- All other tools use native browser APIs (Canvas, Web Crypto API, TextEncoder, Intl, clipboard).
- Deployed on Vercel at `https://megatools.vercel.app`.

### Directory Layout

```
src/
  app/
    globals.css                   # Tailwind + custom tokens (#0a0f0d, #4ade80) + animations
    layout.tsx                    # Root layout: sticky terminal header, footer, JSON-LD, analytics
    page.tsx                      # Homepage: CLI command hero, instant search, tool grid
    sitemap.ts / robots.ts        # Dynamic SEO outputs (derives from TOOLS array)
    <tool-name>/
      page.tsx                    # Server component — exports Metadata
      <Tool>Client.tsx            # "use client" — all interactive logic
  components/
    InfoPanel.tsx                 # Sidebar: steps, stats, tips, example
    MobileInfoDrawer.tsx          # Slide-in drawer for mobile
    CopyButton.tsx                # Clipboard copy with feedback
    TechBadge.tsx                 # Tech label badge bracket format [tech]
    QuickSwitchBar.tsx            # Top nav bar (tool switcher)
  lib/
    tool-data.ts                  # ToolInfo interface + TOOLS (28 tools) + TOOL_CATEGORIES
```

### Design System — Dark Terminal Theme

Custom tokens in `globals.css` via `@theme inline`:

| Token | Tailwind Class | Value |
|---|---|---|
| `--color-bg-page` | `bg-bg-page` | `#0a0f0d` |
| `--color-bg-card` | `bg-bg-card` | `#101713` |
| `--color-border-subtle` | `border-border-subtle` | `#1f2b24` |
| `--color-accent` | `bg-accent` / `text-accent` | `#4ade80` |
| `--color-accent-hover` | `hover:bg-accent-hover` | `#22c55e` |
| `--color-accent-soft` | `bg-accent-soft` | `rgba(74, 222, 128, 0.12)` |
| `--color-text-primary` | `text-text-primary` | `#d6e8dc` |
| `--color-text-secondary` | `text-text-secondary` | `#8aa396` |
| `--color-text-muted` | `text-text-muted` | `#5a6f63` |
| `--color-success` | `text-success` / `bg-success` | `#34d399` |
| `--color-error` | `text-error` / `bg-error` | `#f87171` |
| `--color-warning` | `text-warning` / `bg-warning` | `#fbbf24` |

### Tool Page Pattern

Every tool uses a two-file pattern:

1. **`page.tsx`** — Server component. Exports `Metadata` for SEO. Renders the client component.
2. **`<Tool>Client.tsx`** — `"use client"`. Contains all state, event handlers, and browser API calls with InfoPanel + MobileInfoDrawer.

When adding a new tool: add to `TOOLS` and `TOOL_CATEGORIES` in `src/lib/tool-data.ts`, then create `page.tsx` + `<Tool>Client.tsx`.
