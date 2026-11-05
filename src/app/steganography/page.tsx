import type { Metadata } from "next";
import SteganographyClient from "./SteganographyClient";

export const metadata: Metadata = {
  title: "Image Steganography — MegaTools",
  description:
    "Hide secret messages inside image pixels (LSB encoding) or decode hidden text in your browser. 100% private.",
  alternates: {
    canonical: "/steganography",
  },
  openGraph: {
    title: "Image Steganography — MegaTools",
    description: "Free in-browser image steganography tool (LSB hide & extract).",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Image Steganography",
  url: "https://megatools-tau.vercel.app/steganography",
  description: "Hide secret encrypted text inside image pixels using LSB encoding, or extract it.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function SteganographyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SteganographyClient />
    </>
  );
}
