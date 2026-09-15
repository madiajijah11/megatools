# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build with type-checking (Next.js + Turbopack)
- `npm run lint` — ESLint (Flat Config via `eslint.config.mjs`)
- `npm run indexnow` — Submit all tool URLs to IndexNow (Bing / Yandex)
- No test framework is configured.

## Architecture

**MegaTools** is a Next.js 16 App Router site — 85 client-side developer, media, blockchain, AI, and cybersecurity tools that run entirely in the browser (no server-side data handling). Built with React 19, TypeScript, and Tailwind CSS v4.

### Tech Stack

- Next.js 16 / React 19 / TypeScript 5
- Tailwind CSS v4 — configured entirely via `@import "tailwindcss"` + `@theme inline` in `src/app/globals.css`. No `tailwind.config.js`.
- Dependencies: `pdf-lib` (PDF manipulation), `js-yaml` (YAML parser), `sql-formatter` (SQL beautifier), `qrcode` (QR generator), `@mdx-js/mdx` (Markdown renderer), `@vercel/analytics` (Vercel Analytics).
- All other tools use native browser APIs (Canvas, Web Audio API, MediaRecorder API, Web Crypto API, TextEncoder, Intl, clipboard).
- Deployed on Vercel at `https://megatools-tau.vercel.app`.

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
    tool-data.ts                  # ToolInfo interface + TOOLS (85 tools) + TOOL_CATEGORIES
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

Every tool uses a standardized two-file pattern wrapped with `<ToolLayout />`:

- **Scaffolding**: Run `npm run make:tool <tool-slug> "<Tool Title>" <category> "<Tech>"` to generate templates automatically.
1. **`page.tsx`** — Server component. Exports complete SEO `Metadata` (`title: "<Tool> — MegaTools"`, `description`, `keywords`, `openGraph`, `alternates: { canonical: "/<tool-slug>" }`). Renders the client component.
2. **`<Tool>Client.tsx`** — `"use client"`. Contains state, event handlers, and browser API logic.
   - **Mandatory `<ToolLayout />`**: Must wrap entire view with `<ToolLayout toolId="<tool-slug>" stats={stats}>`. Never write custom page headers, custom back links, or custom mobile drawers.
   - **Typography**: Geist Mono / `JetBrains Mono` (`font-mono`) for all numbers, hashes, keys, metrics, addresses, and hex tables.
   - **Zero Leakage**: 100% client-side execution. No user inputs sent to any remote server.

### Tool Addition Checklist

When adding any new tool:
1. **Registry & Category Sync**: Add to `TOOLS` and register `tool.id` in `TOOL_CATEGORIES` under the target category's `toolIds` array in `src/lib/tool-data.ts`.
2. **Create Routes**: Implement `src/app/<tool-slug>/page.tsx` and `src/app/<tool-slug>/<Tool>Client.tsx`.
3. **Changelog & README**: Add an entry in `src/lib/changelog-data.ts` (`CHANGELOG_ITEMS`) and add a row to the matching category table in `README.md`.
4. **SEO & Indexing**: Dynamic sitemap automatically includes the tool. Run `npm run indexnow` after deployment to ping search engines (Bing, Yandex).
5. **Verification**: Run `npx tsc --noEmit` and `npm run build` before committing.

## Development Workflow & Rules

Refer to `ARCHITECTURE.md` for complete system design and component specifications.

1. **Plan & Confirm First**: For all feature requests, design changes, or non-trivial fixes, present an implementation plan before writing code.
2. **Realtime To-Dos**: Track progress actively using todo tools — update task status step-by-step as each task begins and finishes.
3. **2-Column Layout Alignment**: Keep input/output header bars at `h-8 flex items-center justify-between` with compact font-mono buttons to prevent vertical misalignments.
4. **Verification Before Commit**: Always verify builds with `npx tsc --noEmit` and `npm run build` to ensure clean builds before pushing commits.
5. **Changelog Record**: Whenever adding a new tool, updating features/capabilities, or applying significant fixes, record the update in `src/lib/changelog-data.ts` (`CHANGELOG_ITEMS`).
