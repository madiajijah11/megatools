---
type: concept
title: Tool Layout Standard & Component Contracts
description: Architectural specifications, component contracts, UI toolbar standards, and zero-server-leakage privacy invariants for individual tools.
tags: [architecture, layout, tool-standard, privacy, contracts, components]
verified:
  - by: openwiki/0.6.0
    at: 2026-09-24T05:09:02.049Z
sources:
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-362e06c30ccfdafd87339cb0
    resource: repo://ARCHITECTURE.md
  - id: openwiki-source-c21200ab2c12620b870e90a7
    resource: repo://scripts/create-tool.mjs
  - id: openwiki-source-a46a7bff4d413821a4a41458
    resource: repo://scripts/verify-workflow.mjs
  - id: openwiki-source-e76774e8a5fe964bbe8f4d51
    resource: repo://src/components/InfoPanel.tsx
  - id: openwiki-source-cf64e72525c525f86e3d9feb
    resource: repo://src/components/ToolLayout.tsx
generated: { by: "openwiki/0.6.0", at: "2026-09-24T05:09:02.049Z" }
---

# Tool Layout Standard & Component Contracts

MegaTools enforces strict architectural consistency, layout guarantees, and privacy invariants across every utility in its catalog. Every individual tool follows a standardized route structure, delegates layout and responsive mechanics to `<ToolLayout />`, adheres to a card toolbar convention, and enforces 100% in-browser RAM execution without remote exfiltration.

<!-- openwiki: mermaid parse failed and this diagram was converted to a text fence so it does not break rendering. Fix the diagram source and restore the mermaid fence. Parser error: Heuristic: an unescaped angle bracket inside a label breaks rendering; rephrase the label. -->
```text
flowchart TD
    Page["src/app/[slug]/page.tsx\n(Server Component: SEO Metadata)"] --> Client["src/app/[slug]/[Tool]Client.tsx\n('use client': Interactive Logic)"]
    Client --> ToolLayout["<ToolLayout />\n(Navigation, Hero Terminal, 12-Col Grid, Drawer)"]
    ToolLayout --> Workspace["8-Col Workspace\nCard Container + h-8 Toolbars"]
    ToolLayout --> InfoPanelDesktop["4-Col Desktop <InfoPanel />\n(Steps, Stats, Tips, Example)"]
    ToolLayout --> MobileDrawer["<MobileInfoDrawer />\n(Responsive Viewport Drawer)"]
    MobileDrawer --> InfoPanelMobile["<InfoPanel />"]
    InfoPanelDesktop --> Registry["src/lib/tool-data.ts\n(ToolInfo Schema)"]
```
*Component rendering hierarchy and data flow for a standardized tool route.*

---

## 1. Zero-Server-Leakage Privacy Invariant

The defining guarantee across the MegaTools platform is absolute client-side execution:

- **100% In-Browser RAM Execution**: All inputs—plain text, cryptographic seeds, private keys, parsed tokens, HAR archives, images, or audio—are ingested, processed, transformed, and displayed strictly inside browser memory.
- **Zero Remote Exfiltration**: Tools never emit HTTP requests (REST, GraphQL, WebSocket, or RPC) to transmit payload contents to external servers or backend workers.
- **Offline Integrity**: Once assets are fetched, tools function in sandboxed or airgapped environments without degrading computation capabilities (e.g. BIP-39 mnemonic generation via Web Crypto CSPRNG, WebAssembly compilers, canvas transformations, or local PBKDF2 key derivation).
- **Execution Mode Status**: Scaffolding and UI convention explicitly surface execution mode to the user (e.g. `Execution Mode: 100% Client-Side`).

---

## 2. Server Page & SEO Metadata Contract

Every tool lives under `src/app/<tool-slug>/` split cleanly into a Server Component entrypoint (`page.tsx`) and an interactive Client Component (`<ToolName>Client.tsx`).

### Server Component Contract (`src/app/<tool-slug>/page.tsx`)

