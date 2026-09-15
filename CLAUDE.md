# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (http://localhost:3000)
- `npm run build` — Production build with type-checking (Next.js + Turbopack)
- `npm run lint` — ESLint (Flat Config via `eslint.config.mjs`)
- `npm run make:tool <slug> "<Title>" <category> "<Tech>"` — Automated tool scaffolding
- `npm run indexnow` — Submit all tool URLs to IndexNow (Bing / Yandex)
- No test framework is configured.

## Architecture

**MegaTools** is a Next.js 16 App Router site — client-side developer, media, blockchain, AI, and cybersecurity tools that run entirely in the browser (no server-side data handling). Built with React 19, TypeScript, and Tailwind CSS v4.

### Design System — Dark Terminal Theme (BIP-39 Gold Standard)

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

### Mandatory Tool Addition Workflow (Zero-Mistake Protocol)

Every tool MUST adhere to these exact requirements:

1. **Scaffolding & Layout**:
   - Run `npm run make:tool <tool-slug> "<Tool Title>" <category> "<Tech>"`.
   - **Mandatory `<ToolLayout />`**: `<Tool>Client.tsx` MUST wrap entire view with `<ToolLayout toolId="<tool-slug>" stats={stats}>`. NEVER handcraft custom outer headers, back links, or mobile drawers.
   - Header action bars inside cards must strictly use `h-8 flex items-center justify-between` with font-mono buttons.
   - Zero Leakage: 100% Client-side execution in browser RAM.

2. **Registry & Category Synchronization**:
   - In `src/lib/tool-data.ts`:
     - Add tool to `TOOLS` with full `ToolInfo` schema.
     - **MANDATORY**: Register `tool.id` in `TOOL_CATEGORIES` under the matching category `toolIds` array (critical for homepage grid rendering & category filters).

3. **Changelog & Notification Bell ("What's New")**:
   - In `src/lib/changelog-data.ts`:
     - Add new `ChangelogItem` at the **TOP** of `CHANGELOG_ITEMS`.
     - **DATE RULE**: Must use the REAL current ISO date (`YYYY-MM-DD` from `new Date().toISOString().split('T')[0]`).
     - This automatically triggers the notification bell badge in the header and displays the release on `/changelog`.

4. **Documentation**:
   - Add new tool row to the matching category table in `README.md`.

5. **Verification**:
   - Run `npx tsc --noEmit` and ensure zero errors prior to committing.
