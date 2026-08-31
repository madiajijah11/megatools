import type { Metadata } from "next";
import MerkleTreeGeneratorClient from "./MerkleTreeGeneratorClient";

export const metadata: Metadata = {
  title: "Merkle Tree Root & Airdrop Proof Generator — MegaTools",
  description:
    "Generate OpenZeppelin-compatible Merkle Roots and individual cryptographic proofs for smart contract airdrops and NFT whitelists 100% in your browser.",
  openGraph: {
    title: "Merkle Tree Root & Airdrop Proof Generator",
    description: "Instant in-browser Merkle tree builder and OpenZeppelin MerkleProof validator.",
  },
};

export default function MerkleTreeGeneratorPage() {
  return <MerkleTreeGeneratorClient />;
}
