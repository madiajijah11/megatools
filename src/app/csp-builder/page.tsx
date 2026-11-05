import type { Metadata } from "next";
import CspBuilderClient from "./CspBuilderClient";

export const metadata: Metadata = {
  title: "Content Security Policy (CSP) Builder & Analyzer — MegaTools",
  description:
    "Build, test, and analyze hardened Content Security Policy (CSP) headers with strict nonces, SHA-256 hashes, and security risk auditing.",
  keywords: [
    "csp builder",
    "content security policy generator",
    "strict csp generator",
    "csp evaluator",
    "nonce generator csp",
    "nginx csp config",
    "nextjs csp header",
    "xss defense builder"
  ],
  alternates: {
    canonical: "/csp-builder",
  },
  openGraph: {
    title: "Content Security Policy (CSP) Builder & Analyzer — MegaTools",
    description:
      "Generate hardened Content-Security-Policy headers for Nginx, Vercel, and Next.js with zero server leakage.",
    url: "https://megatools-tau.vercel.app/csp-builder",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Content Security Policy (CSP) Builder & Analyzer",
  url: "https://megatools-tau.vercel.app/csp-builder",
  description: "Construct, analyze, and test hardened Content Security Policy (CSP) headers with cryptographic nonces and security audit.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function CspBuilderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CspBuilderClient />
    </>
  );
}
