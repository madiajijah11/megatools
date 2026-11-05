import type { Metadata } from "next";
import JwtDecoderClient from "./JwtDecoderClient";

export const metadata: Metadata = {
  title: "JWT Decoder — MegaTools",
  description:
    "Decode JWT header and payload instantly. Inspect claims and check token expiry (exp) right in your browser.",
  alternates: {
    canonical: "/jwt-decoder",
  },
  openGraph: {
    title: "JWT Decoder — MegaTools",
    description: "Decode JWT header/payload and check expiry in your browser.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JWT Decoder",
  url: "https://megatools-tau.vercel.app/jwt-decoder",
  description: "Decode JWT header and payload, inspect claims, and check expiry — locally.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function JwtDecoderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JwtDecoderClient />
    </>
  );
}
