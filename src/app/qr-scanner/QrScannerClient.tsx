"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface BarcodeDetectorLike {
  detect(src: ImageBitmapSource): Promise<{ rawValue: string }[]>;
}

type ScanStatus = "idle" | "found" | "notfound" | "error" | "unsupported";

function getDetector(): BarcodeDetectorLike | null {
  const w = window as unknown as {
    BarcodeDetector?: new (o?: { formats?: string[] }) => BarcodeDetectorLike;
  };
  if (!w.BarcodeDetector) return null;
  try {
    return new w.BarcodeDetector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

export default function QrScannerClient() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [fileInfo, setFileInfo] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSupported(getDetector() !== null);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setResult("");
    setStatus("idle");
    setFileInfo(`${file.name} · ${(file.size / 1024).toFixed(1)} KB`);
    const detector = getDetector();
    if (!detector) {
      setStatus("unsupported");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const codes = await detector.detect(bitmap);
        if (codes.length > 0) {
          setResult(codes[0].rawValue);
          setStatus("found");
        } else {
          setStatus("notfound");
        }
      } finally {
        bitmap.close();
      }
    } catch {
      setStatus("error");
    }
  }, []);

  // Revoke nothing persistent: createImageBitmap reads from File buffer,
  // no object URL is kept alive.
  useEffect(
    () => () => {
      setResult("");
    },
    []
  );

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Status</p>
        <p
          className={`font-mono ${
            status === "found"
              ? "text-success"
              : status === "error" || status === "unsupported"
                ? "text-error"
                : "text-text-primary"
          }`}
        >
          {status}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">API</p>
        <p className="text-text-primary font-mono">
          {supported === null ? "—" : supported ? "native" : "missing"}
        </p>
      </div>
    </div>
  );

  const isLink = /^https?:\/\//i.test(result);

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
              <span className="gradient-text">QR Scanner</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Decode QR codes from images — locally, no uploads.
            </p>
          </div>

          {supported === false && (
            <p className="mb-4 text-center text-sm text-warning border border-border-subtle rounded bg-bg-page px-3 py-2">
              Your browser does not support BarcodeDetector. Use Chrome or Edge.
            </p>
          )}

          {/* Drop zone */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-10 text-center transition-colors ${
              dragOver
                ? "border-accent bg-accent-soft"
                : "border-border-subtle bg-bg-page hover:border-accent"
            } ${supported === false ? "pointer-events-none opacity-50" : ""}`}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <span className="font-mono text-sm text-text-secondary">
              $ drop image here -- or click to browse
            </span>
            <span className="text-xs text-text-muted">PNG · JPG · WebP</span>
          </label>

          {fileInfo && (
            <p className="mt-3 text-center text-xs text-text-muted">{fileInfo}</p>
          )}

          {/* Result */}
          {(result || status === "notfound" || status === "error") && (
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-text-secondary">
                Decoded content
              </label>
              {result ? (
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 break-all rounded bg-bg-page border border-border-subtle px-3 py-2 text-sm text-text-primary">
                    {isLink ? (
                      <a
                        href={result}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent underline underline-offset-2"
                      >
                        {result}
                      </a>
                    ) : (
                      result
                    )}
                  </code>
                  <CopyButton text={result} label="copy" />
                </div>
              ) : (
                <p className="text-sm text-error">
                  {status === "notfound"
                    ? "no QR code found in this image"
                    : "failed to read this image"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="qr-scanner" stats={stats} />
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
        <InfoPanel toolId="qr-scanner" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
