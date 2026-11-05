import type { Metadata } from "next";
import Bip39GeneratorClient from "./Bip39GeneratorClient";

export const metadata: Metadata = {
  title: "BIP-39 Mnemonic Seed Phrase Studio — MegaTools",
  description:
    "Generate, validate, and inspect BIP-39 recovery seed phrases (12/24 words) with CSPRNG entropy, checksum verification, and PBKDF2 seed derivation 100% in your browser.",
  keywords: [
    "bip39 generator",
    "mnemonic seed phrase",
    "12 word seed phrase generator",
    "24 word seed phrase generator",
    "bip39 checksum validator",
    "pbkdf2 seed derivation",
    "crypto wallet recovery phrase",
    "offline seed phrase generator",
  ],
  openGraph: {
    title: "BIP-39 Mnemonic Seed Phrase Studio — MegaTools",
    description:
      "Airgapped BIP-39 mnemonic generator, checksum validator, and PBKDF2 512-bit seed derivation studio.",
  },
  alternates: {
    canonical: "/bip39-generator",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "BIP-39 Mnemonic Seed Phrase Studio",
  url: "https://megatools-tau.vercel.app/bip39-generator",
  description: "Generate cryptographically secure 12 & 24-word seed phrases, verify checksums, and derive PBKDF2 512-bit binary seeds.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function Bip39GeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Bip39GeneratorClient />
    </>
  );
}
