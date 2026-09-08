"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CHANGELOG_ITEMS, ChangeType } from "@/lib/changelog-data";

const STORAGE_KEY = "megatools_last_seen_changelog";

function getBadgeStyle(type: ChangeType) {
  switch (type) {
    case "added":
      return "border-accent/40 bg-accent-soft text-accent";
    case "updated":
      return "border-warning/40 bg-warning/10 text-warning";
    case "improved":
      return "border-success/40 bg-success/10 text-success";
    case "fixed":
      return "border-error/40 bg-error/10 text-error";
    default:
      return "border-border-subtle bg-bg-card text-text-secondary";
  }
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem(STORAGE_KEY);
      const latestId = CHANGELOG_ITEMS[0]?.id;
      if (latestId && lastSeen !== latestId) {
        setHasUnread(true);
      }
    } catch {
      // Ignore localStorage read errors in restricted contexts
    }
  }, []);

  const handleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && hasUnread) {
      try {
        const latestId = CHANGELOG_ITEMS[0]?.id;
        if (latestId) {
          localStorage.setItem(STORAGE_KEY, latestId);
        }
        setHasUnread(false);
      } catch {
        // Ignore localStorage write errors
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
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

  const recentItems = CHANGELOG_ITEMS.slice(0, 15);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={handleOpen}
        aria-label="View changelog and updates"
        aria-expanded={isOpen}
        className="relative flex items-center justify-center h-8 w-8 rounded border border-border-subtle bg-bg-page/70 text-text-muted hover:border-accent/40 hover:bg-accent-soft hover:text-text-primary transition-all duration-150"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg border border-border-subtle bg-bg-card shadow-2xl p-3 z-50 animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2.5 mb-2.5 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-text-primary">
              <span className="text-accent">&gt;</span>
              <span>what&apos;s new</span>
              <span className="text-[10px] text-text-muted">({recentItems.length})</span>
            </div>
            <Link
              href="/changelog"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-mono text-accent hover:underline"
            >
              all updates →
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[360px] sm:max-h-[420px] overflow-y-auto pr-1.5 overscroll-contain">
            {recentItems.map((item) => (
              <div
                key={item.id}
                className="group rounded border border-border-subtle/70 bg-bg-page/40 p-2.5 transition-colors hover:border-accent/30"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold border ${getBadgeStyle(
                      item.type
                    )}`}
                  >
                    [{item.type}]
                  </span>
                  <span className="text-[10px] font-mono text-text-muted">
                    {item.date}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-text-primary mb-1">
                  {item.title}
                </h4>
                <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                {item.toolHref && (
                  <div className="mt-2">
                    <Link
                      href={item.toolHref}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:underline"
                    >
                      <span>open tool</span>
                      <span>→</span>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2.5 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted font-mono">
            <span>MegaTools Changelog</span>
            <Link
              href="/changelog"
              onClick={() => setIsOpen(false)}
              className="text-text-primary hover:text-accent transition-colors"
            >
              Full timeline [Ctrl+L]
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
