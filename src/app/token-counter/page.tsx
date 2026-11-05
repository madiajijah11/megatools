import type { Metadata } from "next";
import TokenCounterClient from "./TokenCounterClient";

export const metadata: Metadata = {
  title: "LLM Token Counter & API Cost Estimator — MegaTools",
  description:
    "Count tokens, characters, and estimate API inference costs for GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, DeepSeek V3/R1 with live visual token highlighting.",
  keywords: [
    "token counter",
    "gpt token counter",
    "claude token counter",
    "llm cost estimator",
    "bpe tokenizer",
    "openai pricing calculator",
    "anthropic api cost",
    "deepseek token calculator",
    "cl100k tokenizer online",
    "token highlighter"
  ],
  alternates: {
    canonical: "/token-counter",
  },
  openGraph: {
    title: "LLM Token Counter & API Cost Estimator — MegaTools",
    description:
      "Estimate prompt tokens and real-time API cost across OpenAI, Anthropic, Google, and DeepSeek models with visual subword tokenization.",
    url: "https://megatools-tau.vercel.app/token-counter",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LLM Token Counter & API Cost Estimator",
  url: "https://megatools-tau.vercel.app/token-counter",
  description: "Analyze token density, preview subword BPE boundaries, and calculate real-time API inference costs across OpenAI, Claude, Gemini, and DeepSeek.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function TokenCounterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TokenCounterClient />
    </>
  );
}
