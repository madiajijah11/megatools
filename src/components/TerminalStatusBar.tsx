"use client";

import { useState, useEffect } from "react";
import { TOOLS } from "@/lib/tool-data";

export default function TerminalStatusBar() {
  const [utcTime, setUtcTime] = useState<string>("");
  const [memoryMb, setMemoryMb] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const iso = now.toISOString().replace("T", " ").substring(0, 19);
      setUtcTime(`${iso} UTC`);

      // Performance memory if supported in Chromium
      if (typeof performance !== "undefined" && "memory" in performance) {
        const mem = (performance as unknown as { memory?: { usedJSHeapSize?: number } }).memory;
        if (mem?.usedJSHeapSize) {
          setMemoryMb(Math.round(mem.usedJSHeapSize / (1024 * 1024)));
        }
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full border-t border-border-subtle bg-bg-page/95 backdrop-blur font-mono text-[11px] text-text-secondary select-none">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-3 py-1.5 gap-2">
        {/* Left items: Tmux / session info */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 bg-accent/15 text-accent px-1.5 py-0.5 rounded text-[10px] font-bold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            [0:megatools*]
          </span>

          <span className="hidden sm:inline text-text-muted">|</span>

          <span className="hidden sm:flex items-center gap-1">
            <span className="text-text-muted">SYS:</span>
            <span className="text-text-primary">ISOLATED_SANDBOX</span>
          </span>

          <span className="hidden md:inline text-text-muted">|</span>

          <span className="hidden md:flex items-center gap-1">
            <span className="text-text-muted">MODULES:</span>
            <span className="text-accent">{TOOLS.length} PKGS</span>
          </span>
        </div>

        {/* Right items: Telemetry & Clock */}
        <div className="flex items-center gap-3">
          {memoryMb !== null && (
            <>
              <span className="hidden lg:flex items-center gap-1">
                <span className="text-text-muted">HEAP:</span>
                <span className="text-text-primary">{memoryMb}MB</span>
              </span>
              <span className="hidden lg:inline text-text-muted">|</span>
            </>
          )}

          <span className="flex items-center gap-1">
            <span className="text-text-muted">LATENCY:</span>
            <span className="text-success font-semibold">0.0ms</span>
          </span>

          <span className="text-text-muted">|</span>

          <span className="text-text-primary font-medium">
            {utcTime || "SYNCING..."}
          </span>
        </div>
      </div>
    </div>
  );
}
