import type { Metadata } from "next";
import SolanaConverterClient from "./SolanaConverterClient";

export const metadata: Metadata = {
  title: "Solana SOL & Lamports Converter + Address Inspector — MegaTools",
  description:
    "Convert between SOL and Lamports, calculate account rent exemption fees, and inspect Base58 Ed25519 public keys 100% in your browser.",
  openGraph: {
    title: "Solana SOL / Lamports Converter & Address Inspector",
    description: "Instant in-browser Solana unit converter, rent fee calculator, and public key decoder.",
  },
};

export default function SolanaConverterPage() {
  return <SolanaConverterClient />;
}
