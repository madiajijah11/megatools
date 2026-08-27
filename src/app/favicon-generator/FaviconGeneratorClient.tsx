"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface IconSize {
  name: string;
  size: number;
  filename: string;
  url: string | null;
  blob: Blob | null;
}

const ICON_SIZES: Omit<IconSize, "url" | "blob">[] = [
  { name: "Standard Favicon (Small)", size: 16, filename: "favicon-16x16.png" },
  { name: "Standard Favicon (Medium)", size: 32, filename: "favicon-32x32.png" },
  { name: "Desktop Favicon (Large)", size: 48, filename: "favicon-48x48.png" },
  { name: "Apple Touch Icon", size: 180, filename: "apple-touch-icon.png" },
  { name: "Android PWA Icon", size: 192, filename: "android-chrome-192x192.png" },
  { name: "High-Res PWA / Splash", size: 512, filename: "android-chrome-512x512.png" },
];

export default function FaviconGeneratorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedIcons, setGeneratedIcons] = useState<IconSize[]>([]);
  const [generating, setGenerating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateIcons = useCallback(async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setGenerating(true);

    const masterUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(masterUrl);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load source image"));
        img.src = masterUrl;
      });

      const icons: IconSize[] = [];

      for (const item of ICON_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = item.size;
        canvas.height = item.size;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        // High quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Center and crop to square
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minDim) / 2;
        const sy = (img.naturalHeight - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, item.size, item.size);

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (blob) {
          icons.push({
            ...item,
            blob,
            url: URL.createObjectURL(blob),
          });
        }
      }

      setGeneratedIcons(icons);
    } catch (err) {
      setError(`Icon generation failed: ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      generatedIcons.forEach((i) => {
        if (i.url) URL.revokeObjectURL(i.url);
      });
    };
  }, [previewUrl, generatedIcons]);

  const htmlSnippet = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Generated</p>
        <p className="text-text-primary font-mono">{generatedIcons.length ? `${generatedIcons.length} sizes` : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Format</p>
        <p className="text-text-primary font-mono">PNG / Icons</p>
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
              <span className="gradient-text">Favicon & App Icon Generator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Generate standard website favicons and PWA icons with ready-to-use HTML code.
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
                if (f) generateIcons(f);
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
                  if (f) generateIcons(f);
                }}
              />
              <span className="font-mono text-sm text-text-secondary">
                $ drop master logo or image here (at least 512x512 recommended)
              </span>
              <span className="text-xs text-text-muted">PNG · JPG · WebP · SVG</span>
            </label>
          ) : (
            <div className="space-y-6">
              {/* Selected master file */}
              <div className="flex items-center justify-between rounded border border-border-subtle bg-bg-page p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-semibold text-text-primary">
                    {file.name}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {(file.size / 1024).toFixed(1)} KB · Master image
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    setGeneratedIcons([]);
                  }}
                  className="btn-secondary text-xs shrink-0"
                >
                  Change Image
                </button>
              </div>

              {generating && (
                <p className="text-center text-xs font-mono text-accent animate-pulse">
                  $ generating pixel-perfect icons...
                </p>
              )}

              {/* Icon Grid */}
              {generatedIcons.length > 0 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {generatedIcons.map((item) => (
                      <div
                        key={item.size}
                        className="rounded border border-border-subtle bg-bg-page p-3 flex flex-col items-center text-center"
                      >
                        <div className="w-16 h-16 rounded bg-bg-card border border-border-subtle flex items-center justify-center p-1 mb-2">
                          {item.url && (
                            <img
                              src={item.url}
                              alt={item.name}
                              className="max-w-full max-h-full object-contain"
                              style={{
                                width: Math.min(item.size, 48),
                                height: Math.min(item.size, 48),
                              }}
                            />
                          )}
                        </div>
                        <p className="font-mono text-xs font-semibold text-text-primary">
                          {item.size}x{item.size} px
                        </p>
                        <p className="text-[11px] text-text-muted font-mono truncate max-w-full">
                          {item.filename}
                        </p>

                        {item.url && (
                          <a
                            href={item.url}
                            download={item.filename}
                            className="mt-2 btn-secondary text-[11px] py-1 px-3 w-full"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* HTML Snippet */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-text-muted uppercase">
                        HTML Header Tags (Paste into your &lt;head&gt;)
                      </label>
                      <CopyButton text={htmlSnippet} label="copy html" />
                    </div>
                    <pre className="output-field min-h-[100px] text-xs font-mono text-text-secondary overflow-x-auto">
                      <code>{htmlSnippet}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-error text-center">{error}</p>}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="favicon-generator" stats={stats} />
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
        <InfoPanel toolId="favicon-generator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
