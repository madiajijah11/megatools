import type { Metadata } from "next";
import JsonToTsClient from "./JsonToTsClient";

export const metadata: Metadata = {
  title: "JSON to TypeScript & Zod Schema — MegaTools",
  description:
    "Convert JSON into TypeScript interfaces, types, and Zod validation schemas instantly in your browser.",
  alternates: {
    canonical: "/json-to-ts",
  },
  openGraph: {
    title: "JSON to TypeScript & Zod Schema — MegaTools",
    description: "Free in-browser JSON to TypeScript interface and Zod schema generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JSON to TypeScript & Zod Schema",
  url: "https://megatools-tau.vercel.app/json-to-ts",
  description: "Convert JSON objects into TypeScript interfaces, types, and Zod validation schemas instantly.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function JsonToTsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonToTsClient />
    </>
  );
}
