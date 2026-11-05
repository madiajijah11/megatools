import type { Metadata } from "next";
import JsonlAnalyzerClient from "./JsonlAnalyzerClient";

export const metadata: Metadata = {
  title: "JSONL Analyzer & Schema Inspector — MegaTools",
  description: "Free client-side jsonl analyzer & schema inspector tool with zero data leakage.",
  keywords: ["jsonl-analyzer", "jsonl analyzer & schema inspector", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/jsonl-analyzer",
  },
  openGraph: {
    title: "JSONL Analyzer & Schema Inspector — MegaTools",
    description: "Free client-side jsonl analyzer & schema inspector tool.",
    url: "https://megatools-tau.vercel.app/jsonl-analyzer",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JSONL Analyzer & Schema Inspector",
  url: "https://megatools-tau.vercel.app/jsonl-analyzer",
  description: "Inspect JSON Lines validity, field coverage, and clean valid output in-browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function JsonlAnalyzerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonlAnalyzerClient />
    </>
  );
}
