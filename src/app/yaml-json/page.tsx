import type { Metadata } from "next";
import YamlJsonClient from "./YamlJsonClient";

export const metadata: Metadata = {
  title: "YAML ↔ JSON Converter — MegaTools",
  description:
    "Convert between YAML and JSON formats with live validation and line-number error reporting in your browser.",
  alternates: {
    canonical: "/yaml-json",
  },
  openGraph: {
    title: "YAML ↔ JSON Converter — MegaTools",
    description: "Free in-browser bidirectional YAML to JSON converter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "YAML ↔ JSON Converter",
  url: "https://megatools-tau.vercel.app/yaml-json",
  description: "Convert between YAML and JSON formats with live validation and line-number error reporting.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function YamlJsonPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <YamlJsonClient />
    </>
  );
}
