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
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const handleClose = () => {
    setQuery("");
    setSelectedIndex(0);
    onClose();
  };

  const selectTool = (tool: ToolInfo) => {
    handleClose();
    router.push(tool.href);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(0);
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
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border-subtle bg-bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-border-subtle px-4 py-3 bg-bg-page/60">
          <span className="text-accent font-mono text-sm select-none mr-2">$ find</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="Search tools by name, description, keyword..."
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="hidden sm:inline-block rounded border border-border-subtle bg-bg-card px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted font-mono">
              <span className="text-error">no tools match:</span> &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((tool, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={tool.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
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
          <span>{filtered.length} {filtered.length === 1 ? "tool" : "tools"}</span>
        </div>
      </div>
    </div>
  );
}
