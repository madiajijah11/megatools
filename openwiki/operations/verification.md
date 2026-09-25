---
type: concept
title: Automated Verification & Quality Gates
description: Operational quality gates, automated workflow auditing, four-phase validation script mechanics, and troubleshooting protocols in MegaTools.
tags: [verification, quality-gates, ci, testing, typescript, layout, registry, changelog]
verified:
  - by: openwiki/0.6.0
    at: 2026-09-24T05:09:02.049Z
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-a46a7bff4d413821a4a41458
    resource: repo://scripts/verify-workflow.mjs
generated: { by: "openwiki/0.6.0", at: "2026-09-24T05:09:02.049Z" }
---

# Automated Verification & Quality Gates

MegaTools employs automated verification gates and structural auditing to enforce system invariants across tools, registries, and documentation. Because MegaTools runs as an in-browser utility catalog built on Next.js 16 and React 19 with strict client-side data boundaries, every tool addition or modification must pass automated static gates before deployment.

The central quality gate is executed via `npm run verify`, which invokes `scripts/verify-workflow.mjs`. This script evaluates four sequential audit phases covering UI component wrapping, bidirectional catalog synchronization, release log ISO timestamp formatting, and static TypeScript compiler integrity.

---

## Verification Architecture & CI Control Flow

The automated verification workflow acts as a mandatory pre-commit and CI boundary preventing runtime drift, broken routes, invisible tools, or typing regressions.

<!-- openwiki: mermaid parse failed and this diagram was converted to a text fence so it does not break rendering. Fix the diagram source and restore the mermaid fence. Parser error: Heuristic: an unescaped angle bracket inside a label breaks rendering; rephrase the label. -->
```text
flowchart TD
    Start["Developer / CI Invocation\n(npm run verify)"] --> Phase1["Phase 1: ToolLayout Coverage Check\nAssert all src/app/* (non-excluded) use <ToolLayout />"]
    Phase1 -->|Fail| Err1["Record Missing Client / Missing ToolLayout"]
    Phase1 -->|Pass| Phase2["Phase 2: Registry Dual-Sync Check\nAssert 1-to-1 match: TOOLS <--> TOOL_CATEGORIES"]
    Err1 --> Phase2
    Phase2 -->|Fail| Err2["Record Category Sync / Registry Sync Error"]
    Phase2 -->|Pass| Phase3["Phase 3: Changelog Validation\nAssert non-empty CHANGELOG_ITEMS & YYYY-MM-DD dates"]
    Err2 --> Phase3
    Phase3 -->|Fail| Err3["Record Changelog Format Error"]
    Phase3 -->|Pass| Phase4["Phase 4: TypeScript Type Check\nRun: npx tsc --noEmit"]
    Err3 --> Phase4
    Phase4 -->|Fail| Err4["Record TypeScript Compilation Errors"]
    Phase4 -->|Pass| Decision{"Any Errors Recorded?"}
    Err4 --> Decision
    Decision -->|Yes| TerminateFail["Exit Code 1: VERIFICATION FAILED\nBlock Commit / Pull Request"]
    Decision -->|No| TerminatePass["Exit Code 0: VERIFICATION PASSED\nProceed to Build / Deploy"]
```
*Four-phase audit sequence and failure evaluation executed by `scripts/verify-workflow.mjs`.*

---

## The 4 Automated Audit Phases

The verification script (`scripts/verify-workflow.mjs`) executes four distinct audits sequentially. Unlike isolated linters, these checks assert architectural and metadata contracts specific to MegaTools.

### Phase 1: 100% `<ToolLayout />` Coverage Across `src/app/*`

MegaTools guarantees visual and functional consistency across its catalog by requiring that every interactive tool view delegates chrome, responsive side panels, metrics displays, and header navigation to the standardized `<ToolLayout />` component (`src/components/ToolLayout.tsx`).

#### Audit Mechanics
1. **Directory Discovery**: Reads all directory entries in `src/app/` using `fs.readdirSync`.
2. **Static Route Exclusion**: Ignores designated non-tool informational routes via an internal exclusion set:
   ```javascript
   const excludedDirs = new Set(["about", "privacy", "terms", "changelog"]);
   ```
