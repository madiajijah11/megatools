import type { Metadata } from "next";
import EvmCalldataDecoderClient from "./EvmCalldataDecoderClient";

export const metadata: Metadata = {
  title: "EVM Calldata Decoder & ABI Inspector — MegaTools",
  description: "Decode raw Ethereum transaction calldata into human-readable parameters and 32-byte word slices. Identify 4-byte selectors and parse addresses 100% in your browser.",
  keywords: [
    "evm-calldata-decoder",
    "ethereum calldata decoder",
    "abi decoder online",
    "4byte selector lookup",
    "decode raw transaction hex",
    "smart contract calldata",
    "web3 developer tool",
    "megatools"
  ],
  alternates: {
    canonical: "/evm-calldata-decoder",
  },
  openGraph: {
    title: "EVM Calldata Decoder & ABI Inspector — MegaTools",
    description: "Decode and inspect Ethereum smart contract transaction calldata offline with zero RPC leaks.",
    url: "https://megatools-tau.vercel.app/evm-calldata-decoder",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "EVM Calldata Decoder & ABI Inspector",
  url: "https://megatools-tau.vercel.app/evm-calldata-decoder",
  description: "Decode raw Ethereum & EVM transaction calldata hex into human-readable parameters and 32-byte word slices.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function EvmCalldataDecoderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EvmCalldataDecoderClient />
    </>
  );
}
