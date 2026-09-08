<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MegaTools Development Workflow & Rules

Refer to `ARCHITECTURE.md` and `CLAUDE.md` for complete system design and component specifications.

1. **Plan & Confirm First**: For all feature requests, design changes, or non-trivial fixes, present an implementation plan before writing code.
2. **Realtime To-Dos**: Track progress actively using todo tools — update task status step-by-step as each task begins and finishes.
3. **Tool Registry & Category Sync**:
   - Register in `TOOLS` in `src/lib/tool-data.ts` with full `ToolInfo` schema (`id`, `title`, `shortTitle`, `description`, `href`, `category`, `tech`, `steps`, `tips`, `example`).
   - Register `tool.id` in `TOOL_CATEGORIES` under the matching category `toolIds` array (critical for category filtering & dropdown menu).
4. **Two-File Tool Standard**:
   - `src/app/<tool-slug>/page.tsx`: Server component exporting complete SEO `Metadata` (`title` with `— MegaTools`, `description`, `keywords`, `openGraph`, `alternates: { canonical: "/<tool-slug>" }`).
   - `src/app/<tool-slug>/<ToolName>Client.tsx`: `"use client"` component.
     - **Layout**: 2-column input/output headers must strictly use `h-8 flex items-center justify-between` with compact font-mono action buttons to eliminate vertical misalignment.
     - **Typography**: `JetBrains Mono` (`font-mono`) for all numbers, metrics, hashes, hex values, and tabular data.
     - **Help Panels**: Mount desktop `InfoPanel` and mobile `MobileInfoDrawer` via `getToolInfo("<tool-id>")`.
     - **Zero Leakage**: 100% Client-side execution. User data never leaves the browser.
5. **Changelog & Documentation**:
   - Record additions/updates in `src/lib/changelog-data.ts` (`CHANGELOG_ITEMS`).
   - Add new tool row to category table in `README.md`.
6. **SEO & Indexing Pipeline**:
   - Verify dynamic sitemap in `src/app/sitemap.ts` reflects the route.
   - Run `npm run indexnow` after release to ping search engines (Bing, Yandex) with updated routes.
7. **Verification Gate**:
   - Always verify with `npx tsc --noEmit` and `npm run build` to ensure zero type errors or broken builds before pushing commits.
