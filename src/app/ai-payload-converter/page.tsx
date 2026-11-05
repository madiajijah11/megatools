import type { Metadata } from "next";
import AiPayloadConverterClient from "./AiPayloadConverterClient";

export const metadata: Metadata = {
  title: "Universal AI Payload & Multi-Provider SDK Exporter — MegaTools",
  description:
    "Convert prompt and parameters into official JSON payloads and SDK code for OpenAI, Anthropic Claude, Google Gemini, DeepSeek, and Ollama 100% in your browser.",
  alternates: {
    canonical: "/ai-payload-converter",
  },
  openGraph: {
    title: "Universal AI Payload & SDK Exporter",
    description: "Instant in-browser multi-provider AI prompt to API payload & SDK code generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Universal AI Payload & SDK Exporter",
  url: "https://megatools-tau.vercel.app/ai-payload-converter",
  description: "Convert system prompts and parameters into official JSON payloads for OpenAI, Claude, Gemini, and Ollama.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function AiPayloadConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AiPayloadConverterClient />
    </>
  );
}
