import type { Metadata } from "next";
import CssGeneratorClient from "./CssGeneratorClient";

export const metadata: Metadata = {
  title: "CSS Glassmorphism & Shadow Generator — MegaTools",
  description:
    "Generate modern CSS Glassmorphism, Box Shadows, Gradients, and Border Radius with interactive live preview.",
  alternates: {
    canonical: "/css-generator",
  },
  openGraph: {
    title: "CSS Glassmorphism & Shadow Generator — MegaTools",
    description: "Free in-browser CSS and Tailwind style generator with interactive preview.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CSS Glassmorphism & Shadow Generator",
  url: "https://megatools-tau.vercel.app/css-generator",
  description: "Interactive visual generator for modern CSS Glassmorphism, Box Shadows / Glow, and Gradients.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function CssGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CssGeneratorClient />
    </>
  );
}
