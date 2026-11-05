import type { Metadata } from "next";
import AiModelComparatorClient from "./AiModelComparatorClient";

export const metadata: Metadata = {
  title: "AI Model Pricing & Context Window Matrix — MegaTools",
  description:
    "Compare pricing, context limits, and token costs for 25+ LLM models (DeepSeek, Claude 3.7, GPT-4o, Gemini 2.0, Llama 3.3) with models.dev sync support.",
  alternates: {
    canonical: "/ai-model-comparator",
  },
  openGraph: {
    title: "AI Model Pricing & Context Matrix",
    description: "Instant in-browser LLM pricing comparison matrix, context window analyzer, and token cost calculator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Model Pricing & Context Matrix",
  url: "https://megatools-tau.vercel.app/ai-model-comparator",
  description: "Real-time cost calculator and specs matrix for 25+ LLM models with models.dev live sync support.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function AiModelComparatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AiModelComparatorClient />
    </>
  );
}
