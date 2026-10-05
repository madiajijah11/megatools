import type { Metadata } from "next";
import HarSanitizerClient from "./HarSanitizerClient";

export const metadata: Metadata = {
  title: "HAR File Sanitizer & Credential Stripper — MegaTools",
  description:
    "Scrub sensitive cookies, bearer tokens, passwords, API keys, and authorization headers from HTTP Archive (.har) files client-side. 100% private.",
  keywords: [
    "har sanitizer",
    "har file anonymizer",
    "sanitize har file online",
    "strip cookies from har",
    "strip authorization header har",
    "redact har file passwords",
    "clean har file for support",
    "http archive scrubber",
    "private har cleaner"
  ],
  alternates: {
    canonical: "/har-sanitizer",
  },
  openGraph: {
    title: "HAR File Sanitizer & Credential Stripper — MegaTools",
    description:
      "Sanitize HTTP Archive (.har) files locally in your browser before sharing with support or vendors. Strip cookies, tokens, and credentials privately.",
    url: "https://megatools-tau.vercel.app/har-sanitizer",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HAR File Sanitizer & Credential Stripper",
  url: "https://megatools-tau.vercel.app/har-sanitizer",
  description:
    "100% client-side privacy tool to scrub sensitive credentials, cookies, and tokens from HTTP Archive (.har) logs before sharing.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HarSanitizerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HarSanitizerClient />
    </>
  );
}
