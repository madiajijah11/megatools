import type { Metadata } from "next";
import SvgConverterClient from "./SvgConverterClient";

export const metadata: Metadata = {
  title: "SVG to PNG / JPG / WebP Converter — MegaTools",
  description:
    "Convert and upscale SVG files and code to PNG, JPG, and WebP at 1x, 2x, 4x resolutions directly in your browser.",
  alternates: {
    canonical: "/svg-converter",
  },
  openGraph: {
    title: "SVG to PNG / JPG / WebP Converter — MegaTools",
    description: "Free in-browser SVG rasterizer and upscaler.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SVG to PNG / JPG / WebP Converter",
  url: "https://megatools-tau.vercel.app/svg-converter",
  description: "Convert and upscale SVG vector files to PNG, JPG, and WebP at 1x, 2x, 4x resolutions.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function SvgConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SvgConverterClient />
    </>
  );
}
