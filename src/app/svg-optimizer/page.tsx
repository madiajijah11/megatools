import type { Metadata } from "next";
import SvgOptimizerClient from "./SvgOptimizerClient";

export const metadata: Metadata = {
  title: "SVG Optimizer & Cleaner — MegaTools",
  description:
    "Clean, minify, and strip bloat from SVG vector files in your browser. Remove editor metadata and reduce file size.",
  alternates: {
    canonical: "/svg-optimizer",
  },
  openGraph: {
    title: "SVG Optimizer — MegaTools",
    description: "Free in-browser SVG vector cleaner and optimizer.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SVG Optimizer & Cleaner",
  url: "https://megatools-tau.vercel.app/svg-optimizer",
  description: "Clean and minify SVG vector files by stripping editor metadata, comments, and unused attributes.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function SvgOptimizerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SvgOptimizerClient />
    </>
  );
}
