import type { Metadata } from "next";
import OpenapiToTsClient from "./OpenapiToTsClient";

export const metadata: Metadata = {
  title: "OpenAPI to TypeScript & Zod — MegaTools",
  description: "Free client-side openapi to typescript & zod tool with zero data leakage.",
  keywords: ["openapi-to-ts", "openapi to typescript & zod", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/openapi-to-ts",
  },
  openGraph: {
    title: "OpenAPI to TypeScript & Zod — MegaTools",
    description: "Free client-side openapi to typescript & zod tool.",
    url: "https://megatools-tau.vercel.app/openapi-to-ts",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OpenAPI to TypeScript & Zod",
  url: "https://megatools-tau.vercel.app/openapi-to-ts",
  description: "Generate TypeScript interfaces or Zod schemas from OpenAPI component definitions entirely in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function OpenapiToTsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OpenapiToTsClient />
    </>
  );
}
