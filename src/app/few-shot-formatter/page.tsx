import type { Metadata } from "next";
import FewShotFormatterClient from "./FewShotFormatterClient";

export const metadata: Metadata = {
  title: "Few-Shot Prompt & Fine-Tuning Dataset Formatter — MegaTools",
  description:
    "Construct, validate, and convert few-shot examples into OpenAI JSONL, Anthropic XML, ChatML, and Llama 3 prompt templates with zero data leakage.",
  keywords: [
    "few shot generator",
    "jsonl fine tuning formatter",
    "openai fine-tuning dataset",
    "anthropic few shot xml",
    "chatml formatter",
    "llama 3 prompt template",
    "prompt engineering few-shot",
    "llm training data creator"
  ],
  alternates: {
    canonical: "/few-shot-formatter",
  },
  openGraph: {
    title: "Few-Shot Prompt & Fine-Tuning Dataset Formatter — MegaTools",
    description:
      "Transform raw prompt examples into production-ready OpenAI JSONL, Anthropic XML, and ChatML formats client-side.",
    url: "https://megatools-tau.vercel.app/few-shot-formatter",
    type: "website",
  },
};

export default function FewShotFormatterPage() {
  return <FewShotFormatterClient />;
}
