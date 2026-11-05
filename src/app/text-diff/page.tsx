import type { Metadata } from "next";
import DiffClient from "./DiffClient";

export const metadata: Metadata = {
  title: "Text Diff Checker — MegaTools",
  description:
    "Compare two texts and see the differences highlighted line by line. Free, fast, runs in your browser.",
  alternates: {
    canonical: "/text-diff",
  },
  openGraph: {
    title: "Text Diff Checker — MegaTools",
    description: "Free text diff checker.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Text Diff Checker",
  url: "https://megatools-tau.vercel.app/text-diff",
  description: "Compare two texts and see the differences highlighted line by line.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function TextDiffPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DiffClient />
    </>
  );
}
