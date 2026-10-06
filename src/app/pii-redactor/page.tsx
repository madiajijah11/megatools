import type { Metadata } from "next";
import PiiRedactorClient from "./PiiRedactorClient";

export const metadata: Metadata = {
  title: "AI Prompt PII Redactor & Secret Masker — MegaTools",
  description:
    "Anonymize sensitive PII (Indonesian NIK, NPWP, credit cards, emails, phones) and developer secrets (API keys, passwords, DB URIs, JWTs) before sending prompts to ChatGPT or Claude. 100% private with reversible de-anonymization.",
  keywords: [
    "pii redactor",
    "prompt privacy redactor",
    "mask secrets before chatgpt",
    "anonymize llm prompt",
    "redact nik ktp online",
    "redact credit card luhn",
    "redact api keys prompt",
    "de-anonymize ai response",
    "client-side pii scrubber",
    "chatgpt privacy tool",
    "claude prompt cleaner",
  ],
  alternates: {
    canonical: "/pii-redactor",
  },
  openGraph: {
    title: "AI Prompt PII Redactor & Secret Masker — MegaTools",
    description:
      "Detect and mask confidential PII, API tokens, and credentials in prompts before feeding them to AI models. Reversibly unmask AI responses locally in your browser.",
    url: "https://megatools-tau.vercel.app/pii-redactor",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AI Prompt PII Redactor & Secret Masker",
  url: "https://megatools-tau.vercel.app/pii-redactor",
  description:
    "100% client-side privacy tool to scrub confidential personal data, Indonesian NIK/NPWP, credit cards, and API secrets from LLM prompts with reversible de-anonymizer support.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function PiiRedactorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PiiRedactorClient />
    </>
  );
}
