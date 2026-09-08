"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface ChunkItem {
  id: string;
  index: number;
  content: string;
  charCount: number;
  estimatedTokens: number;
  overlapPrefix: string;
}

const PRESETS = {
  aiArticle: `# Retrieval-Augmented Generation (RAG) Architecture

Retrieval-Augmented Generation (RAG) is an architectural pattern that optimizes the output of large language models (LLMs) by referencing an authoritative knowledge base outside of its training data sources before generating a response.

## Why Chunking Matters in RAG
Large Language Models have fixed context windows and attention limitations. When indexing extensive knowledge documents—such as company handbooks, medical journals, or technical source code—we cannot inject millions of tokens in one prompt.

Instead, documents are broken down into discrete segments called "chunks". Each chunk is converted into a dense vector embedding and indexed into a vector database like Pinecone, Milvus, or Qdrant.

## The Overlap Strategy
When a text boundary is cut abruptly mid-sentence, essential relational context can be lost. Introducing an overlap buffer ensures that consecutive chunks share boundary context. For example, with a chunk size of 500 characters and an overlap of 100 characters, the last 100 characters of Chunk 1 are prepended to Chunk 2.

## Embedding Search and Retrieval
At query time, the user prompt is embedded into the same vector space. A Cosine Similarity or Approximate Nearest Neighbor (ANN) search retrieves the top-K relevant chunks, which are then injected into the LLM system prompt as verified context.`,

  apiSpec: `# API Authentication Specification

All API requests to the MegaTools platform must be authenticated using an API bearer token in the HTTP Authorization header.

### Bearer Token Format
Authorization: Bearer sk-live-YOUR_SECRET_TOKEN

### Rate Limits
Production tier accounts are permitted up to 10,000 requests per minute with a burst allowance of 500 requests per 10-second window. If a client exceeds this threshold, the server immediately returns HTTP 429 Too Many Requests with a Retry-After header.

### Error Handling Protocol
Standard JSON error responses contain an "error" envelope with "code", "message", and "request_id" properties. All request IDs should be logged for diagnostic tracing during customer support inquiries.`,
};
function recursiveSplit(text: string, chunkSize: number, overlap: number, separators: string[]): string[] {
  if (!text || chunkSize <= 0) return [];
  if (text.length <= chunkSize) return [text];

  let chosenSeparator = "";
  for (const sep of separators) {
    if (text.includes(sep)) {
      chosenSeparator = sep;
      break;
    }
  }

  const rawSplits = chosenSeparator !== "" ? text.split(chosenSeparator) : Array.from(text);
  const chunks: string[] = [];
  let currentPiece = "";

  for (let i = 0; i < rawSplits.length; i++) {
    const part = rawSplits[i];
    const candidate = currentPiece ? currentPiece + (chosenSeparator || "") + part : part;

    if (candidate.length <= chunkSize) {
      currentPiece = candidate;
    } else {
      if (currentPiece.trim()) {
        chunks.push(currentPiece.trim());
      }

      // Calculate overlap from previous chunk
      if (overlap > 0 && currentPiece.length > 0) {
        const overlapSlice = currentPiece.slice(-overlap);
        currentPiece = overlapSlice + (chosenSeparator || "") + part;
      } else {
        currentPiece = part;
      }

      // If a single part exceeds chunkSize, force slice it
      while (currentPiece.length > chunkSize) {
        chunks.push(currentPiece.slice(0, chunkSize).trim());
        currentPiece = (overlap > 0 ? currentPiece.slice(chunkSize - overlap) : currentPiece.slice(chunkSize));
      }
    }
  }

  if (currentPiece.trim()) {
    chunks.push(currentPiece.trim());
  }

  return chunks;
}
export default function RagChunkerClient() {
  const [inputText, setInputText] = useState<string>(PRESETS.aiArticle);
  const [chunkSize, setChunkSize] = useState<number>(450);
  const [overlap, setOverlap] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeOverlap = Math.min(overlap, Math.floor(chunkSize * 0.5));

  const chunks = useMemo<ChunkItem[]>(() => {
    if (!inputText.trim()) return [];
    const separators = ["\n\n", "\n", ". ", " ", ""];
    const rawChunks = recursiveSplit(inputText, chunkSize, safeOverlap, separators);

    return rawChunks.map((content, idx) => {
      const estimatedTokens = Math.max(1, Math.round(content.length / 4));
      const overlapPrefix = idx > 0 && safeOverlap > 0 ? content.slice(0, safeOverlap) : "";

      return {
        id: "chunk-" + (idx + 1),
        index: idx + 1,
        content,
        charCount: content.length,
        estimatedTokens,
        overlapPrefix,
      };
    });
  }, [inputText, chunkSize, safeOverlap]);

  const jsonExport = useMemo(() => {
    const formatted = chunks.map((c) => ({
      id: c.id,
      text: c.content,
      metadata: {
        chunk_index: c.index,
        char_count: c.charCount,
        estimated_tokens: c.estimatedTokens,
      },
    }));
    return JSON.stringify(formatted, null, 2);
  }, [chunks]);

  const totalTokens = useMemo(() => {
    return chunks.reduce((acc, c) => acc + c.estimatedTokens, 0);
  }, [chunks]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        setInputText(text);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonExport], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rag-chunks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Generated Chunks:</span>
        <span className="text-accent font-bold">{chunks.length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Total Tokens (Est):</span>
        <span className="text-text-primary font-bold">~{totalTokens.toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Overlap Ratio:</span>
        <span className="text-success font-bold">
          {chunkSize > 0 ? Math.round((safeOverlap / chunkSize) * 100) : 0}%
        </span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Processing:</span>
        <span className="text-accent font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-accent transition-colors"
        >
          <span>←</span> [cd .. / home]
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card text-text-secondary hover:text-text-primary"
        >
          [?] Tool Info
        </button>
      </div>

      {/* Hero Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-border-subtle bg-bg-card font-mono text-xs text-text-secondary mb-3">
          <span className="text-accent">$</span>
          <span>megatools --rag-chunker --recursive-split</span>
          <span className="animate-pulse text-accent">▊</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          RAG Document Chunker & <span className="gradient-text">Overlap Visualizer</span>
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Partition documents into embedding-ready chunks with configurable token windows, overlap buffers, and Vector DB JSON exports.
        </p>

        {/* Presets and Upload Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-text-muted">PRESETS:</span>
          <button
            onClick={() => setInputText(PRESETS.aiArticle)}
            className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
          >
            [RAG Architecture]
          </button>
          <button
            onClick={() => setInputText(PRESETS.apiSpec)}
            className="px-2 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 hover:text-accent transition-colors"
          >
            [API Spec Doc]
          </button>

          <span className="text-border-subtle">|</span>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
            accept=".txt,.md,.markdown,.json,.yaml,.csv"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent/40 text-text-secondary hover:text-accent transition-colors"
          >
            📂 Load Document...
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Controls & Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sliders Configuration Card */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 space-y-4 font-mono text-xs">
            <div className="h-8 flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> CHUNKING_HYPERPARAMETERS
              </span>
              <span className="text-text-muted text-[11px]">
                Algorithm: Recursive Character Split
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Chunk Size Slider */}
              <div className="space-y-1.5 p-3 rounded bg-bg-page border border-border-subtle">
                <div className="flex justify-between items-center">
                  <label className="text-text-secondary font-medium">Target Chunk Size (Chars):</label>
                  <span className="text-accent font-bold">{chunkSize} chars</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(parseInt(e.target.value, 10))}
                  className="w-full accent-accent cursor-pointer"
                />
                <span className="text-[10px] text-text-muted block">
                  ≈ {Math.round(chunkSize / 4)} tokens per vector record
                </span>
              </div>

              {/* Overlap Window Slider */}
              <div className="space-y-1.5 p-3 rounded bg-bg-page border border-border-subtle">
                <div className="flex justify-between items-center">
                  <label className="text-text-secondary font-medium">Overlap Buffer:</label>
                  <span className="text-warning font-bold">{safeOverlap} chars</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400"
                  step="10"
                  value={overlap}
                  onChange={(e) => setOverlap(parseInt(e.target.value, 10))}
                  className="w-full accent-warning cursor-pointer"
                />
                <span className="text-[10px] text-text-muted block">
                  Carries last {safeOverlap} chars across adjacent chunk boundaries
                </span>
              </div>
            </div>
          </div>

          {/* 2-Column Split: Raw Text ↔ Chunks Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input Column */}
            <div className="rounded-lg border border-border-subtle bg-bg-card p-4 flex flex-col font-mono">
              <div className="h-8 flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <span className="text-accent">&gt;</span> SOURCE_DOCUMENT
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-text-muted">
                    {inputText.length} chars · ~{Math.round(inputText.length / 4)} tokens
                  </span>
                  {inputText && (
                    <button
                      onClick={() => setInputText("")}
                      className="text-xs px-2 py-1 rounded border border-border-subtle text-text-muted hover:text-error hover:border-error/40 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste document to partition into chunks..."
                className="w-full h-[420px] resize-y bg-bg-page border border-border-subtle rounded p-3 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none transition-colors"
                spellCheck={false}
              />
            </div>

            {/* Output Column */}
            <div className="rounded-lg border border-border-subtle bg-bg-card p-4 flex flex-col font-mono">
              <div className="h-8 flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 bg-bg-page border border-border-subtle rounded p-0.5 text-xs">
                  <button
                    onClick={() => setActiveTab("visual")}
                    className={"px-2.5 py-0.5 rounded transition-colors " + (
                      activeTab === "visual"
                        ? "bg-accent-soft text-accent font-bold border border-accent/40"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    Visual Chunks ({chunks.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("json")}
                    className={"px-2.5 py-0.5 rounded transition-colors " + (
                      activeTab === "json"
                        ? "bg-accent-soft text-accent font-bold border border-accent/40"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    JSON Export
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {activeTab === "json" ? (
                    <>
                      <button
                        onClick={handleDownloadJson}
                        className="text-xs px-2 py-1 rounded border border-border-subtle bg-bg-page text-text-secondary hover:text-accent hover:border-accent/40 transition-colors cursor-pointer"
                      >
                        Download
                      </button>
                      <CopyButton text={jsonExport} label="copy" />
                    </>
                  ) : (
                    <CopyButton
                      text={chunks.map((c) => c.content).join("\n\n--- CHUNK SEPARATOR ---\n\n")}
                      label="copy all"
                    />
                  )}
                </div>
              </div>

              {/* View 1: Visual Chunk Cards */}
              {activeTab === "visual" && (
                <div className="h-[420px] overflow-y-auto bg-bg-page border border-border-subtle rounded p-3 text-xs space-y-3">
                  {chunks.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-text-muted">
                      Paste document to preview generated chunks.
                    </div>
                  ) : (
                    chunks.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded border border-border-subtle bg-bg-card hover:border-accent/30 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-border-subtle/60 pb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent-soft text-accent border border-accent/30">
                              #{c.index}
                            </span>
                            <span className="text-[11px] text-text-muted">
                              {c.charCount} chars · ~{c.estimatedTokens} tokens
                            </span>
                          </div>
                          <CopyButton text={c.content} label="copy" />
                        </div>

                        <div className="text-[11px] text-text-primary leading-relaxed whitespace-pre-wrap break-words">
                          {c.overlapPrefix && (
                            <span
                              className="bg-warning/15 text-warning px-1 py-0.5 rounded mr-1 border border-warning/30 inline"
                              title="Overlapped content from previous chunk"
                            >
                              [overlap: {c.overlapPrefix.length}c] {c.overlapPrefix}
                            </span>
                          )}
                          <span>
                            {c.overlapPrefix ? c.content.slice(c.overlapPrefix.length) : c.content}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View 2: JSON Export */}
              {activeTab === "json" && (
                <div className="h-[420px] overflow-y-auto bg-bg-page border border-border-subtle rounded p-3 text-xs">
                  <pre className="text-text-primary whitespace-pre-wrap break-all leading-relaxed">
                    {jsonExport}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Info Panel Desktop */}
        <div className="hidden lg:block">
          <InfoPanel toolId="rag-chunker" stats={stats} />
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="rag-chunker" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
