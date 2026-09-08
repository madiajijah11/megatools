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

export default function Bip39GeneratorPage() {
  return <Bip39GeneratorClient />;
}
