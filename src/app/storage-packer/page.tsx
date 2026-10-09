import type { Metadata } from "next";
import StoragePackerClient from "./StoragePackerClient";

export const metadata: Metadata = {
  title: "Solidity Storage Layout & Gas Packing Optimizer — MegaTools",
  description:
    "Visualize EVM 32-byte storage slots, simulate struct and state variable packing, eliminate wasted padding bytes, and optimize SSTORE gas costs with 1-click bin-packing.",
  keywords: [
    "solidity storage layout",
    "evm storage slots",
    "gas optimization solidity",
    "sstore gas savings",
    "struct packing solidity",
    "variable packing ethereum",
    "smart contract optimizer",
    "bin packing solidity",
    "solidity memory layout",
    "web3 developer tools",
  ],
  alternates: {
    canonical: "https://megatools.net/storage-packer",
  },
  openGraph: {
    title: "Solidity Storage Layout & Gas Packing Optimizer — MegaTools",
    description:
      "Visualize EVM 32-byte storage slots, simulate struct and state variable packing, eliminate wasted padding bytes, and optimize SSTORE gas costs with 1-click bin-packing.",
    url: "https://megatools.net/storage-packer",
    siteName: "MegaTools",
    type: "website",
  },
};

export default function StoragePackerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Solidity Storage Layout & Gas Packing Optimizer",
    url: "https://megatools.net/storage-packer",
    description:
      "Visualize EVM 32-byte storage slots, simulate struct and state variable packing, eliminate wasted padding bytes, and optimize SSTORE gas costs with 1-click bin-packing.",
    applicationCategory: "DeveloperApplication",
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
      <StoragePackerClient />
    </>
  );
}
