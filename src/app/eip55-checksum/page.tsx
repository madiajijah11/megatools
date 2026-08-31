import type { Metadata } from "next";
import Eip55ChecksumClient from "./Eip55ChecksumClient";

export const metadata: Metadata = {
  title: "EIP-55 Ethereum Address Checksum & Validator — MegaTools",
  description:
    "Verify and encode EVM addresses to official EIP-55 mixed-case checksum format using Keccak-256. Prevent costly transaction loss 100% in your browser.",
  openGraph: {
    title: "EIP-55 Address Checksum & Validator",
    description: "Instant in-browser Ethereum & EVM address checksum encoder and format inspector.",
  },
};

export default function Eip55ChecksumPage() {
  return <Eip55ChecksumClient />;
}
