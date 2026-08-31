"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "megatools_crt_mode";

export default function CrtToggle() {
  const [isCrt, setIsCrt] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") {
        setIsCrt(true);
        document.documentElement.classList.add("crt-active");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleCrt = () => {
    const next = !isCrt;
    setIsCrt(next);
    try {
      if (next) {
        document.documentElement.classList.add("crt-active");
        localStorage.setItem(STORAGE_KEY, "true");
      } else {
        document.documentElement.classList.remove("crt-active");
        localStorage.setItem(STORAGE_KEY, "false");
      }
    } catch {
      // Ignore localStorage errors
    }
  };

  return (
    <button
      onClick={toggleCrt}
      type="button"
      title="Toggle retro CRT scanline display"
      aria-label="Toggle retro CRT scanline display"
      className={`hidden md:flex items-center gap-1.5 px-2 py-1 text-xs font-mono rounded border transition-all ${
        isCrt
          ? "border-accent bg-accent-soft text-accent shadow-[0_0_8px_rgba(74,222,128,0.3)] font-bold"
          : "border-border-subtle bg-bg-page/60 text-text-muted hover:text-text-primary hover:border-accent/40"
      }`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${isCrt ? "bg-accent animate-pulse" : "bg-text-muted"}`} />
      <span>CRT:{isCrt ? "ON" : "OFF"}</span>
    </button>
  );
}
