import type { Metadata } from "next";
import Eip55ChecksumClient from "./Eip55ChecksumClient";

export const metadata: Metadata = {
  title: "EIP-55 Ethereum Address Checksum & Validator — MegaTools",
  description:
    "Verify and encode EVM addresses to official EIP-55 mixed-case checksum format using Keccak-256. Prevent costly transaction loss 100% in your browser.",
  alternates: {
    canonical: "/eip55-checksum",
  },
  openGraph: {
    title: "EIP-55 Address Checksum & Validator",
    description: "Instant in-browser Ethereum & EVM address checksum encoder and format inspector.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "EIP-55 Ethereum Address Checksum & Validator",
  url: "https://megatools-tau.vercel.app/eip55-checksum",
  description: "Verify EVM wallet addresses and encode lowercase strings to official EIP-55 mixed-case checksum format.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function Eip55ChecksumPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Eip55ChecksumClient />
    </>
  );
}
