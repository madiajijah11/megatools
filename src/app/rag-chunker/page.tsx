import type { Metadata } from "next";
import RagChunkerClient from "./RagChunkerClient";

export const metadata: Metadata = {
  title: "RAG Document Chunker & Overlap Visualizer — MegaTools",
  description:
    "Partition texts and documents into semantic chunks with customizable token sizes and overlap windows. Export ready-to-ingest JSON/JSONL for Vector DBs (Pinecone, Chroma, Qdrant).",
  keywords: [
    "rag text chunker",
    "document splitter",
    "chunk overlap visualizer",
    "vector database chunking",
    "semantic text splitter",
    "recursive character text splitter",
    "embedding preprocessor",
    "rag ingestion tool",
  ],
  openGraph: {
    title: "RAG Document Chunker & Overlap Visualizer — MegaTools",
    description:
      "Split long texts into optimized semantic chunks with overlap for RAG embeddings and vector databases.",
  },
  alternates: {
    canonical: "/rag-chunker",
  },
};

export default function RagChunkerPage() {
  return <RagChunkerClient />;
}
