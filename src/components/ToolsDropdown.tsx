"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TOOL_CATEGORIES, TOOLS_INFO } from "@/lib/tool-data";

export default function ToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isCurrentPageTool = pathname !== "/" && pathname.length > 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          isOpen || isCurrentPageTool
            ? "bg-accent-soft text-accent"
            : "text-text-secondary hover:bg-accent-soft hover:text-accent"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="font-mono text-xs text-text-muted">$</span>
        <span>Tools</span>
        <svg
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-accent" : "text-text-muted"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-[calc(100vw-2rem)] sm:w-[580px] md:w-[680px] max-w-[95vw] rounded-xl border border-border-subtle bg-bg-card p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto pr-1">
            {TOOL_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                </div>
                <div className="space-y-0.5">
                  {category.toolIds.map((toolId) => {
                    const tool = TOOLS_INFO[toolId];
                    if (!tool) return null;
                    const isActive = pathname === tool.href;

                    return (
                      <Link
                        key={tool.id}
                        href={tool.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs sm:text-sm transition-colors ${
                          isActive
                            ? "bg-accent-soft text-accent font-semibold"
                            : "text-text-primary hover:bg-accent-soft/70 hover:text-accent"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="shrink-0">{tool.emoji}</span>
                          <span className="truncate">{tool.title}</span>
                        </div>
                        {isActive && (
                          <span className="shrink-0 text-[10px] bg-accent text-white px-1.5 py-0.5 rounded font-mono">
                            active
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="text-accent hover:underline font-medium"
            >
              ← View all tools overview
            </Link>
            <span className="font-mono text-[11px]">18 tools available</span>
          </div>
        </div>
      )}
    </div>
  );
}