3. **Client Component Detection**: Scans the tool directory for a file matching the `*Client.tsx` pattern. If missing, reports `❌ [Missing Client] src/app/${slug}/ has no *Client.tsx component!`.
4. **Layout Tag Verification**: Reads the file contents of the detected `*Client.tsx` file and asserts the inclusion of the `<ToolLayout` substring.
5. **Coverage Evaluation**: If any tool client omits `<ToolLayout`, the script accumulates the offender in a `missingToolLayout` array, sets `hasErrors = true`, and lists each offending file path. When complete and error-free, it confirms 100% coverage across all verified tool directories.

### Phase 2: Dual Registry Sync Between `TOOLS` and `TOOL_CATEGORIES`

MegaTools relies on a unified static registry defined in `src/lib/tool-data.ts`. Tools are listed individually in the `TOOLS: ToolInfo[]` array and categorized under `TOOL_CATEGORIES: ToolCategory[]`.

#### Audit Mechanics
1. **Dynamic Module Loading**: Converts the absolute path of `src/lib/tool-data.ts` to a file URL via `pathToFileURL` and dynamically imports the module (`await import(tdUrl)`).
2. **Identifier Extraction**:
   - Gathers all tool IDs defined in `TOOLS` into a list: `toolIds = toolsList.map((t) => t.id)`.
   - Aggregates all `toolIds` present in the nested arrays of `TOOL_CATEGORIES` into a Set: `categoryToolIds`.
3. **Bidirectional Set Diffing**:
   - **Forward Check (`missingInCategories`)**: Identifies tool IDs present in `TOOLS` but omitted from `TOOL_CATEGORIES`. If any exist, the tool would fail to appear in homepage category tabs or filter lists.
   - **Reverse Check (`missingInTools`)**: Identifies tool IDs specified in `TOOL_CATEGORIES` that have no corresponding record in `TOOLS`. If any exist, rendering components would encounter undefined lookups.
4. **Error Reporting**: If either difference array is non-empty, the validator logs `❌ [Category Sync Error]` or `❌ [Registry Sync Error]` and flags `hasErrors = true`.

### Phase 3: Changelog Validity and ISO Date Format Checks

Whenever a new tool is introduced or an existing tool receives significant functional updates, a release entry must be recorded at the top of `CHANGELOG_ITEMS` in `src/lib/changelog-data.ts`. This data drives the unread release badge in `src/components/NotificationBell.tsx` and the public `/changelog` route.

#### Audit Mechanics
1. **Dynamic Module Loading**: Dynamically imports `src/lib/changelog-data.ts` using `pathToFileURL`.
2. **Array Non-Empty Check**: Asserts that `CHANGELOG_ITEMS` contains at least one entry.
3. **Regex Date Validation**: Tests the `date` property of every `ChangelogItem` against the strict ISO 8601 calendar date format:
   ```javascript
   const invalidDates = changelog.filter((item) => !/^\d{4}-\d{2}-\d{2}$/.test(item.date));
   ```
4. **Failure Logging**: Any entry failing the format check triggers `❌ [Changelog Date Error]`, printing the violating changelog ID and the malformed date string.

### Phase 4: TypeScript Static Type Check (`tsc --noEmit`)

The final phase enforces full static type safety across the entire Next.js codebase.

#### Audit Mechanics
1. **Execution**: Invokes `npx tsc --noEmit` synchronously using Node's `child_process.execSync` with `{ stdio: "inherit" }`.
2. **Scope**: Checks all files included in `tsconfig.json` against strict TypeScript rules, validating schema types, component props, library utility arguments, and imports.
3. **Error Trapping**: Any compiler error emitted by TypeScript causes `execSync` to throw, triggering the `catch` block which prints `❌ [TypeScript Error] tsc --noEmit failed with errors.` and marks `hasErrors = true`.

---

## Operational Execution: `scripts/verify-workflow.mjs`

The verification runner is integrated directly into developer and CI lifecycles through npm script definitions in `package.json`.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "indexnow": "node scripts/submit-indexnow.mjs",
    "make:tool": "node scripts/create-tool.mjs",
    "verify": "node scripts/verify-workflow.mjs"
  }
}
```

### CLI Execution Commands

Developers and automated workflows execute the quality gate via:

```bash
# Run the full automated verification suite
npm run verify

