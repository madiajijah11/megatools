import type { Metadata } from "next";
import UUIDClient from "./UUIDClient";

export const metadata: Metadata = {
  title: "UUID Generator — MegaTools",
  description:
    "Generate UUID v4 identifiers instantly. Single or bulk generation. One click to copy.",
  alternates: {
    canonical: "/uuid-generator",
  },
  openGraph: {
    title: "UUID Generator — MegaTools",
    description: "Free UUID v4 generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UUID Generator",
  url: "https://megatools-tau.vercel.app/uuid-generator",
  description: "Generate UUID v4 identifiers instantly. One click to copy.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function UUIDGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UUIDClient />
    </>
  );
}
