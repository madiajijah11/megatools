import type { Metadata } from "next";
import JsonRepairClient from "./JsonRepairClient";

export const metadata: Metadata = {
  title: "LLM JSON Repair & Auto-Fixer — MegaTools",
  description: "Automatically repair broken, truncated, and malformed JSON from LLM outputs. Fix single quotes, unquoted keys, trailing commas, and unclosed brackets 100% in your browser.",
  keywords: [
    "json-repair",
    "fix llm json",
    "repair json online",
    "json auto fix",
    "trailing comma remover",
    "unquoted json keys",
    "llm json cleaner",
    "developer tool",
    "megatools"
  ],
  alternates: {
    canonical: "/json-repair",
  },
  openGraph: {
    title: "LLM JSON Repair & Auto-Fixer — MegaTools",
    description: "Fix malformed and truncated JSON output from AI models in your browser with zero data leakage.",
    url: "https://megatools-tau.vercel.app/json-repair",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LLM JSON Repair & Auto-Fixer",
  url: "https://megatools-tau.vercel.app/json-repair",
  description: "Auto-fix broken, truncated, and malformed JSON from AI prompts. Fixes quotes, trailing commas, and brackets in-browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function JsonRepairPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonRepairClient />
    </>
  );
}
