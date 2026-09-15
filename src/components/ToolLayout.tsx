"use client";

import { useState } from "react";
import Link from "next/link";
import InfoPanel from "./InfoPanel";
import MobileInfoDrawer from "./MobileInfoDrawer";
import { getToolInfo } from "@/lib/tool-data";

export interface ToolLayoutProps {
  toolId: string;
  stats?: React.ReactNode;
  children: React.ReactNode;
  customTitle?: string;
  customBadge?: string;
  customDescription?: string;
}

export default function ToolLayout({
  toolId,
  stats,
  children,
  customTitle,
  customBadge,
  customDescription,
}: ToolLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toolInfo = getToolInfo(toolId);

  const title = customTitle || toolInfo?.title || toolId;
  const badge = customBadge || `megatools --${toolId} --client-side`;
  const description = customDescription || toolInfo?.description;

  // Split title to highlight the last or second-to-last word in accent green
  const titleWords = title.split(" ");
  let titleNode = <>{title}</>;
  if (titleWords.length >= 2) {
    const mainWords = titleWords.slice(0, titleWords.length - 2).join(" ");
    const highlightWord = titleWords.slice(titleWords.length - 2, titleWords.length - 1).join(" ");
    const lastWord = titleWords[titleWords.length - 1];
    titleNode = (
      <>
        {mainWords && `${mainWords} `}
        <span className="text-accent">{highlightWord}</span>
        {` ${lastWord}`}
      </>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-mono text-text-muted hover:text-accent transition-colors inline-flex items-center gap-1"
        >
          ← [cd .. / home]
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
        >
          [?] Tool Info
        </button>
      </div>

      {/* Terminal Hero Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-subtle bg-bg-card font-mono text-xs text-text-secondary mb-3">
          <span className="text-accent">$</span>
          <span>{badge}</span>
          <span className="inline-block w-1.5 h-3.5 bg-accent animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-mono text-text-primary tracking-tight">
          {titleNode}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm font-mono text-text-muted mt-1.5 max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* 12-Column Responsive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Tool Workspace (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {children}
        </div>

        {/* Right Column: Desktop InfoPanel Sidebar (4 cols) */}
        <div className="hidden lg:block lg:col-span-4">
          <InfoPanel toolId={toolId} stats={stats} />
        </div>
      </div>

      {/* Mobile Info Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId={toolId} stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
