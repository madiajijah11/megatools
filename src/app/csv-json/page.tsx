import type { Metadata } from "next";
import CsvJsonClient from "./CsvJsonClient";

export const metadata: Metadata = {
  title: "CSV ↔ JSON Converter — MegaTools",
  description:
    "Convert CSV to JSON and JSON to CSV in your browser with auto-delimiter detection. 100% private.",
  alternates: {
    canonical: "/csv-json",
  },
  openGraph: {
    title: "CSV ↔ JSON Converter — MegaTools",
    description: "Free in-browser bidirectional CSV to JSON converter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CSV ↔ JSON Converter",
  url: "https://megatools-tau.vercel.app/csv-json",
  description: "Bidirectional converter between CSV tables and JSON arrays with auto-delimiter detection.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function CsvJsonPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CsvJsonClient />
    </>
  );
}
