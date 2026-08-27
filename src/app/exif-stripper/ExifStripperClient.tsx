"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

export default function ExifStripperClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cleanBlob, setCleanBlob] = useState<Blob | null>(null);
  const [cleanUrl, setCleanUrl] = useState<string | null>(null);
  const [sanitizing, setSanitizing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitizeImage = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setCleanBlob(null);
    setCleanUrl(null);
    setSanitizing(true);

    const originalUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(originalUrl);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load photo"));
        img.src = originalUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context unavailable");

      // Draw pure pixel buffer (Canvas does not copy EXIF metadata)
      ctx.drawImage(img, 0, 0);

      const mime = selectedFile.type === "image/png" ? "image/png" : "image/jpeg";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, 0.95)
      );

      if (!blob) throw new Error("Sanitization failed");

      setCleanBlob(blob);
      const url = URL.createObjectURL(blob);
      setCleanUrl(url);
    } catch (err) {
      setError(`Error sanitizing image: ${(err as Error).message}`);
    } finally {
      setSanitizing(false);
    }
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (cleanUrl) URL.revokeObjectURL(cleanUrl);
    };
  }, [previewUrl, cleanUrl]);

  const originalSize = file ? file.size : 0;
  const sanitizedSize = cleanBlob ? cleanBlob.size : 0;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Metadata Status</p>
        <p className={`font-mono ${cleanBlob ? "text-success font-semibold" : "text-text-primary"}`}>
          {cleanBlob ? "PURGED" : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Sanitized Size</p>
        <p className="text-text-primary font-mono">
          {sanitizedSize ? `${(sanitizedSize / 1024).toFixed(1)} KB` : "—"}
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
              <span className="gradient-text">EXIF & Metadata Stripper</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Strip GPS locations, camera serials, and private tags before uploading photos.
            </p>
          </div>

          {/* Upload Dropzone */}
          {!file ? (
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
                if (f) sanitizeImage(f);
              }}
              className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed px-6 py-8 text-center transition-colors ${
                dragOver
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle bg-bg-page hover:border-accent"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) sanitizeImage(f);
                }}
              />
              <span className="font-mono text-sm text-text-secondary">
                $ drop photo here to purge EXIF/GPS tags
              </span>
              <span className="text-xs text-text-muted">JPEG · PNG · WebP (All metadata removed)</span>
            </label>
          ) : (
            <div className="space-y-6">
              {/* File details */}
              <div className="flex items-center justify-between rounded border border-border-subtle bg-bg-page p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-text-primary">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    Original size: {(originalSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setCleanBlob(null);
                    setCleanUrl(null);
                  }}
                  className="btn-secondary text-xs shrink-0"
                >
                  Sanitize Another
                </button>
              </div>

              {/* Stripped metadata list */}
              <div className="rounded border border-border-subtle bg-bg-page p-4 text-xs font-mono">
                <p className="text-accent font-semibold mb-2 flex items-center gap-1.5">
                  <span>🛡️</span> 100% PURGED METADATA TAGS:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-text-secondary">
                  <div>✓ GPS Latitude / Longitude</div>
                  <div>✓ Camera Make & Model</div>
                  <div>✓ Date & Timestamp</div>
                  <div>✓ Software & Firmware</div>
                  <div>✓ Camera Serial Numbers</div>
                  <div>✓ Lens & Exposure Settings</div>
                  <div>✓ Owner & Author Tags</div>
                  <div>✓ Thumbnail Caches</div>
                  <div>✓ IPTC & XMP Profiles</div>
                </div>
              </div>

              {/* Status & Download */}
              {cleanUrl && (
                <div className="rounded border border-accent/40 bg-accent-soft p-4 text-center space-y-4">
                  <div className="max-h-60 overflow-hidden rounded bg-bg-card flex items-center justify-center p-2">
                    <img
                      src={cleanUrl}
                      alt="Sanitized photo"
                      className="max-h-52 max-w-full object-contain rounded"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-t border-border-subtle pt-3">
                    <span className="text-text-secondary">
                      Clean Size:{" "}
                      <strong className="text-text-primary">
                        {(sanitizedSize / 1024).toFixed(1)} KB
                      </strong>
                    </span>
                    <a
                      href={cleanUrl}
                      download={`clean-${file.name}`}
                      className="btn-primary py-1.5 px-6 text-xs"
                    >
                      Download Clean Photo
                    </a>
                  </div>
                </div>
              )}

              {sanitizing && (
                <p className="text-center text-xs font-mono text-accent animate-pulse">
                  $ sanitizing raw pixel buffer...
                </p>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-error text-center">{error}</p>}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="exif-stripper" stats={stats} />
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
        <InfoPanel toolId="exif-stripper" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
