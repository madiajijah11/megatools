# MegaTools Universal AI Agent Instructions & Workflow Rules

You are working on **MegaTools**, a privacy-first, zero-server-leakage suite of client-side developer, security, AI, multimedia, and web3 utilities built with Next.js 16 (App Router), React 19, TypeScript 5, and Tailwind CSS v4.

---

## ⚠️ MANDATORY ZERO-MISTAKE PROTOCOL (ALWAYS ENFORCED)

Every AI agent (Claude Code, Cursor, Copilot, DeepSeek, Gemini, Windsurf, Cline, Aider) MUST adhere to these 6 strict workflow rules without deviation:

### 1. Mandatory Scaffolding & Layout Standard (<ToolLayout />)
- **Scaffolding**: NEVER handwrite boilerplate from scratch. Always run:
  `npm run make:tool <slug> "<Tool Title>" <category-id> "<Tech Name>"`
- **Page Route**: `src/app/<slug>/page.tsx` must export full SEO `Metadata` (`title: "<Tool> — MegaTools"`, `description`, `keywords`, `openGraph`, `alternates: { canonical: "/<slug>" }`).
- **Client Component**: `src/app/<slug>/<ToolName>Client.tsx` MUST wrap entire view inside:
  `<ToolLayout toolId="<slug>" stats={stats}>`
- **NEVER** write custom page headers, custom back links, or custom mobile drawers.
- Action header bars inside cards must strictly use `h-8 flex items-center justify-between` with compact font-mono buttons.
- **Zero Leakage**: 100% Client-side execution. User data never leaves browser memory.

### 2. Dual Registry Synchronization (Critical for Homepage & Search)
In `src/lib/tool-data.ts`:
- Register tool in `TOOLS` array with full `ToolInfo` schema (`id`, `title`, `shortTitle`, `description`, `emoji`, `href`, `tech`, `steps`, `tips`, `example`).
- **CRITICAL REQUIREMENT**: MUST ALSO register `tool.id` in `TOOL_CATEGORIES` under the matching category `toolIds` array.
  *Failure to add to `TOOL_CATEGORIES` will cause the tool to be invisible on the homepage grid and category filters!*

### 3. Changelog & Notification Bell Protocol ("What's New")
In `src/lib/changelog-data.ts`:
- Add a new `ChangelogItem` entry at the **TOP** of the `CHANGELOG_ITEMS` array.
- **DATE RULE**: `date` MUST use the **REAL current system ISO date** (`YYYY-MM-DD` from `new Date().toISOString().split("T")[0]`). NEVER hardcode past or arbitrary placeholder dates.
- This directly powers the green notification bell badge in the header and displays the release on `/changelog`.

### 4. Documentation Sync
- Add the new tool row to the matching category table in `README.md` and update the total tool count.

### 5. Automated Verification Gate
Before committing or claiming completion:
- Always run `npm run verify` (or `npx tsc --noEmit`) to confirm 0 type errors, 0 category mismatches, and 100% ToolLayout coverage.

### 6. Git Commit Protocol
- When committing in confined/sandbox environments, use:
  `git commit --no-gpg-sign -m "..."`
