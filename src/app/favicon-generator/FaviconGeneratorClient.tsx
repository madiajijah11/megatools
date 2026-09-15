"use client";

import { useState, useCallback, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface FaviconSize {
  size: number;
  label: string;
  dataUrl: string | null;
  purpose: string;
}

const FAVICON_SIZES = [
  { size: 16, label: "favicon-16x16.png", purpose: "Standard Browser Tab" },
  { size: 32, label: "favicon-32x32.png", purpose: "Retina / Desktop Taskbar" },
  { size: 48, label: "favicon-48x48.png", purpose: "Windows Site Icon" },
  { size: 180, label: "apple-touch-icon.png", purpose: "iOS / iPad Home Screen" },
  { size: 192, label: "android-chrome-192x192.png", purpose: "Android PWA Launcher" },
  { size: 512, label: "android-chrome-512x512.png", purpose: "PWA Splash Screen" },
];

export default function FaviconGeneratorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [icons, setIcons] = useState<FaviconSize[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const generateIcons = useCallback(async (selectedFile: File) => {
    setIsGenerating(true);
    setError(null);
    setIcons([]);

    const objUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objUrl);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load source image"));
        img.src = objUrl;
      });

      const generated: FaviconSize[] = [];
      for (const item of FAVICON_SIZES) {
        const canvas = document.createElement("canvas");
        canvas.width = item.size;
        canvas.height = item.size;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, item.size, item.size);

        const dataUrl = canvas.toDataURL("image/png");
        generated.push({ ...item, dataUrl });
      }

      setIcons(generated);
    } catch (err) {
      setError(`Icon generation failed: ${(err as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      generateIcons(f);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) {
      setFile(f);
      generateIcons(f);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const htmlTags = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">`;

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Target Sizes:</span>
        <span className="text-accent font-bold">6 Dimensions (16px to 512px)</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Platform Support:</span>
        <span className="text-text-primary">iOS, Android PWA, Windows, Web</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Rendering:</span>
        <span className="text-success font-bold">100% Canvas Resampling</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="favicon-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Upload Dropzone */}
        {!file ? (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
              dragOver
                ? "border-accent bg-accent/5"
                : "border-border-subtle hover:border-accent/40 bg-bg-page"
            }`}
          >
            <span className="text-2xl mb-2">✨</span>
            <span className="text-sm font-semibold text-text-primary">
              Upload high-resolution logo or icon (PNG / SVG / WebP)
            </span>
            <span className="text-xs text-text-muted mt-1">
              For best results, use a square logo with transparent background (512x512px or higher).
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="p-3 rounded-lg border border-border-subtle bg-bg-page flex items-center justify-between text-xs">
            <div className="flex items-center gap-3 truncate">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Source icon"
                  className="w-10 h-10 rounded object-contain border border-border-subtle bg-white/5"
                />
              )}
              <div className="truncate">
                <span className="font-bold text-text-primary block truncate">{file.name}</span>
                <span className="text-text-muted text-[10px]">Source logo loaded</span>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setPreviewUrl(null);
                setIcons([]);
              }}
              className="text-xs text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle shrink-0"
            >
              [Change Image]
            </button>
          </div>
        )}

        {/* Processing Indicator */}
        {isGenerating && (
          <div className="p-4 rounded-lg border border-accent/30 bg-accent/10 text-xs text-accent text-center">
            Rendering multi-resolution rasterized favicons in browser memory...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            {error}
          </div>
        )}

        {/* Generated Favicons Grid */}
        {icons.length > 0 && (
          <div className="pt-2 border-t border-border-subtle space-y-4">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Generated Multi-Size Favicon Package</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {icons.map((item) => (
                <div
                  key={item.size}
                  className="p-3 rounded-lg border border-border-subtle bg-bg-page flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded border border-border-subtle bg-white/5 flex items-center justify-center shrink-0">
                      {item.dataUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.dataUrl}
                          alt={item.label}
                          className="max-w-[36px] max-h-[36px] object-contain"
                        />
                      )}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-accent text-xs block truncate">{item.label}</span>
                      <span className="text-[10px] text-text-muted block">{item.purpose}</span>
                    </div>
                  </div>

                  {item.dataUrl && (
                    <a
                      href={item.dataUrl}
                      download={item.label}
                      className="w-full py-1 text-center rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-accent hover:border-accent transition-colors text-[11px]"
                    >
                      Download ({item.size}x{item.size})
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* HTML Head snippet */}
            <div className="pt-3 border-t border-border-subtle space-y-2">
              <div className="h-8 flex items-center justify-between text-xs">
                <span className="font-semibold text-text-primary">HTML &lt;head&gt; Integration Snippet</span>
                <CopyButton text={htmlTags} label="Copy HTML Tags" />
              </div>
              <pre className="p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed">
                {htmlTags}
              </pre>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
