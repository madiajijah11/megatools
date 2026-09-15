"use client";

import { useState, useEffect, useCallback } from "react";

const BOOT_LOGS = [
  "[  0.000000] Linux megatools-node 6.8.0-sandbox-x86_64 #1 SMP PREEMPT_DYNAMIC",
  "[  0.012401] BIOS: In-Browser Client Environment (V8/WebAssembly)",
  "[  0.048912] CPU0: WebCrypto Engine Active (AES-256-GCM, RSA-4096, ECDSA, SHA-512)",
  "[  0.112040] MEMORY: Initializing 100% in-browser airgapped heap... [OK]",
  "[  0.198421] FIREWALL: Blocking external telemetry & 3rd-party data egress... [OK]",
  "[  0.284902] CRYPTO: Random number generator (crypto.getRandomValues) online... [OK]",
  "[  0.392019] PACKAGES: Mounting 92 tools (Dev, Security, Converters, Media)... [OK]",
  "[  0.512948] NETWORK: Local loopback 127.0.0.1 sandbox ready",
  "[  0.640192] SECURITY: System integrity verified. Access level: ROOT_PRIVILEGES",
  "[  0.780000] SYS: Launching MegaTools Terminal Shell...",
];

export default function BootSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const startBoot = useCallback(() => {
    setVisible(true);
    setFading(false);
    setLines([]);
    setProgress(0);

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < BOOT_LOGS.length) {
        setLines((prev) => [...prev, BOOT_LOGS[currentLine]]);
        currentLine++;
        setProgress(Math.round((currentLine / BOOT_LOGS.length) * 100));
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setFading(true);
          setTimeout(() => setVisible(false), 350);
        }, 300);
      }
    }, 70);

    return () => clearInterval(interval);
  }, []);

  const skipBoot = useCallback(() => {
    setFading(true);
    setTimeout(() => setVisible(false), 200);
  }, []);

  useEffect(() => {
    // Skip if user prefers reduced motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Check if shown in current session
    const hasBooted = sessionStorage.getItem("megatools_booted");
    if (!hasBooted) {
      sessionStorage.setItem("megatools_booted", "true");
      startBoot();
    }

    // Listen for custom trigger to replay boot sequence
    const handleReboot = () => startBoot();
    window.addEventListener("megatools:reboot", handleReboot);

    return () => window.removeEventListener("megatools:reboot", handleReboot);
  }, [startBoot]);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = () => skipBoot();
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, skipBoot]);

  if (!visible) return null;

  return (
    <div
      onClick={skipBoot}
      className={`fixed inset-0 z-[9999999] flex flex-col justify-between bg-[#050806] p-4 sm:p-8 font-mono text-xs sm:text-sm text-accent cursor-pointer select-none transition-opacity duration-300 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-border-subtle/80 pb-2 mb-4 text-[11px] text-text-muted">
          <span>MEGATOOLS BIOS v4.19 (x86_64-browser)</span>
          <span className="animate-pulse text-accent">[ESC / CLICK TO SKIP]</span>
        </div>

        {/* Boot Lines */}
        <div className="space-y-1 overflow-hidden leading-relaxed">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-text-primary">{line}</span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-accent mt-2">
            <span>root@megatools:~$</span>
            <span className="animate-pulse">▊</span>
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="border-t border-border-subtle/80 pt-3 text-[11px]">
        <div className="flex items-center justify-between mb-1.5 text-text-secondary">
          <span>INITIALIZING CORE MODULES...</span>
          <span className="font-bold text-accent">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden border border-border-subtle">
          <div
            className="h-full bg-accent transition-all duration-75 ease-out shadow-[0_0_8px_rgba(74,222,128,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
