import type { Metadata } from "next";
import SriHashGeneratorClient from "./SriHashGeneratorClient";

export const metadata: Metadata = {
  title: "Subresource Integrity (SRI) Hash Generator — MegaTools",
  description:
    "Generate W3C Subresource Integrity (SRI) hashes (sha256, sha384, sha512) for CDN scripts and stylesheets with HTML tag generator.",
  alternates: {
    canonical: "/sri-hash-generator",
  },
  openGraph: {
    title: "Subresource Integrity (SRI) Hash Generator — MegaTools",
    description: "Generate secure SRI hashes and HTML <script> / <link> tags client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Subresource Integrity (SRI) Hash Generator",
  url: "https://megatools-tau.vercel.app/sri-hash-generator",
  description: "Generate W3C Subresource Integrity (SRI) hashes (SHA-384, SHA-256, SHA-512) for CDN scripts and styles.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function SriHashPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SriHashGeneratorClient />
    </>
  );
}
