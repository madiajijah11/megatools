import type { Metadata } from "next";
import AiModelComparatorClient from "./AiModelComparatorClient";

export const metadata: Metadata = {
  title: "AI Model Pricing & Context Window Matrix — MegaTools",
  description:
    "Compare pricing, context limits, and token costs for 25+ LLM models (DeepSeek, Claude 3.7, GPT-4o, Gemini 2.0, Llama 3.3) with models.dev sync support.",
  openGraph: {
    title: "AI Model Pricing & Context Matrix",
    description: "Instant in-browser LLM pricing comparison matrix, context window analyzer, and token cost calculator.",
  },
};

export default function AiModelComparatorPage() {
  return <AiModelComparatorClient />;
}
