import type { Metadata } from "next";
import HmacGeneratorClient from "./HmacGeneratorClient";

export const metadata: Metadata = {
  title: "HMAC Hash & Webhook Signature Generator — MegaTools",
  description:
    "Generate and verify HMAC (SHA-256, SHA-512, SHA-384, SHA-1) signatures client-side using native Web Crypto API.",
  alternates: {
    canonical: "/hmac-generator",
  },
  openGraph: {
    title: "HMAC Hash & Signature Generator — MegaTools",
    description: "Free in-browser HMAC generator and webhook signature verifier.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HMAC Hash & Signature Generator",
  url: "https://megatools-tau.vercel.app/hmac-generator",
  description: "Compute keyed-hash message authentication codes (HMAC) client-side for API auth & webhook verification.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function HmacGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HmacGeneratorClient />
    </>
  );
}
