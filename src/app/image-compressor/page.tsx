import type { Metadata } from "next";
import ImageClient from "./ImageClient";

export const metadata: Metadata = {
  title: "Image Compressor — MegaTools",
  description:
    "Compress images in your browser. Drag and drop, adjust quality, download instantly. Nothing is uploaded.",
  alternates: {
    canonical: "/image-compressor",
  },
  openGraph: {
    title: "Image Compressor — MegaTools",
    description: "Free browser-based image compressor.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Compressor",
  url: "https://megatools-tau.vercel.app/image-compressor",
  description: "Compress images right in your browser. No uploads, no servers.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ImageCompressorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImageClient />
    </>
  );
}
