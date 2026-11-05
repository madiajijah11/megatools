import type { Metadata } from "next";
import HashClient from "./HashClient";

export const metadata: Metadata = {
  title: "Hash Generator — MegaTools",
  description:
    "Compute SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text instantly. Runs entirely in your browser.",
  alternates: {
    canonical: "/hash-generator",
  },
  openGraph: {
    title: "Hash Generator — MegaTools",
    description: "Free browser-side SHA hash generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Hash Generator",
  url: "https://megatools-tau.vercel.app/hash-generator",
  description: "Compute SHA-1, SHA-256, SHA-384, SHA-512 hashes from text instantly.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function HashGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HashClient />
    </>
  );
}
