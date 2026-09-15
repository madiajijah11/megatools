"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useEffect, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

interface ClientSpecs {
  browser: {
    userAgent: string;
    vendor: string;
    platform: string;
    language: string;
    languages: readonly string[];
    cookieEnabled: boolean;
    onLine: boolean;
    doNotTrack: string | null;
  };
  screen: {
    resolution: string;
    availableResolution: string;
    windowSize: string;
    devicePixelRatio: number;
    colorDepth: number;
    orientation: string;
  };
  hardware: {
    logicalCores: number | string;
    deviceMemoryGB: number | string;
    maxTouchPoints: number;
    touchSupported: boolean;
  };
  graphics: {
    webgl1: boolean;
    webgl2: boolean;
    gpuVendor: string;
    gpuRenderer: string;
    maxTextureSize: number | string;
  };
  locale: {
    timeZone: string;
    utcOffset: string;
    intlLocale: string;
  };
  connection?: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  battery?: {
    charging?: boolean;
    level?: number;
  };
}

export default function DeviceInspectorClient() {
  const [specs, setSpecs] = useState<ClientSpecs | null>(null);
  useEffect(() => {
    // 1. Screen & Window
    const screenRes = `${window.screen.width} × ${window.screen.height}`;
    const availRes = `${window.screen.availWidth} × ${window.screen.availHeight}`;
    const winSize = `${window.innerWidth} × ${window.innerHeight}`;
    const dpr = window.devicePixelRatio || 1;
    const colorDepth = window.screen.colorDepth || 24;
    const orientation = window.screen.orientation?.type || "unknown";

    // 2. Hardware
    const cores = navigator.hardwareConcurrency || "Unknown";
    // @ts-expect-error deviceMemory is experimental
    const memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "Not exposed";
    const touchPoints = navigator.maxTouchPoints || 0;
    const isTouch = "ontouchstart" in window || touchPoints > 0;

    // 3. WebGL GPU info
    let webgl1 = false;
    let webgl2 = false;
    let gpuVendor = "Unknown";
    let gpuRenderer = "Software / Not Exposed";
    let maxTextureSize: number | string = "Unknown";

    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        webgl1 = true;
        // @ts-expect-error webgl extension
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        if (ext) {
          // @ts-expect-error webgl extension
          gpuVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) || gpuVendor;
          // @ts-expect-error webgl extension
          gpuRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || gpuRenderer;
        }
        // @ts-expect-error webgl parameter
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || maxTextureSize;
      }
      const gl2 = canvas.getContext("webgl2");
      if (gl2) webgl2 = true;
    } catch {
      // Ignore security errors
    }

    // 4. Locale & Time
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const offsetMin = new Date().getTimezoneOffset();
    const offsetHours = -offsetMin / 60;
    const utcOffset = `UTC${offsetHours >= 0 ? "+" : ""}${offsetHours}`;

    // 5. Connection API
    // @ts-expect-error connection is experimental
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connectionInfo = conn
      ? {
          effectiveType: conn.effectiveType,
          downlink: conn.downlink,
          rtt: conn.rtt,
          saveData: conn.saveData,
        }
      : undefined;

    const collected: ClientSpecs = {
      browser: {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor || "Standard",
        platform: navigator.platform || "Web",
        language: navigator.language,
        languages: navigator.languages || [navigator.language],
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        doNotTrack: navigator.doNotTrack,
      },
      screen: {
        resolution: screenRes,
        availableResolution: availRes,
        windowSize: winSize,
        devicePixelRatio: dpr,
        colorDepth,
        orientation,
      },
      hardware: {
        logicalCores: cores,
        deviceMemoryGB: memory,
        maxTouchPoints: touchPoints,
        touchSupported: isTouch,
      },
      graphics: {
        webgl1,
        webgl2,
        gpuVendor,
        gpuRenderer,
        maxTextureSize,
      },
      locale: {
        timeZone,
        utcOffset,
        intlLocale: Intl.DateTimeFormat().resolvedOptions().locale || "en",
      },
      connection: connectionInfo,
    };

    setSpecs(collected);

    // 6. Battery API (Async)
    // @ts-expect-error battery is experimental
    if (navigator.getBattery) {
      // @ts-expect-error battery is experimental
      navigator.getBattery().then((battery: { charging: boolean; level: number }) => {
        setSpecs((prev) =>
          prev
            ? {
                ...prev,
                battery: {
                  charging: battery.charging,
                  level: Math.round(battery.level * 100),
                },
              }
            : null
        );
      });
    }
  }, []);

  const fullJsonReport = useMemo(() => {
    if (!specs) return "";
    return JSON.stringify(specs, null, 2);
  }, [specs]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">CPU Cores</p>
        <p className="text-accent font-mono text-xs font-bold">{specs?.hardware.logicalCores ?? "..."}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Display DPR</p>
        <p className="text-text-primary font-mono text-xs">{specs?.screen.devicePixelRatio ?? 1}x</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="device-inspector" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        <div className="flex justify-end mb-4">
            {fullJsonReport && <CopyButton text={fullJsonReport} />}
          </div>

          {specs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* Display & Screen */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2.5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-accent font-bold uppercase tracking-wider">🖥️ Display & Screen</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Screen Resolution:</span>
                  <span className="text-text-primary font-bold">{specs.screen.resolution}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Viewport Size:</span>
                  <span className="text-text-primary">{specs.screen.windowSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Device Pixel Ratio:</span>
                  <span className="text-text-primary">{specs.screen.devicePixelRatio}x ({specs.screen.devicePixelRatio * 96} DPI)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Color Depth:</span>
                  <span className="text-text-primary">{specs.screen.colorDepth}-bit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Orientation:</span>
                  <span className="text-text-primary">{specs.screen.orientation}</span>
                </div>
              </div>

              {/* Hardware & Memory */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2.5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-accent font-bold uppercase tracking-wider">⚡ Hardware & CPU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Logical CPU Cores:</span>
                  <span className="text-text-primary font-bold">{specs.hardware.logicalCores} Threads</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Estimated Device RAM:</span>
                  <span className="text-text-primary">{specs.hardware.deviceMemoryGB}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Touchscreen Supported:</span>
                  <span className={specs.hardware.touchSupported ? "text-success" : "text-text-muted"}>
                    {specs.hardware.touchSupported ? `Yes (${specs.hardware.maxTouchPoints} pts)` : "No (Mouse/Keyboard)"}
                  </span>
                </div>
                {specs.battery && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Battery Status:</span>
                    <span className="text-text-primary">
                      {specs.battery.level}% {specs.battery.charging ? "(⚡ Charging)" : "(Discharging)"}
                    </span>
                  </div>
                )}
                {specs.connection && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Network Type:</span>
                    <span className="text-text-primary uppercase">
                      {specs.connection.effectiveType || "Online"} {specs.connection.downlink ? `(${specs.connection.downlink} Mbps)` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Graphics & WebGL GPU */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2.5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-accent font-bold uppercase tracking-wider">🎮 Graphics & GPU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">WebGL 2.0:</span>
                  <span className={specs.graphics.webgl2 ? "text-success" : "text-error"}>
                    {specs.graphics.webgl2 ? "Supported ✓" : "Unsupported ✗"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block mb-0.5">GPU Renderer:</span>
                  <span className="text-text-primary text-[11px] break-all leading-tight">
                    {specs.graphics.gpuRenderer}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">GPU Vendor:</span>
                  <span className="text-text-primary">{specs.graphics.gpuVendor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Max Texture Size:</span>
                  <span className="text-text-primary">{specs.graphics.maxTextureSize}px</span>
                </div>
              </div>

              {/* Locale & Timezone */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2.5">
                <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                  <span className="text-accent font-bold uppercase tracking-wider">🌐 Timezone & System</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">IANA Timezone:</span>
                  <span className="text-text-primary font-bold">{specs.locale.timeZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">UTC Offset:</span>
                  <span className="text-text-primary">{specs.locale.utcOffset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Primary Language:</span>
                  <span className="text-text-primary">{specs.browser.language}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Cookies Enabled:</span>
                  <span className={specs.browser.cookieEnabled ? "text-success" : "text-error"}>
                    {specs.browser.cookieEnabled ? "Yes ✓" : "No ✗"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Online State:</span>
                  <span className={specs.browser.onLine ? "text-success" : "text-error"}>
                    {specs.browser.onLine ? "Connected ✓" : "Offline ✗"}
                  </span>
                </div>
              </div>

              {/* User Agent */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle md:col-span-2 space-y-1.5">
                <span className="text-accent font-bold uppercase tracking-wider block">
                  🕵️ User-Agent String
                </span>
                <p className="text-[11px] text-text-secondary break-all leading-relaxed bg-bg-card p-2.5 rounded border border-border-subtle">
                  {specs.browser.userAgent}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-text-muted font-mono text-xs">
              Detecting client hardware environment...
            </div>
          )}
      </div>
    </ToolLayout>
  );
}