`page.tsx` never contains client interactivity, hooks, or direct DOM operations. Its sole responsibilities are defining complete search engine and social metadata via Next.js App Router `Metadata` and rendering the client companion component:

```tsx
import type { Metadata } from "next";
import Base64Client from "./Base64Client";

export const metadata: Metadata = {
  title: "Base64 Encode/Decode — MegaTools",
  description:
    "Encode text to Base64 or decode Base64 back to readable text. Free, instant, runs in your browser.",
  keywords: ["base64", "encode", "decode", "developer tool", "megatools"],
  alternates: {
    canonical: "/base64",
  },
  openGraph: {
    title: "Base64 Encode/Decode — MegaTools",
    description: "Free Base64 encoder and decoder.",
    url: "https://megatools-tau.vercel.app/base64",
    type: "website",
  },
};

export default function Base64Page() {
  return <Base64Client />;
}
```

#### Required Metadata Fields:
1. `title`: Follows the format `"<Tool Title> — MegaTools"`.
2. `description`: Concise, retrieval-oriented synopsis emphasizing client-side privacy and capabilities.
3. `alternates.canonical`: Exact route path matching `"/<tool-slug>"` to prevent duplicate indexing across environments.
4. `openGraph`: Social card payload specifying matching `title`, `description`, canonical `url`, and `type: "website"`.
5. `keywords` (recommended): Relevant query phrases and technical identifiers.

---

## 3. `<ToolLayout />` Architectural Contract

All interactive tool views MUST be wrapped inside `<ToolLayout />` located at `src/components/ToolLayout.tsx`. Custom outer page containers, custom top navigation breadcrumbs, or custom mobile drawer triggers are forbidden.

### Props Specification (`ToolLayoutProps`)

| Prop | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `toolId` | `string` | **Yes** | Tool identifier matching the route slug and `TOOLS` registry entry in `src/lib/tool-data.ts`. |
| `stats` | `React.ReactNode` | No | Rendered metric summary passed down into `<InfoPanel />` (e.g. input/output char count, ratio, mode). |
| `children` | `React.ReactNode` | **Yes** | Interactive workspace UI placed within the left 8-column grid area. |
| `customTitle` | `string` | No | Overrides the title lookup from `getToolInfo(toolId)`. |
| `customBadge` | `string` | No | Overrides the terminal hero badge text (defaults to `megatools --${toolId} --client-side`). |
| `customDescription` | `string` | No | Overrides the description lookup from `getToolInfo(toolId)`. |

### Standard Scaffolding Example

```tsx
"use client";

import { useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

export default function MyToolClient() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Input Length:</span>
        <span className="text-accent font-bold">{input.length} chars</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Execution Mode:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="my-tool" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Workspace cards and controls */}
      </div>
    </ToolLayout>
  );
}
```

---

## 4. Layout Mechanics: 8-Col Workspace & 4-Col Info Panel

`<ToolLayout />` establishes a 12-column responsive grid container (`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start`) max-bounded at `max-w-7xl mx-auto px-4 py-6`:

### 1. Navigation & Breadcrumb Header
- **Breadcrumb Link**: `← [cd .. / home]` directing to `/`.
- **Mobile Drawer Trigger**: Visible only on screens smaller than large viewports (`lg:hidden`). A monospace button `[?] Tool Info` toggles `drawerOpen`.

### 2. Terminal Hero Section
- **Command Badge**: Terminal badge rendering `$` in green accent, followed by `${badge}`, and a pulsing cursor element (`w-1.5 h-3.5 bg-accent animate-pulse`).
- **Dynamic Title Highlight**: Automatically splits multi-word titles to highlight the penultimate word in accent green (`text-accent`), maintaining visual brand alignment.
- **Description Block**: Renders the tool's concise summary text in monospace typography.

### 3. Left Column: Interactive Workspace (`lg:col-span-8`)
- Spans 8 columns on `lg` breakpoints and takes full width on smaller screens.
- Houses tool inputs, buttons, sliders, file drop zones, and result viewports inside card containers (`rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono`).

