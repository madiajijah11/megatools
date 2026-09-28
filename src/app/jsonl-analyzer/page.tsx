import type { Metadata } from "next";
import JsonlAnalyzerClient from "./JsonlAnalyzerClient";

export const metadata: Metadata = {
  title: "JSONL Analyzer & Schema Inspector — MegaTools",
  description: "Free client-side jsonl analyzer & schema inspector tool with zero data leakage.",
  keywords: ["jsonl-analyzer", "jsonl analyzer & schema inspector", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/jsonl-analyzer",
  },
  openGraph: {
    title: "JSONL Analyzer & Schema Inspector — MegaTools",
    description: "Free client-side jsonl analyzer & schema inspector tool.",
    url: "https://megatools-tau.vercel.app/jsonl-analyzer",
    type: "website",
  },
};

export default function JsonlAnalyzerPage() {
  return <JsonlAnalyzerClient />;
}
