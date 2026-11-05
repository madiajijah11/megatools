import type { Metadata } from "next";
import PdfSplitClient from "./PdfSplitClient";

export const metadata: Metadata = {
  title: "Split PDF — MegaTools",
  description:
    "Extract specific pages or page ranges from a PDF document in your browser. 100% private.",
  alternates: {
    canonical: "/pdf-split",
  },
  openGraph: {
    title: "Split PDF — MegaTools",
    description: "Free in-browser PDF page extractor and splitter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Split PDF",
  url: "https://megatools-tau.vercel.app/pdf-split",
  description: "Extract specific pages or page ranges from a PDF document.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PdfSplitPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PdfSplitClient />
    </>
  );
}
