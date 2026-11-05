import type { Metadata } from "next";
import PdfMergeClient from "./PdfMergeClient";

export const metadata: Metadata = {
  title: "Merge PDF — MegaTools",
  description:
    "Combine multiple PDF documents into a single file in your browser. 100% private, no server uploads.",
  alternates: {
    canonical: "/pdf-merge",
  },
  openGraph: {
    title: "Merge PDF — MegaTools",
    description: "Free in-browser PDF merge tool. Fast and completely client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Merge PDF",
  url: "https://megatools-tau.vercel.app/pdf-merge",
  description: "Combine multiple PDF documents into a single file in your browser.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PdfMergePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PdfMergeClient />
    </>
  );
}
