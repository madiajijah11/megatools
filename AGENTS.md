<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# MegaTools Development Workflow & Rules

Refer to `ARCHITECTURE.md` and `CLAUDE.md` for complete system design and component specifications.

1. **Plan & Confirm First**: For all feature requests, design changes, or non-trivial fixes, present an implementation plan before writing code.
2. **Realtime To-Dos**: Track progress actively using todo tools — update task status step-by-step as each task begins and finishes.
3. **2-Column Layout Alignment**: Keep input/output header bars at `h-8 flex items-center justify-between` with compact font-mono buttons to prevent vertical misalignments.
4. **Verification Before Commit**: Always verify builds with `npm run build` and ensure clean builds before pushing commits.
5. **Changelog Record**: Whenever adding a new tool, updating features/capabilities, or applying significant fixes, record the update in `src/lib/changelog-data.ts` (`CHANGELOG_ITEMS`).
