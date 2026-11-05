import type { Metadata } from "next";
import KeccakCalculatorClient from "./KeccakCalculatorClient";

export const metadata: Metadata = {
  title: "Keccak-256 Hasher & 4-Byte Solidity Selector — MegaTools",
  description:
    "Calculate Ethereum standard Keccak-256 cryptographic hashes and smart contract 4-byte function selectors / event topics 100% in your browser.",
  alternates: {
    canonical: "/keccak-calculator",
  },
  openGraph: {
    title: "Keccak-256 & 4-Byte Solidity Selector Calculator",
    description: "Instant in-browser Keccak-256 hasher and Solidity ABI function selector tool.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Keccak-256 & 4-Byte Selector Calculator",
  url: "https://megatools-tau.vercel.app/keccak-calculator",
  description: "Calculate Ethereum Keccak-256 hashes, Solidity 4-byte function selectors, and EVM event topics.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function KeccakCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KeccakCalculatorClient />
    </>
  );
}
