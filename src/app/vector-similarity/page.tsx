import type { Metadata } from "next";
import VectorSimilarityClient from "./VectorSimilarityClient";

export const metadata: Metadata = {
  title: "Vector Cosine Similarity & Distance Calculator — MegaTools",
  description:
    "Compute Cosine Similarity, Dot Product, Euclidean (L2), and Manhattan (L1) distances between AI embeddings 100% in your browser.",
  openGraph: {
    title: "Vector Cosine Similarity & Distance Calculator",
    description: "Instant in-browser AI embedding vector distance and cosine similarity math engine.",
  },
};

export default function VectorSimilarityPage() {
  return <VectorSimilarityClient />;
}
