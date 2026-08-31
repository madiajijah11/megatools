import type { Metadata } from "next";
import Base58ConverterClient from "./Base58ConverterClient";

export const metadata: Metadata = {
  title: "Base58, Base32 & Base85 Multi-Converter — MegaTools",
  description:
    "Encode and decode text and hex strings using Base58 (Bitcoin / IPFS), Base32 (RFC 4648), and Ascii85 / Z85 algorithms in your browser.",
  openGraph: {
    title: "Base58, Base32 & Base85 Multi-Converter — MegaTools",
    description: "Convert text and binary between Base58, Base32, and Base85 formats client-side.",
  },
};

export default function Base58Page() {
  return <Base58ConverterClient />;
}
