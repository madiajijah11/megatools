import type { Metadata } from "next";
import ColorExtractorClient from "./ColorExtractorClient";

export const metadata: Metadata = {
  title: "Image Color Palette Extractor — MegaTools",
  description:
    "Extract dominant colors and generate color palettes (HEX, RGB, HSL, CSS Variables) from any image client-side.",
  alternates: {
    canonical: "/color-extractor",
  },
  openGraph: {
    title: "Image Color Palette Extractor — MegaTools",
    description: "Free in-browser dominant color palette extractor.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Color Palette Extractor",
  url: "https://megatools-tau.vercel.app/color-extractor",
  description: "Extract dominant color palettes, HEX/RGB/HSL values, and CSS theme variables from any image.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ColorExtractorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ColorExtractorClient />
    </>
  );
}
