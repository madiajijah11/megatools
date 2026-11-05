import type { Metadata } from "next";
import Base64Client from "./Base64Client";

export const metadata: Metadata = {
  title: "Base64 Encode/Decode — MegaTools",
  description:
    "Encode text to Base64 or decode Base64 back to readable text. Free, instant, runs in your browser.",
  alternates: {
    canonical: "/base64",
  },
  openGraph: {
    title: "Base64 Encode/Decode — MegaTools",
    description: "Free Base64 encoder and decoder.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Base64 Encode/Decode",
  url: "https://megatools-tau.vercel.app/base64",
  description: "Encode text to Base64 or decode Base64 back to readable text.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function Base64Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Base64Client />
    </>
  );
}
