import type { Metadata } from "next";
import HarViewerClient from "./HarViewerClient";

export const metadata: Metadata = {
  title: "HAR File Viewer & Network Waterfall Analyzer — MegaTools",
  description:
    "Analyze HTTP Archive (.har) logs with visual waterfall timelines, TTFB metrics, SSL/DNS timings, and request headers client-side.",
  keywords: [
    "har viewer online",
    "http archive analyzer",
    "network waterfall analyzer",
    "ttfb analyzer",
    "har file inspector",
    "dev tools network replay",
    "chrome har viewer private"
  ],
  alternates: {
    canonical: "/har-viewer",
  },
  openGraph: {
    title: "HAR File Viewer & Network Waterfall Analyzer — MegaTools",
    description:
      "Inspect network waterfall timelines, TTFB, and request headers from HTTP Archive (.har) files in your browser with zero data leakage.",
    url: "https://megatools-tau.vercel.app/har-viewer",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HAR File Viewer & Network Waterfall Analyzer",
  url: "https://megatools-tau.vercel.app/har-viewer",
  description: "Inspect HTTP Archive (.har) logs with visual waterfall timelines, TTFB metrics, SSL/DNS timings, and request headers.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function HarViewerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HarViewerClient />
    </>
  );
}
