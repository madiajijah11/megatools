import type { Metadata } from "next";
import ImageToPdfClient from "./ImageToPdfClient";

export const metadata: Metadata = {
  title: "Image to PDF — MegaTools",
  description:
    "Convert PNG, JPG, and WebP images into a multi-page PDF document. 100% private in-browser tool.",
  alternates: {
    canonical: "/image-to-pdf",
  },
  openGraph: {
    title: "Image to PDF — MegaTools",
    description: "Free in-browser image to PDF converter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image to PDF",
  url: "https://megatools-tau.vercel.app/image-to-pdf",
  description: "Convert photos and images (PNG, JPG, WebP) into a multi-page PDF document.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ImageToPdfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImageToPdfClient />
    </>
  );
}
