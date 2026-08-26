"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

type Decoded =
  | { status: "empty" }
  | { status: "invalid"; error: string }
  | {
      status: "valid";
      header: string;
      payload: Record<string, unknown>;
      payloadJson: string;
      signature: string;
      now: number;
    };

function b64urlDecode(part: string): string | null {
  try {
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export default function JwtDecoderClient() {
  const [input, setInput] = useState("");
  const [decoded, setDecoded] = useState<Decoded>({ status: "empty" });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!input.trim()) {
        setDecoded({ status: "empty" });
        return;
      }
      const parts = input.trim().split(".");
      if (parts.length !== 3 || parts.some((p) => !p)) {
        setDecoded({ status: "invalid", error: "Invalid format — a JWT must have 3 dot-separated parts." });
        return;
      }
      const headerJson = b64urlDecode(parts[0]);
      const payloadJson = b64urlDecode(parts[1]);
      if (headerJson === null || payloadJson === null) {
        setDecoded({ status: "invalid", error: "Malformed base64url encoding." });
        return;
      }
      let headerObj: unknown;
      let payloadObj: unknown;
      try {
        headerObj = JSON.parse(headerJson);
        payloadObj = JSON.parse(payloadJson);
      } catch {
        setDecoded({ status: "invalid", error: "JSON parse error — header/payload are not valid JSON." });
        return;
      }
      setDecoded({
        status: "valid",
        header: JSON.stringify(headerObj, null, 2),
        payload: payloadObj as Record<string, unknown>,
        payloadJson: JSON.stringify(payloadObj, null, 2),
        signature: parts[2],
        now: Date.now(),
      });
    }, 150);
    return () => clearTimeout(t);
  }, [input]);

  const expInfo = useMemo(() => {
    if (decoded.status !== "valid") return null;
    const exp = decoded.payload.exp;
    const iat = decoded.payload.iat;
    if (typeof exp !== "number") return { hasExp: false, expired: false, date: "", iatDate: typeof iat === "number" ? new Date(iat * 1000).toLocaleString() : "" };
    const date = new Date(exp * 1000).toLocaleString();
    return { hasExp: true, expired: exp * 1000 <= decoded.now, date, iatDate: typeof iat === "number" ? new Date(iat * 1000).toLocaleString() : "" };
  }, [decoded]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Parts</p>
        <p className="text-text-primary font-mono">{input.trim() ? input.trim().split(".").length : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Status</p>
        <p
          className={`font-mono ${
            decoded.status === "valid" ? "text-success" : decoded.status === "invalid" ? "text-error" : "text-text-muted"
          }`}
        >
          {decoded.status === "valid" ? "valid" : decoded.status === "invalid" ? "invalid" : "—"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">JWT Decoder</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Paste a JWT to inspect its header and payload. Everything stays in your browser.
            </p>
          </div>

          <label className="mb-2 block text-sm font-medium text-text-secondary">Token (JWT)</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
            className="input-field min-h-[100px] resize-y font-mono text-xs sm:text-sm break-all"
          />

          {decoded.status === "invalid" && (
            <p className="mt-3 text-sm text-error font-mono">✗ {decoded.error}</p>
          )}

          {decoded.status === "valid" && (
            <>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-mono">
                {expInfo?.hasExp ? (
                  expInfo.expired ? (
                    <span className="rounded bg-error/10 px-2 py-1 text-error">EXPIRED · {expInfo.date}</span>
                  ) : (
                    <span className="rounded bg-success/10 px-2 py-1 text-success">VALID until {expInfo.date}</span>
                  )
                ) : (
                  <span className="rounded bg-bg-page border border-border-subtle px-2 py-1 text-text-muted">no exp claim</span>
                )}
                {expInfo?.iatDate && (
                  <span className="rounded bg-bg-page border border-border-subtle px-2 py-1 text-text-secondary">iat: {expInfo.iatDate}</span>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <span className="text-sm font-semibold text-accent">header</span>
                  <pre className="output-field mt-1 overflow-x-auto p-3 text-xs">{decoded.header}</pre>
                </div>
                <div>
                  <span className="text-sm font-semibold text-accent">payload</span>
                  <pre className="output-field mt-1 overflow-x-auto p-3 text-xs">{decoded.payloadJson}</pre>
                </div>
                <div>
                  <span className="text-sm font-semibold text-accent">signature</span>
                  <code className="mt-1 block break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-xs text-text-primary">
                    {decoded.signature}
                  </code>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="jwt-decoder" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="jwt-decoder" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
