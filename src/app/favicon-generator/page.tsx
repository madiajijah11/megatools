import type { Metadata } from "next";
import FaviconGeneratorClient from "./FaviconGeneratorClient";

export const metadata: Metadata = {
  title: "Favicon & PWA App Icon Generator (16x16 to 512x512) — MegaTools",
  description:
    "Generate complete website favicon packages and PWA icons (16, 32, 48, 180, 192, 512px) in your browser. Preview on browser tabs and download instantly.",
  keywords: [
    "favicon generator",
    "pwa icon generator",
    "website favicon size",
    "apple touch icon generator",
    "ico converter",
    "favicon package generator",
    "megatools"
  ],
  alternates: {
    canonical: "/favicon-generator",
  },
  openGraph: {
    title: "Favicon & PWA Icon Generator — MegaTools",
    description: "Free in-browser favicon and web app icon generator with multi-size export.",
    url: "https://megatools-tau.vercel.app/favicon-generator",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Favicon & App Icon Generator",
  url: "https://megatools-tau.vercel.app/favicon-generator",
  description: "Generate multi-size favicons and progressive web app icons client-side.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function FaviconGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FaviconGeneratorClient />
    </>
  );
}
