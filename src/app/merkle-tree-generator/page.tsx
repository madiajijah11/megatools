import type { Metadata } from "next";
import MerkleTreeGeneratorClient from "./MerkleTreeGeneratorClient";

export const metadata: Metadata = {
  title: "Merkle Tree Root & Airdrop Proof Generator — MegaTools",
  description:
    "Generate OpenZeppelin-compatible Merkle Roots and individual cryptographic proofs for smart contract airdrops and NFT whitelists 100% in your browser.",
  alternates: {
    canonical: "/merkle-tree-generator",
  },
  openGraph: {
    title: "Merkle Tree Root & Airdrop Proof Generator",
    description: "Instant in-browser Merkle tree builder and OpenZeppelin MerkleProof validator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Merkle Tree Root & Proof Builder",
  url: "https://megatools-tau.vercel.app/merkle-tree-generator",
  description: "Generate cryptographic Merkle roots and OpenZeppelin-compatible verification proofs for airdrops and whitelists.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function MerkleTreeGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MerkleTreeGeneratorClient />
    </>
  );
}
