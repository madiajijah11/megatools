import type { Metadata } from "next";
import KeccakCalculatorClient from "./KeccakCalculatorClient";

export const metadata: Metadata = {
  title: "Keccak-256 Hasher & 4-Byte Solidity Selector — MegaTools",
  description:
    "Calculate Ethereum standard Keccak-256 cryptographic hashes and smart contract 4-byte function selectors / event topics 100% in your browser.",
  openGraph: {
    title: "Keccak-256 & 4-Byte Solidity Selector Calculator",
    description: "Instant in-browser Keccak-256 hasher and Solidity ABI function selector tool.",
  },
};

export default function KeccakCalculatorPage() {
  return <KeccakCalculatorClient />;
}
