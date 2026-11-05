import type { Metadata } from "next";
import ImageConverterClient from "./ImageConverterClient";

export const metadata: Metadata = {
  title: "Image Converter — MegaTools",
  description:
    "Convert images between PNG, JPG, and WebP formats with quality control in your browser. 100% private.",
  alternates: {
    canonical: "/image-converter",
  },
  openGraph: {
    title: "Image Converter — MegaTools",
    description: "Free in-browser image format converter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Converter",
  url: "https://megatools-tau.vercel.app/image-converter",
  description: "Convert image files between PNG, JPG, and WebP formats with quality control.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ImageConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImageConverterClient />
    </>
  );
}
