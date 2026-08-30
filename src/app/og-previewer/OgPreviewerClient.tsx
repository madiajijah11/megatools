"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

type Platform = "google" | "twitter" | "discord" | "facebook";

export default function OgPreviewerClient() {
  const [title, setTitle] = useState("MegaTools — 50+ In-Browser Privacy Tools");
  const [description, setDescription] = useState(
    "Developer, media, and security tools running 100% in your browser. Zero server uploads, instant execution, dark terminal UI."
  );
  const [url, setUrl] = useState("https://megatools.vercel.app");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80");
  const [siteName, setSiteName] = useState("MegaTools");
  const [twitterHandle, setTwitterHandle] = useState("@megatools");
  const [platform, setPlatform] = useState<Platform>("twitter");
  const [outputTab, setOutputTab] = useState<"html" | "nextjs">("html");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const domain = useMemo(() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "example.com";
    }
  }, [url]);

  const htmlMeta = useMemo(() => {
    return `<!-- Primary Meta Tags -->
<title>${title}</title>
<meta name="title" content="${title}" />
<meta name="description" content="${description}" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${imageUrl}" />
<meta property="og:site_name" content="${siteName}" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="${url}" />
<meta property="twitter:title" content="${title}" />
<meta property="twitter:description" content="${description}" />
<meta property="twitter:image" content="${imageUrl}" />
<meta name="twitter:site" content="${twitterHandle}" />`;
  }, [title, description, url, imageUrl, siteName, twitterHandle]);

  const nextjsMeta = useMemo(() => {
    return `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "${title}",
  description: "${description}",
  openGraph: {
    title: "${title}",
    description: "${description}",
    url: "${url}",
    siteName: "${siteName}",
    images: [
      {
        url: "${imageUrl}",
        width: 1200,
        height: 630,
        alt: "${title}",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "${title}",
    description: "${description}",
    creator: "${twitterHandle}",
    images: ["${imageUrl}"],
  },
};`;
  }, [title, description, url, imageUrl, siteName, twitterHandle]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Title Length</p>
        <p className={`font-mono text-xs font-bold ${title.length > 60 ? "text-warning" : "text-success"}`}>
          {title.length} / 60 chars
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Desc Length</p>
        <p className={`font-mono text-xs font-bold ${description.length > 160 ? "text-warning" : "text-success"}`}>
          {description.length} / 160 chars
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
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">OpenGraph & Social Meta Tag Previewer</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Live preview how your website link looks when shared on Google, Twitter/X, Discord, and Facebook.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-3 mb-6 p-4 rounded-xl bg-bg-page border border-border-subtle">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Page Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Site Name:</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-text-secondary block mb-1">Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">Canonical URL:</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">OpenGraph Image URL:</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Social Platform Preview Tabs */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-4 bg-bg-page p-1 rounded-lg border border-border-subtle">
              {(
                [
                  { id: "twitter", label: "Twitter / X Card" },
                  { id: "google", label: "Google Search" },
                  { id: "discord", label: "Discord Embed" },
                  { id: "facebook", label: "Facebook Post" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPlatform(tab.id)}
                  className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${
                    platform === tab.id
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Visual Social Card Mockup */}
            <div className="p-6 rounded-xl bg-bg-page border border-border-subtle flex justify-center">
              {platform === "twitter" && (
                <div className="w-full max-w-[480px] rounded-2xl overflow-hidden border border-border-subtle bg-bg-card shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="OG Card"
                    className="w-full h-56 object-cover bg-bg-page"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                  <div className="p-3">
                    <p className="text-[11px] text-text-muted font-mono truncate">{domain}</p>
                    <h4 className="font-bold text-sm text-text-primary line-clamp-1 mt-0.5">{title}</h4>
                    <p className="text-xs text-text-secondary line-clamp-2 mt-1">{description}</p>
                  </div>
                </div>
              )}

              {platform === "google" && (
                <div className="w-full max-w-[560px] p-4 rounded-xl bg-bg-card border border-border-subtle font-sans">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent">
                      G
                    </div>
                    <div>
                      <p className="text-xs text-text-primary font-medium">{siteName}</p>
                      <p className="text-[10px] text-text-muted font-mono">{url}</p>
                    </div>
                  </div>
                  <h4 className="text-base text-accent hover:underline cursor-pointer font-medium mt-1">
                    {title}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                </div>
              )}

              {platform === "discord" && (
                <div className="w-full max-w-[440px] rounded-lg border-l-4 border-accent bg-[#1e1f22] p-4 text-left shadow-lg">
                  <p className="text-[11px] text-[#b5bac1] uppercase font-bold tracking-wide">{siteName}</p>
                  <h4 className="text-sm font-semibold text-[#00a8fc] hover:underline cursor-pointer mt-1">{title}</h4>
                  <p className="text-xs text-[#dbdee1] mt-1 line-clamp-3">{description}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Discord Embed"
                    className="w-full h-44 object-cover rounded-md mt-3"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                </div>
              )}

              {platform === "facebook" && (
                <div className="w-full max-w-[480px] rounded-lg overflow-hidden border border-border-subtle bg-bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Facebook Card"
                    className="w-full h-52 object-cover bg-bg-page"
                    onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                  />
                  <div className="p-3 bg-bg-page/50 border-t border-border-subtle">
                    <p className="text-[10px] text-text-muted uppercase font-mono">{domain}</p>
                    <h4 className="font-bold text-sm text-text-primary line-clamp-1 mt-0.5">{title}</h4>
                    <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Generated Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOutputTab("html")}
                  className={`text-xs font-mono px-2 py-1 rounded ${
                    outputTab === "html" ? "bg-accent-soft text-accent font-bold" : "text-text-muted"
                  }`}
                >
                  HTML &lt;meta&gt; Tags
                </button>
                <button
                  type="button"
                  onClick={() => setOutputTab("nextjs")}
                  className={`text-xs font-mono px-2 py-1 rounded ${
                    outputTab === "nextjs" ? "bg-accent-soft text-accent font-bold" : "text-text-muted"
                  }`}
                >
                  Next.js App Router Metadata
                </button>
              </div>
              <CopyButton text={outputTab === "html" ? htmlMeta : nextjsMeta} />
            </div>
            <div className="p-3 bg-bg-page border border-border-subtle rounded-lg font-mono text-xs text-text-primary overflow-x-auto max-h-[220px] overflow-y-auto">
              <pre className="whitespace-pre">{outputTab === "html" ? htmlMeta : nextjsMeta}</pre>
            </div>
          </div>
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden lg:block">
          <InfoPanel toolId="og-previewer" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="og-previewer" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
