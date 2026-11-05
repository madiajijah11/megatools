import type { Metadata } from "next";
import SolanaConverterClient from "./SolanaConverterClient";

export const metadata: Metadata = {
  title: "Solana SOL & Lamports Converter + Address Inspector — MegaTools",
  description:
    "Convert between SOL and Lamports, calculate account rent exemption fees, and inspect Base58 Ed25519 public keys 100% in your browser.",
  alternates: {
    canonical: "/solana-converter",
  },
  openGraph: {
    title: "Solana SOL / Lamports Converter & Address Inspector",
    description: "Instant in-browser Solana unit converter, rent fee calculator, and public key decoder.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Solana SOL / Lamports Converter & Inspector",
  url: "https://megatools-tau.vercel.app/solana-converter",
  description: "Convert between SOL and Lamports ($10^9$), calculate account rent fees, and decode Ed25519 public keys.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function SolanaConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SolanaConverterClient />
    </>
  );
}
