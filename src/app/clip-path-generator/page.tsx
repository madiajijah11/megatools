import type { Metadata } from "next";
import ClipPathGeneratorClient from "./ClipPathGeneratorClient";

export const metadata: Metadata = {
  title: "CSS Clip-Path & Polygon Shape Generator — MegaTools",
  description:
    "Interactive visual drag-and-drop CSS clip-path polygon generator with presets for triangle, chevron, hexagon, star, trapezoid, and custom shapes.",
  alternates: {
    canonical: "/clip-path-generator",
  },
  openGraph: {
    title: "CSS Clip-Path & Polygon Shape Generator — MegaTools",
    description: "Generate modern CSS clip-path polygon shapes with real-time visual canvas.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CSS Clip-Path & Polygon Shape Generator",
  url: "https://megatools-tau.vercel.app/clip-path-generator",
  description: "Interactive visual drag-and-drop CSS clip-path polygon generator with presets for hexagons, stars, and chevrons.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ClipPathPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ClipPathGeneratorClient />
    </>
  );
}
