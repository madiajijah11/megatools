import type { Metadata } from "next";
import AsciiBannerClient from "./AsciiBannerClient";

export const metadata: Metadata = {
  title: "ASCII Art & Terminal Banner Generator (FIGlet & Image Art) — MegaTools",
  description:
    "Generate ASCII text banners and terminal art online. Convert text using FIGlet fonts (Standard, Slant, Doom, Big) and turn images into ASCII art in your browser.",
  keywords: [
    "ascii banner generator",
    "ascii terminal art",
    "ascii text banner generator",
    "banner ascii",
    "figlet online",
    "text to ascii art",
    "image to ascii converter"
  ],
  alternates: {
    canonical: "/ascii-banner",
  },
  openGraph: {
    title: "ASCII Art & Terminal Banner Generator — MegaTools",
    description: "Generate ASCII text banners and terminal art client-side.",
    url: "https://megatools-tau.vercel.app/ascii-banner",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ASCII Art & Banner Generator",
  url: "https://megatools-tau.vercel.app/ascii-banner",
  description: "Convert text and images to ASCII art banners with FIGlet fonts in browser.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function AsciiBannerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AsciiBannerClient />
    </>
  );
}
