# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- No test framework is configured.

## Architecture

**MegaTools** is a Next.js 16 App Router site — a collection of client-side developer/utility tools. All processing happens in the browser; no server-side data handling.

### Tech Stack
- Next.js 16.2.6 / React 19 / TypeScript
- Tailwind CSS v4 (using `@import "tailwindcss"` + `@theme inline` in globals.css)
- Deployed on Vercel at `https://megatools.vercel.app`

### Tool Page Pattern (CRITICAL)

Every tool follows the same two-file pattern inside `src/app/<tool-name>/`:

1. **`page.tsx`** — Server component. Only exports `metadata` (for SEO) and renders the client component.
2. **`<Tool>Client.tsx`** — `"use client"` component containing all interactive logic and UI.

This split is intentional: `page.tsx` enables static metadata generation while the client component handles browser-only work (clipboard, canvas, DOM manipulation). Always follow this pattern when adding new tools.

### Design System

Dark theme with glassmorphism. Custom colors are defined as Tailwind theme tokens in `globals.css`:

| Token | Usage |
|---|---|
| `mega-dark` | Page background (#0a0a1a) |
| `mega-card` / `glass` class | Glass card surfaces with backdrop blur |
| `mega-border` | Border color |
| `mega-accent` / `mega-accent-light` | Purple accent (#7c3aed) |
| `mega-text` | Primary text |
| `mega-muted` | Secondary/muted text |

Use the `.glass` class for card containers and `.gradient-text` for accent headings.

### SEO

Each tool page exports its own `Metadata`. A global `sitemap.ts` and `robots.ts` exist at `src/app/`. Structured data (JSON-LD) is embedded in `layout.tsx`.

### Adding a New Tool

1. Create `src/app/<tool-name>/page.tsx` with metadata export
2. Create `src/app/<tool-name>/<Tool>Client.tsx` with `"use client"`
3. Add the tool to the `tools` array in `src/app/page.tsx`
4. Add the route to `pages` array in `src/app/sitemap.ts`
5. Optionally add a nav link in `src/app/layout.tsx`

## AGENTS.md

Next.js 16 may have breaking changes vs training data. When writing Next.js code, check `node_modules/next/dist/docs/` for current API docs.
