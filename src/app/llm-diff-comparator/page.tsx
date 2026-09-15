import type { Metadata } from "next";
import LlmDiffComparatorClient from "./LlmDiffComparatorClient";

export const metadata: Metadata = {
  title: "LLM Output Diff & Hallucination Spotter — MegaTools",
  description:
    "Compare AI model outputs side-by-side with word-level diff, numerical discrepancy analysis, and hallucination detection client-side.",
  keywords: [
    "llm diff comparator",
    "ai output comparison",
    "hallucination detector",
    "numeric discrepancy spotter",
    "gpt vs claude output diff",
    "prompt evaluation tool",
    "model benchmark comparator",
    "ai response analyzer"
  ],
  alternates: {
    canonical: "/llm-diff-comparator",
  },
  openGraph: {
    title: "LLM Output Diff & Hallucination Spotter — MegaTools",
    description:
      "Spot hallucinations and compare LLM responses side-by-side with word-level diff and numerical consistency checks.",
    url: "https://megatools-tau.vercel.app/llm-diff-comparator",
    type: "website",
  },
};

export default function LlmDiffComparatorPage() {
  return <LlmDiffComparatorClient />;
}
