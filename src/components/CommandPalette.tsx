"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TOOLS, ToolInfo } from "@/lib/tool-data";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const router = useRouter();

  const handleClose = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  const selectTool = useCallback(
    (tool: ToolInfo) => {
      handleClose();
      router.push(tool.href);
    },
    [router, handleClose]
  );

  const filteredTools = useMemo(() => {
    if (!query) return TOOLS;
    const q = query.toLowerCase();
    return TOOLS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.shortTitle.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tech.toLowerCase().includes(q) ||
        t.href.toLowerCase().includes(q)
    );
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = itemRefs.current[selectedIndex];
    if (activeEl && listRef.current) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Global capture-phase keyboard navigation (Escape, Up, Down, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredTools.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredTools.length - 1
        );
      } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
        e.preventDefault();
        selectTool(filteredTools[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, filteredTools, selectedIndex, selectTool, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border-subtle bg-bg-card shadow-2xl overflow-hidden font-mono animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2 bg-bg-page/50">
          <span className="text-accent text-sm font-bold select-none">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                handleClose();
              }
            }}
            placeholder="Search 96 tools by name, keyword, tech, or shortcut..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={handleClose}
            className="text-[11px] font-mono text-text-muted hover:text-accent px-1.5 py-0.5 rounded border border-border-subtle hover:border-accent/40 transition-colors"
          >
            [ESC]
          </button>
        </div>

        {/* Tools List Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5 space-y-0.5 font-mono">
          {filteredTools.map((tool: ToolInfo, index: number) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={tool.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => selectTool(tool)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-accent/15 text-text-primary border border-accent/30"
                    : "text-text-secondary hover:bg-bg-page border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-base shrink-0">{tool.emoji}</span>
                  <div className="truncate">
                    <span className="font-bold text-text-primary block truncate">
                      {tool.title}
                    </span>
                    <span className="text-[10px] text-text-muted truncate block">
                      {tool.description}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-text-muted shrink-0 ml-2 font-mono">
                  {tool.tech}
                </span>
              </button>
            );
          })}

          {filteredTools.length === 0 && (
            <div className="py-8 text-center text-xs text-text-muted">
              <span>no tools match:</span> &quot;<span className="text-error">{query}</span>&quot;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border-subtle bg-bg-page/40 text-[10px] text-text-muted font-mono">
          <span>↑↓ Navigate · ↵ Select</span>
          <span>{filteredTools.length} of {TOOLS.length} tools</span>
        </div>
      </div>
    </div>
  );
}