import type { Metadata } from "next";
import BinaryConverterClient from "./BinaryConverterClient";

export const metadata: Metadata = {
  title: "Binary & Base Converter — MegaTools",
  description:
    "Convert text and bytes between Binary, Hex, Base58 (Bitcoin/Solana), Base32, and Decimal representations in your browser.",
  openGraph: {
    title: "Binary & Base Converter — MegaTools",
    description: "Free in-browser Binary, Hex, Base58, and Base32 converter.",
  },
};

export default function BinaryConverterPage() {
  return <BinaryConverterClient />;
}
