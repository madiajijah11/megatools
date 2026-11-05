import type { Metadata } from "next";
import ImageCropperClient from "./ImageCropperClient";

export const metadata: Metadata = {
  title: "Image Cropper & Resizer — MegaTools",
  description: "Free client-side image cropper & resizer tool with zero data leakage.",
  keywords: ["image-cropper", "image cropper & resizer", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/image-cropper",
  },
  openGraph: {
    title: "Image Cropper & Resizer — MegaTools",
    description: "Free client-side image cropper & resizer tool.",
    url: "https://megatools-tau.vercel.app/image-cropper",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Cropper & Resizer",
  url: "https://megatools-tau.vercel.app/image-cropper",
  description: "Resize, rotate, and export images locally using the browser Canvas API.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ImageCropperPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ImageCropperClient />
    </>
  );
}
