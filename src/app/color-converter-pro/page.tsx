import type { Metadata } from "next";
import ColorConverterProClient from "./ColorConverterProClient";

export const metadata: Metadata = {
  title: "Color Converter & Palette Studio — MegaTools",
  description: "Free client-side color converter & palette studio tool with zero data leakage.",
  keywords: ["color-converter-pro", "color converter & palette studio", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/color-converter-pro",
  },
  openGraph: {
    title: "Color Converter & Palette Studio — MegaTools",
    description: "Free client-side color converter & palette studio tool.",
    url: "https://megatools-tau.vercel.app/color-converter-pro",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Color Converter & Palette Studio",
  url: "https://megatools-tau.vercel.app/color-converter-pro",
  description: "Convert HEX colors to RGB and HSL, preview swatches, and copy CSS values.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ColorConverterProPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ColorConverterProClient />
    </>
  );
}
