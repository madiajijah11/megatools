import type { Metadata } from "next";
import ColorContrastClient from "./ColorContrastClient";

export const metadata: Metadata = {
  title: "Color Contrast & Palette Checker — MegaTools",
  description:
    "WCAG 2.1 accessibility contrast ratio checker (AA/AAA compliance) with HEX, RGB, and HSL conversions.",
  alternates: {
    canonical: "/color-contrast",
  },
  openGraph: {
    title: "Color Contrast Checker — MegaTools",
    description: "Free in-browser WCAG 2.1 color contrast and accessibility tester.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Color Contrast & Palette",
  url: "https://megatools-tau.vercel.app/color-contrast",
  description: "WCAG 2.1 contrast ratio checker (AA/AAA compliance) with instant HEX, RGB, HSL, and OKLCH conversions.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ColorContrastPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ColorContrastClient />
    </>
  );
}
