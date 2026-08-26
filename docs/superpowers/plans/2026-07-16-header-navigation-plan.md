# Header Navigation & Command Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the overflowing horizontal tools navbar with a categorized Tools dropdown menu and a Cmd+K / Ctrl+K Command Palette.

**Architecture:** Add category metadata and groupings to `src/lib/tool-data.ts`. Create `CommandPalette.tsx` for quick global fuzzy search and keyboard navigation. Create `ToolsDropdown.tsx` (or enhanced `QuickSwitchBar.tsx`) for categorized dropdown navigation. Integrate both into `src/app/layout.tsx`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.

---

### Task 1: Add Tool Categories to `src/lib/tool-data.ts`

**Files:**
- Modify: `src/lib/tool-data.ts`

- [ ] **Step 1: Add categories definition and helper functions to `src/lib/tool-data.ts`**

Update `src/lib/tool-data.ts` with `TOOL_CATEGORIES` and category mapping helpers.

```ts
export interface ToolCategory {
  id: string;
  name: string;
  emoji: string;
  toolIds: string[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: "format-text",
    name: "Format & Text",
    emoji: "📝",
    toolIds: [
      "json-formatter",
      "base64",
      "url-encoder",
      "text-diff",
      "text-transformer",
      "markdown-preview",
    ],
  },
  {
    id: "crypto-security",
    name: "Security & Crypto",
    emoji: "🔐",
    toolIds: [
      "password-generator",
      "uuid-generator",
      "hash-generator",
      "aes-crypto",
      "jwt-decoder",
    ],
  },
  {
    id: "media-qr",
    name: "Media & QR",
    emoji: "📱",
    toolIds: [
      "qrcode",
      "qr-scanner",
      "image-compressor",
    ],
  },
  {
    id: "dev-network",
    name: "Dev & Network",
    emoji: "⚙️",
    toolIds: [
      "timestamp-converter",
      "regex-tester",
      "chmod-calculator",
      "cidr-calculator",
    ],
  },
];
```

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors

---

### Task 2: Build `CommandPalette.tsx`

**Files:**
- Create: `src/components/CommandPalette.tsx`

- [ ] **Step 1: Implement `CommandPalette` component**

Features:
- Global `keydown` handler for `⌘K` / `Ctrl+K` and `Escape`.
- Live query search filtering `TOOLS` by title, shortTitle, description, and tech.
- Arrow keys (`↑`/`↓`) to navigate through items and `Enter` to navigate to tool page.
- Clean modal overlay with smooth transitions, backdrop blur, category badges, and quick shortcut hints.

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TOOLS, ToolInfo } from "@/lib/tool-data";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? TOOLS.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.shortTitle.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase()) ||
          t.tech.toLowerCase().includes(query.toLowerCase())
      )
    : TOOLS;

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const selectTool = (tool: ToolInfo) => {
    onClose();
    router.push(tool.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      selectTool(filtered[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/40 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border-subtle bg-bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-border-subtle px-4 py-3 bg-bg-page/50">
          <span className="text-accent font-mono text-sm select-none mr-2">$ find</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search all developer tools..."
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="hidden sm:inline-block rounded border border-border-subtle bg-bg-card px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted">
              No tools matching &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((tool, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={tool.id}
                  onClick={() => selectTool(tool)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? "bg-accent text-white"
                      : "text-text-primary hover:bg-accent-soft"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base select-none">{tool.emoji}</span>
                    <div className="truncate">
                      <div className={`font-medium ${isSelected ? "text-white" : "text-text-primary"}`}>
                        {tool.title}
                      </div>
                      <div
                        className={`text-xs truncate ${
                          isSelected ? "text-purple-100" : "text-text-secondary"
                        }`}
                      >
                        {tool.description}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[11px] px-2 py-0.5 rounded ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-bg-page text-text-muted border border-border-subtle"
                    }`}
                  >
                    {tool.shortTitle}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border-subtle bg-bg-page/70 px-4 py-2 flex items-center justify-between text-xs text-text-muted font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="font-semibold">↑↓</kbd> navigate</span>
            <span><kbd className="font-semibold">↵</kbd> select</span>
          </div>
          <span>{filtered.length} tools</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type check**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors

---

### Task 3: Build `ToolsDropdown.tsx` and Update Header Navigation

**Files:**
- Create: `src/components/ToolsDropdown.tsx`
- Modify: `src/components/QuickSwitchBar.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Implement `ToolsDropdown.tsx`**

Build the Tools popover dropdown with categorized 2-column view, active route highlight, and outside-click dismissal.

- [ ] **Step 2: Update `QuickSwitchBar.tsx` (or Header Navigation)**

Provide the combined header navigation:
1. "Tools ▾" categorized dropdown button
2. "Search ⌘K" search trigger button
3. Global hotkey listener registering `Cmd+K` / `Ctrl+K`

- [ ] **Step 3: Update `src/app/layout.tsx`**

Connect the new navigation controls in the sticky header.

- [ ] **Step 4: Verify type check & lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS

---

### Task 4: Final Verification

**Files:**
- All modified and created files

- [ ] **Step 1: Test build and type safety**

Run: `npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Test lint**

Run: `npm run lint`
Expected: 0 errors
