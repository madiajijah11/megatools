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


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Structured System Prompt Architect",
  url: "https://megatools-tau.vercel.app/prompt-architect",
  description: "Engineer production-grade, anti-hallucination XML/Markdown system prompts with role constraints and few-shot examples.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PromptArchitectPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PromptArchitectClient />
    </>
  );
}
