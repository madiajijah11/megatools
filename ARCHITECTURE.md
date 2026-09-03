# MegaTools Architecture & Development Standards

## 1. System Architecture Principles

1. **100% Client-Side Execution (Airgapped Processing)**
   - No sensitive data, files, certificates, or user input ever leaves the browser.
   - All computation relies on native browser Web APIs (`WebCrypto`, `Canvas 2D`, `Web Audio API`, `Intl`, `MediaRecorder`, `TextEncoder`) or WebAssembly/in-memory libraries.

2. **Terminal & Cyber Aesthetic Standards**
   - **Colors**: Dark terminal background (`#0a0f0d`), elevated cards (`#101713`), borders (`#1f2b24`), glowing neon green accent (`#4ade80`), and muted text (`#8aa396` / `#5a6f63`).
   - **Typography**: Geist Mono monospace font across all inputs, badges, logs, and outputs.
   - **Interactive Elements**: Command prompt cues (`$`, `root@megatools:~$`, `[+]`, `[tech]`), CRT scanline toggle, and live status bar telemetry (`TerminalStatusBar`).

---

## 2. Component Design & Layout Guidelines

### Two-Column Input/Output Layout Standard
When building side-by-side or two-column converter tools:
- **Header Alignment**: Both left (input) and right (output) header rows MUST use fixed `h-8 flex items-center justify-between` to ensure horizontal baseline alignment of labels, clear buttons, and copy actions.
- **Action Buttons**: `CopyButton` and `Clear` buttons in header rows must use compact font-mono styling (`text-xs font-mono px-2 py-1 rounded border`) to prevent vertical layout shifts.
- **Matching Heights**: Textarea and output boxes must have matching fixed/min heights (e.g. `h-[280px]` or `h-[320px]`).

### Tool Page Pattern
Every tool follows a two-file pattern:
1. `src/app/<tool-name>/page.tsx`: Server component exporting SEO `Metadata` and rendering the client component.
2. `src/app/<tool-name>/<Tool>Client.tsx`: `"use client"` component containing state, logic, `InfoPanel`, and `MobileInfoDrawer`.
3. Registry: Registered in `TOOLS` array in `src/lib/tool-data.ts`.

---

## 3. Core System Features

- **Boot Splash** (`src/components/BootSplash.tsx`): Cyber kernel boot sequence on first visit; replayable via `[0:megatools*]` trigger.
- **Notification & Changelog** (`src/components/NotificationBell.tsx`, `src/lib/changelog-data.ts`, `src/app/changelog/`): Live unread dot tracked in `localStorage` + `/changelog` route.
- **CRT Mode** (`src/components/CrtToggle.tsx`): Scanlines and phosphor glow toggle with `localStorage` persistence.
- **Telemetry Bar** (`src/components/TerminalStatusBar.tsx`): Realtime UTC clock, heap memory monitoring, sandbox status, and latency.

---

## 4. Development Workflow & Guardrails

For **every** addition, fix, feature, or refactor:
1. **Plan First**: Propose approach and obtain approval before editing code.
2. **Realtime To-Dos**: Break work into granular steps with `todo_write`. Mark `in_progress` when working and `completed` the moment each step settles.
3. **Zero Lint & Build Errors**: Always verify with `npm run build` prior to committing.
4. **Git Discipline**: Conventional commit messages (`feat:`, `fix:`, `refactor:`, `docs:`) with pushed changes to `main`.
5. **Changelog Record**: Record tool additions, feature enhancements, or significant fixes in `src/lib/changelog-data.ts` (`CHANGELOG_ITEMS`).
