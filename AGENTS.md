<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MegaTools Development Workflow & Mandatory Rules

Refer to `ARCHITECTURE.md` and `CLAUDE.md` for complete system design and component specifications.

## ⚠️ MANDATORY TOOL ADDITION WORKFLOW (ZERO-MISTAKE PROTOCOL)

Every AI agent or developer adding, updating, or refactoring tools MUST strictly follow these 6 mandatory steps:

1. **Plan & Confirm First**:
   - Present an implementation plan with features, tech engine, and UI breakdown before writing code.

2. **Scaffolding & Layout Standard (<ToolLayout />)**:
   - Generate template via `npm run make:tool <tool-slug> "<Tool Title>" <category> "<Tech>"`.
   - `src/app/<tool-slug>/page.tsx`: Server component exporting complete SEO Metadata (`title: "<Tool> — MegaTools"`, `description`, `keywords`, `openGraph`, `alternates: { canonical: "/<tool-slug>" }`).
   - `src/app/<tool-slug>/<ToolName>Client.tsx`: MUST wrap entire tool view with `<ToolLayout toolId="<tool-slug>" stats={stats}>`.
   - **NEVER** write custom outer page headers, custom back links, or custom mobile drawers.
   - All input/output header bars inside cards must strictly use `h-8 flex items-center justify-between` with font-mono buttons.
   - Zero Leakage: 100% Client-side execution. User data never leaves browser RAM.

3. **Tool Registry & Category Sync (CRITICAL FOR HOMEPAGE & SEARCH)**:
   - In `src/lib/tool-data.ts`:
     a. Register in `TOOLS` with full `ToolInfo` schema (`id`, `title`, `shortTitle`, `description`, `emoji`, `href`, `tech`, `steps`, `tips`, `example`).
     b. **MUST ALSO REGISTER** `tool.id` in `TOOL_CATEGORIES` under the matching category `toolIds` array. If omitted, the tool will be INVISIBLE on the homepage and category filters!

4. **Changelog & Notification Bell ("What's New")**:
   - In `src/lib/changelog-data.ts`:
     - Add a new `ChangelogItem` entry at the **TOP** of `CHANGELOG_ITEMS` array.
     - **TYPE DISCIPLINE**: Select the exact matching `ChangeType`:
       - `"added"`: Brand new tool additions.
       - `"fixed"`: Bug fixes, parser edge cases, syntax repairs, or broken features.
       - `"improved"`: UI/UX enhancements, responsive layouts, or performance boosts.
       - `"updated"`: Data dictionary, spec version, or algorithm refactors.
     - **DATE RULE**: `date` MUST use the **REAL current system ISO date** (`YYYY-MM-DD` from `new Date().toISOString().split('T')[0]`). NEVER hardcode past or arbitrary placeholder dates.
     - This directly triggers the unread notification bell badge in the header and lists the release on `/changelog`.

5. **Documentation & README**:
   - Add the new tool row to the matching category table in `README.md` and update the count.

6. **Verification Gate**:
   - Always run `npx tsc --noEmit` to guarantee zero type errors.
   - When committing in confined environments, use `git commit --no-gpg-sign -m "..."`.

<!-- OPENWIKI:START -->

## OpenWiki

This repository has a generated `openwiki/` evidence index. It is optional just-in-time context, not required startup reading.

- Do not enumerate, preload, or search wikis at task start. Use retrieval when the user asks for it, when unfamiliar architecture or dependency behavior materially affects the task, or when source inspection leaves an important uncertainty. Stop once the question is grounded.
- When those conditions apply and OpenWiki retrieval tools are available, use `openwiki_search` for just-in-time context and `openwiki_read` for the relevant complete sections. If search returns `workspace_required`, ask which listed workspace to use and retry with its ID.
- Use `openwiki_list_workspaces` or `openwiki_list_wikis` when workspace membership itself needs to be discovered.
- If the retrieval tools are unavailable, read `openwiki/quickstart.md` and follow its links to the relevant pages.
- Treat source code and tests as authoritative. A brief's unknowns and review items are verification gaps, not automatic requirements.
- Prefer the narrowest quiet validation that proves the changed behavior. Preserve complete failure output.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->
