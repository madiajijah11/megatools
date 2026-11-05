import type { Metadata } from "next";
import JsonSchemaGeneratorClient from "./JsonSchemaGeneratorClient";

export const metadata: Metadata = {
  title: "JSON to JSON Schema Generator — MegaTools",
  description:
    "Instantly generate Draft-07 and 2020-12 JSON Schema validation schemas from JSON sample data directly in your browser.",
  alternates: {
    canonical: "/json-schema-generator",
  },
  openGraph: {
    title: "JSON to JSON Schema Generator — MegaTools",
    description: "Generate standard JSON Schema validation structures client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JSON to JSON Schema Generator",
  url: "https://megatools-tau.vercel.app/json-schema-generator",
  description: "Instantly generate Draft-07 and 2020-12 JSON Schema validation schemas from JSON sample data.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function JsonSchemaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonSchemaGeneratorClient />
    </>
  );
}
