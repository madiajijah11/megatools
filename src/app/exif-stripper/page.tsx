import type { Metadata } from "next";
import ExifStripperClient from "./ExifStripperClient";

export const metadata: Metadata = {
  title: "EXIF & Metadata Stripper — MegaTools",
  description:
    "Strip GPS coordinates, device info, and private metadata from photos before sharing online. 100% private in-browser tool.",
  alternates: {
    canonical: "/exif-stripper",
  },
  openGraph: {
    title: "EXIF Stripper — MegaTools",
    description: "Free in-browser photo metadata and GPS stripper.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "EXIF & Metadata Stripper",
  url: "https://megatools-tau.vercel.app/exif-stripper",
  description: "Remove GPS coordinates, camera models, and private metadata from photos.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ExifStripperPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ExifStripperClient />
    </>
  );
}
