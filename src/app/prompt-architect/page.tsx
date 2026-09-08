import type { Metadata } from "next";
import PromptArchitectClient from "./PromptArchitectClient";

export const metadata: Metadata = {
  title: "Structured System Prompt Architect — MegaTools",
  description:
    "Design production-ready, anti-hallucination system prompts with role constraints, XML boundaries, and few-shot formatting for Claude, GPT-4o, and Gemini.",
  keywords: [
    "system prompt builder",
    "prompt architect",
    "prompt engineering tool",
    "anthropic xml prompt generator",
    "anti hallucination prompt",
    "llm guardrail builder",
    "few shot prompt maker",
    "ai system message creator",
  ],
  openGraph: {
    title: "Structured System Prompt Architect — MegaTools",
    description:
      "Architect hardened, anti-hallucination XML and Markdown system prompts with guardrails and few-shot examples.",
  },
  alternates: {
    canonical: "/prompt-architect",
  },
};

export default function PromptArchitectPage() {
  return <PromptArchitectClient />;
}
