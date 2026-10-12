import type { Metadata } from "next";
import PermitAnalyzerClient from "./PermitAnalyzerClient";

export const metadata: Metadata = {
  title: "EIP-712 Permit & Phishing Signature Deconstructor — MegaTools",
  description:
    "Deconstruct EIP-712 typed data messages, decode Permit & Permit2 signatures, detect infinite allowance wallet drainer scams, and verify secp256k1 signers 100% client-side.",
  keywords: [
    "eip-712 permit analyzer",
    "phishing signature deconstructor",
    "wallet drainer detector",
    "erc-2612 permit decoder",
    "uniswap permit2 analyzer",
    "seaport order phishing",
    "secp256k1 signer recovery",
    "eth_signTypedData_v4",
    "eip712 digest calculator",
    "web3 security tools",
  ],
  alternates: {
    canonical: "https://megatools.net/permit-analyzer",
  },
  openGraph: {
    title: "EIP-712 Permit & Phishing Signature Deconstructor — MegaTools",
    description:
      "Deconstruct EIP-712 typed data messages, decode Permit & Permit2 signatures, detect infinite allowance wallet drainer scams, and verify secp256k1 signers 100% client-side.",
    url: "https://megatools.net/permit-analyzer",
    siteName: "MegaTools",
    type: "website",
  },
};

export default function PermitAnalyzerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "EIP-712 Permit & Phishing Signature Deconstructor",
    url: "https://megatools.net/permit-analyzer",
    description:
      "Deconstruct EIP-712 typed data messages, decode Permit & Permit2 signatures, detect infinite allowance wallet drainer scams, and verify secp256k1 signers 100% client-side.",
    applicationCategory: "SecurityApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PermitAnalyzerClient />
    </>
  );
}