### 4. Right Column: Desktop Sidebar (`lg:col-span-4`)
- Hidden on mobile/tablet (`hidden lg:block`), visible on desktop.
- Hosts `<InfoPanel toolId={toolId} stats={stats} />` rendering documentation and execution metrics from `src/lib/tool-data.ts`.

### 5. Mobile Info Drawer (`<MobileInfoDrawer />`)
- Rendered conditionally or transitioned offscreen (`translate-x-full` to `translate-x-0`) using fixed positioning (`z-50`) with backdrop overlay (`fixed inset-0 z-40 bg-black/60`).
- Locks document body scroll (`document.body.style.overflow = "hidden"`) while open.
- Embeds the identical `<InfoPanel />` instance so documentation is never lost on smaller displays.

---

## 5. `<InfoPanel />` Contract & Data Resolution

`<InfoPanel />` (`src/components/InfoPanel.tsx`) dynamically resolves tool metadata from `getToolInfo(toolId)`:

```tsx
interface InfoPanelProps {
  toolId: string;
  stats?: React.ReactNode;
  extraContent?: React.ReactNode;
}
```

If the `toolId` is not found in the registry, the component renders `null`. When resolved, it renders:
1. **Terminal Header**: Displays `$ cat tips.txt` alongside `<TechBadge tech={tool.tech} />`.
2. **How to Use**: An ordered step list numbered with accent circles (`1`, `2`, `3`) mapped from `tool.steps`.
3. **Stats**: An optional card displaying runtime counters, payload sizes, and compression ratios supplied by the tool client via `stats`.
4. **Tips**: Bullet points with green accent markers (`•`) mapped from `tool.tips`.
5. **Example**: Input/output preview boxes with an integrated `<CopyButton />` if `tool.example` is defined.
6. **Extra Content**: Custom auxiliary nodes passed via `extraContent`.

---

## 6. Card Header & Toolbar Conventions

Input and output areas within the 8-column workspace must adhere strictly to uniform header and action button ergonomics:

```tsx
{/* Standard Card Toolbar Header */}
<div className="h-8 flex items-center justify-between text-xs font-mono">
  <span className="font-semibold text-text-primary">Input Payload</span>
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => setInput("")}
      className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
    >
      [Clear]
    </button>
    <CopyButton text={input} label="Copy" />
  </div>
</div>
```

### Toolbar Rules:
- **Height and Flexbox**: Must strictly declare `h-8 flex items-center justify-between`.
- **Labeling**: Left side displays the section title in `font-semibold text-text-primary` (e.g. `Input Payload`, `Base64 Result`, `Generated Keypair`).
- **Monospace Action Controls**: Right side groups quick action triggers inside `flex items-center gap-2`.
- **Bracket Notation**: Action buttons use bracketed terminal-style syntax (e.g. `[Clear]`, `[Paste]`, `[Format]`, `[Sample]`).
- **Copy Utility**: Output panels pair with `<CopyButton text={...} label="Copy Result" />` providing instant feedback (`Copied!` with checkmark icon for 2 seconds).

---

## 7. Verification & Quality Gates

The MegaTools CI quality gate (`scripts/verify-workflow.mjs` triggered via `npm run verify`) mechanically enforces compliance with the tool standard:

1. **ToolLayout Coverage Check**: Iterates through all tool directories under `src/app/` (excluding static pages `about`, `privacy`, `terms`, `changelog`). Confirms every tool contains a companion `*Client.tsx` file and that the file text contains `<ToolLayout`.
2. **Registry Dual-Sync Check**: Confirms all registered `TOOLS` in `src/lib/tool-data.ts` are mapped into matching category `toolIds` under `TOOL_CATEGORIES`.
3. **Changelog Validation**: Verifies `src/lib/changelog-data.ts` entries contain valid ISO `YYYY-MM-DD` dates.
4. **Static Type Safety**: Runs `npx tsc --noEmit` to verify type checking across all components, layout props, and registry models.