# Alternatively invoke the verification script directly with Node
node scripts/verify-workflow.mjs
```

### Exit Codes and Output Contract
- **Exit Code `0` (`🎉 [VERIFICATION PASSED]`)**: All 4 phases completed without errors. All routes adopt `<ToolLayout />`, registries are synchronized, changelogs are formatted, and TypeScript compiles cleanly.
- **Exit Code `1` (`🚨 [VERIFICATION FAILED]`)**: One or more phases encountered validation failures. Detailed error traces for each failing phase are printed above the summary banner, terminating the process with `process.exit(1)`.

---

## Common Failure Modes & Troubleshooting

The table below outlines common failure modes surfaced by `npm run verify`, their root causes, and explicit remediation steps.

| Failure Output | Root Cause | Remediation Step |
|---|---|---|
| `❌ [Missing Client] src/app/<slug>/ has no *Client.tsx component!` | Route directory created without client companion file. | Create `src/app/<slug>/<PascalName>Client.tsx` marked with `'use client'`. |
| `❌ [ToolLayout Error] The following tools do not use <ToolLayout />` | Client component renders a raw `<div>` or custom shell instead of `<ToolLayout />`. | Wrap the return JSX of `<PascalName>Client` in `<ToolLayout toolId="<slug>" stats={stats}>`. |
| `❌ [Category Sync Error] Tools present in TOOLS but missing in TOOL_CATEGORIES: "<slug>"` | Tool is defined in `TOOLS` array in `src/lib/tool-data.ts`, but its slug was not added to any category. | Open `src/lib/tool-data.ts`, find the target category in `TOOL_CATEGORIES`, and append `"<slug>"` to its `toolIds` array. |
| `❌ [Registry Sync Error] Tool IDs present in TOOL_CATEGORIES but missing in TOOLS: "<slug>"` | Tool ID listed under a category in `TOOL_CATEGORIES` does not have a matching `ToolInfo` object in `TOOLS`. | Add the corresponding `ToolInfo` record to `TOOLS` in `src/lib/tool-data.ts`, or remove the orphan ID from `TOOL_CATEGORIES`. |
| `❌ [Changelog Date Error] Invalid date formats found in changelog: ID: <id>, Date: "<date>"` | Date string in `src/lib/changelog-data.ts` uses timestamps, slashes, or non-ISO formatting (e.g. `2026/09/17`, `Sep 17 2026`). | Correct the `date` property to strict ISO format `YYYY-MM-DD` (e.g., `2026-09-17`). |
| `❌ [Changelog Error] CHANGELOG_ITEMS array is empty!` | `CHANGELOG_ITEMS` in `src/lib/changelog-data.ts` was cleared or exported as an empty array. | Restore release history or ensure at least one `ChangelogItem` object is present in `CHANGELOG_ITEMS`. |
| `❌ [TypeScript Error] tsc --noEmit failed with errors.` | Type mismatch, missing import, invalid prop type, or interface violation in project source. | Run `npx tsc --noEmit` directly in the terminal to inspect compiler error diagnostics and file line numbers, then fix the types. |

---

## Related Workflows & Tooling

- **Tool Scaffolding**: To automatically generate routes that pass Phase 1 and prepare registry hooks, run `npm run make:tool <slug> "<Title>" <category> "<Tech>"` via `scripts/create-tool.mjs`.
- **System Tool Standards**: See [/openwiki/architecture/tool-standard.md](/openwiki/architecture/tool-standard.md) for `<ToolLayout />` component contracts and toolbar specifications.
- **Registry Mechanics**: See [/openwiki/concepts/tool-registry.md](/openwiki/concepts/tool-registry.md) for details on `ToolInfo` schemas and UI registry consumption.
- **Deployment Lifecycle**: See [/openwiki/operations/deployment-seo.md](/openwiki/operations/deployment-seo.md) for how verification gates precede production builds and Vercel edge deployment.
- **Authoring Guide**: See [/openwiki/workflows/adding-tools.md](/openwiki/workflows/adding-tools.md) for the mandatory 6-step Zero-Mistake Protocol.
