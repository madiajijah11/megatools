import type { Metadata } from "next";
import UrlEncoderClient from "./UrlEncoderClient";

export const metadata: Metadata = {
  title: "URL Encoder/Decoder — MegaTools",
  description:
    "Encode text for URLs or decode percent-encoded strings back to readable text. Free, instant, runs in your browser.",
  alternates: {
    canonical: "/url-encoder",
  },
  openGraph: {
    title: "URL Encoder/Decoder — MegaTools",
    description: "Free URL encoder and decoder.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "URL Encoder/Decoder",
  url: "https://megatools-tau.vercel.app/url-encoder",
  description: "Encode or decode URLs and query parameters safely. Component or full URI mode.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function UrlEncoderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UrlEncoderClient />
    </>
  );
}
