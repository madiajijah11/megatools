import type { Metadata } from "next";
import Base58ConverterClient from "./Base58ConverterClient";

export const metadata: Metadata = {
  title: "Base58, Base32 & Base85 Multi-Converter — MegaTools",
  description:
    "Encode and decode text and hex strings using Base58 (Bitcoin / IPFS), Base32 (RFC 4648), and Ascii85 / Z85 algorithms in your browser.",
  alternates: {
    canonical: "/base58-converter",
  },
  openGraph: {
    title: "Base58, Base32 & Base85 Multi-Converter — MegaTools",
    description: "Convert text and binary between Base58, Base32, and Base85 formats client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Base58, Base32 & Base85 Multi-Converter",
  url: "https://megatools-tau.vercel.app/base58-converter",
  description: "Encode and decode text and hex strings using Base58 (Bitcoin / IPFS), Base32 (RFC 4648), and Z85 algorithms.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function Base58Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Base58ConverterClient />
    </>
  );
}
