import type { Metadata } from "next";
import PromptFuzzerClient from "./PromptFuzzerClient";

export const metadata: Metadata = {
  title: "Prompt Injection & LLM Guardrail Fuzzer — MegaTools",
  description:
    "Test AI system prompts against real-world prompt injections, DAN jailbreaks, delimiter hijacking, multi-lingual smurfing, and indirect RAG attacks. 1-click prompt fortifier.",
  keywords: [
    "prompt injection fuzzer",
    "prompt injection tester",
    "llm guardrail tester",
    "jailbreak fuzzer",
    "dan jailbreak test",
    "test system prompt security",
    "prompt leak prevention",
    "harden system prompt",
    "owasp llm top 10 tester",
    "indirect prompt injection test",
    "ai red teaming online",
  ],
  alternates: {
    canonical: "/prompt-fuzzer",
  },
  openGraph: {
    title: "Prompt Injection & LLM Guardrail Fuzzer — MegaTools",
    description:
      "Audit and stress-test your AI system prompts against prompt injections, DAN jailbreaks, delimiter bypasses, and data exfiltration. Generate 1-click fortified prompts.",
    url: "https://megatools-tau.vercel.app/prompt-fuzzer",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Prompt Injection & LLM Guardrail Fuzzer",
  url: "https://megatools-tau.vercel.app/prompt-fuzzer",
  description:
    "Free client-side security scanner and fuzzer for LLM system prompts. Audit resilience against prompt injection, jailbreaks, data leaks, and automatically generate hardened guardrail prompts.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function PromptFuzzerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PromptFuzzerClient />
    </>
  );
}
