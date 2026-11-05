import type { Metadata } from "next";
import OgPreviewerClient from "./OgPreviewerClient";

export const metadata: Metadata = {
  title: "OpenGraph & Social Meta Tag Previewer — MegaTools",
  description:
    "Preview social share cards for Google, Twitter/X, Discord, Facebook, and generate HTML & Next.js metadata tags.",
  alternates: {
    canonical: "/og-previewer",
  },
  openGraph: {
    title: "OpenGraph & Social Meta Tag Previewer — MegaTools",
    description: "Free in-browser OpenGraph card previewer and meta tag generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OpenGraph & Social Meta Tag Previewer",
  url: "https://megatools-tau.vercel.app/og-previewer",
  description: "Preview social share cards for Google, Twitter/X, Discord, Facebook, and generate HTML & Next.js metadata tags.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function OgPreviewerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OgPreviewerClient />
    </>
  );
}
