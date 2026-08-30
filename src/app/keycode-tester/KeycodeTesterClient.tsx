"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface KeyRecord {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  locationName: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  repeat: boolean;
  timestamp: string;
}

const LOCATION_MAP: Record<number, string> = {
  0: "Standard (0)",
  1: "Left (1)",
  2: "Right (2)",
  3: "Numpad (3)",
};

export default function KeycodeTesterClient() {
  const [currentKey, setCurrentKey] = useState<KeyRecord | null>({
    key: "Enter",
    code: "Enter",
    keyCode: 13,
    which: 13,
    location: 0,
    locationName: "Standard (0)",
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    repeat: false,
    timestamp: new Date().toLocaleTimeString(),
  });
  const [history, setHistory] = useState<KeyRecord[]>([]);
  const [preventDefault, setPreventDefault] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (preventDefault) {
        e.preventDefault();
      }

      const record: KeyRecord = {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        location: e.location,
        locationName: LOCATION_MAP[e.location] || `Unknown (${e.location})`,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        repeat: e.repeat,
        timestamp: new Date().toLocaleTimeString(),
      };

      setCurrentKey(record);
      setHistory((prev) => [record, ...prev.slice(0, 9)]);
    },
    [preventDefault]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Active Key</p>
        <p className="text-accent font-mono font-bold">{currentKey ? currentKey.key : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Legacy keyCode</p>
        <p className="text-text-primary font-mono">{currentKey ? currentKey.keyCode : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Total Captured</p>
        <p className="text-text-secondary font-mono">{history.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Mode</p>
        <p className="text-text-muted font-mono text-xs">KeyboardEvent API</p>
      </div>
    </div>
  );

  const codeSnippet = currentKey
    ? `// React / JS Event Listener Check\nif (event.key === "${currentKey.key}" || event.code === "${currentKey.code}") {\n  // Handle ${currentKey.key} press\n}`
    : "// Press any key on your keyboard";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Keyboard Event & KeyCode Tester</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Press any key or key combination to inspect event values in real time.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-bg-page rounded-lg border border-border-subtle">
            <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={preventDefault}
                onChange={(e) => setPreventDefault(e.target.checked)}
                className="rounded border-border-subtle text-accent focus:ring-accent"
              />
              Prevent default browser behavior (e.g. Tab, Space, Arrows)
            </label>
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                setCurrentKey(null);
              }}
              className="text-xs font-mono text-text-muted hover:text-error transition-colors"
            >
              [Clear History]
            </button>
          </div>

          {/* Hero Key Display */}
          {currentKey ? (
            <div className="mb-6 p-6 sm:p-8 rounded-xl bg-bg-page border border-accent/40 text-center shadow-inner">
              <p className="text-xs uppercase font-mono tracking-widest text-text-muted mb-2">
                JavaScript KeyCode
              </p>
              <div className="text-6xl sm:text-7xl font-mono font-extrabold text-accent">
                {currentKey.keyCode}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="px-3 py-1 bg-bg-card border border-border-subtle rounded font-mono text-sm text-text-primary">
                  event.key: <strong className="text-accent">&quot;{currentKey.key}&quot;</strong>
                </span>
                <span className="px-3 py-1 bg-bg-card border border-border-subtle rounded font-mono text-sm text-text-primary">
                  event.code: <strong className="text-text-primary">&quot;{currentKey.code}&quot;</strong>
                </span>
                <span className="px-3 py-1 bg-bg-card border border-border-subtle rounded font-mono text-sm text-text-primary">
                  location: <strong className="text-text-secondary">{currentKey.locationName}</strong>
                </span>
              </div>

              {/* Modifiers Badges */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                    currentKey.shiftKey
                      ? "bg-accent text-bg-page border-accent font-bold"
                      : "bg-bg-card text-text-muted border-border-subtle"
                  }`}
                >
                  Shift
                </span>
                <span
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                    currentKey.ctrlKey
                      ? "bg-accent text-bg-page border-accent font-bold"
                      : "bg-bg-card text-text-muted border-border-subtle"
                  }`}
                >
                  Ctrl
                </span>
                <span
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                    currentKey.altKey
                      ? "bg-accent text-bg-page border-accent font-bold"
                      : "bg-bg-card text-text-muted border-border-subtle"
                  }`}
                >
                  Alt
                </span>
                <span
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                    currentKey.metaKey
                      ? "bg-accent text-bg-page border-accent font-bold"
                      : "bg-bg-card text-text-muted border-border-subtle"
                  }`}
                >
                  Meta / Cmd
                </span>
                {currentKey.repeat && (
                  <span className="px-3 py-1 rounded text-xs font-mono font-semibold bg-warning text-bg-page border border-warning">
                    Repeat
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6 p-12 rounded-xl bg-bg-page border border-dashed border-border-subtle text-center">
              <p className="text-lg font-mono text-text-muted animate-pulse">
                Press any key on your keyboard to start...
              </p>
            </div>
          )}

          {/* Code Snippet for Developers */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                JS Event Handler Snippet:
              </label>
              <CopyButton text={codeSnippet} />
            </div>
            <div className="rounded-lg bg-bg-page border border-border-subtle p-4 font-mono text-xs text-text-primary overflow-x-auto">
              <pre>{codeSnippet}</pre>
            </div>
          </div>

          {/* Key Press History Table */}
          {history.length > 0 && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-3">
                Key Event History:
              </h3>
              <div className="overflow-x-auto rounded-lg border border-border-subtle">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-bg-page text-text-muted border-b border-border-subtle">
                    <tr>
                      <th className="p-3">Key</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">keyCode</th>
                      <th className="p-3">Modifiers</th>
                      <th className="p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle bg-bg-card">
                    {history.map((h, i) => (
                      <tr key={i} className="hover:bg-bg-page/50">
                        <td className="p-3 text-accent font-bold">&quot;{h.key}&quot;</td>
                        <td className="p-3 text-text-primary">{h.code}</td>
                        <td className="p-3 text-text-secondary">{h.keyCode}</td>
                        <td className="p-3 text-text-muted">
                          {[
                            h.ctrlKey && "Ctrl",
                            h.shiftKey && "Shift",
                            h.altKey && "Alt",
                            h.metaKey && "Meta",
                          ]
                            .filter(Boolean)
                            .join(" + ") || "—"}
                        </td>
                        <td className="p-3 text-text-muted">{h.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden lg:block">
          <InfoPanel toolId="keycode-tester" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="keycode-tester" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
