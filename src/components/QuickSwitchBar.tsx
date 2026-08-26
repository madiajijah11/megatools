"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import ToolsDropdown from "./ToolsDropdown";
import CommandPalette from "./CommandPalette";

function getIsMac() {
  if (typeof navigator === "undefined") return false;
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
}

const emptySubscribe = () => () => {};

export default function QuickSwitchBar() {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const isMac = useSyncExternalStore(emptySubscribe, getIsMac, () => false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <nav className="flex items-center gap-2">
        <ToolsDropdown />

        <button
          onClick={() => setIsPaletteOpen(true)}
          className="flex items-center gap-2 rounded border border-border-subtle bg-bg-page/70 px-2.5 py-1.5 text-xs text-text-muted hover:border-accent/40 hover:bg-accent-soft hover:text-text-primary transition-all duration-150"
          aria-label="Search tools (Command+K or Control+K)"
        >
          <svg
            className="h-3.5 w-3.5 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="hidden sm:inline">Search tools...</span>
          <kbd className="rounded border border-border-subtle bg-bg-card px-1 py-0.2 text-[10px] font-mono text-text-muted font-semibold shadow-xs">
            {isMac ? "⌘K" : "Ctrl+K"}
          </kbd>
        </button>
      </nav>

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />
    </>
  );
}
