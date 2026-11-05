import type { Metadata } from "next";
import VectorSimilarityClient from "./VectorSimilarityClient";

export const metadata: Metadata = {
  title: "Vector Cosine Similarity & Distance Calculator — MegaTools",
  description:
    "Compute Cosine Similarity, Dot Product, Euclidean (L2), and Manhattan (L1) distances between AI embeddings 100% in your browser.",
  alternates: {
    canonical: "/vector-similarity",
  },
  openGraph: {
    title: "Vector Cosine Similarity & Distance Calculator",
    description: "Instant in-browser AI embedding vector distance and cosine similarity math engine.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Vector Cosine Similarity & Distance Engine",
  url: "https://megatools-tau.vercel.app/vector-similarity",
  description: "Calculate Cosine Similarity, Dot Product, Euclidean (L2), and Manhattan (L1) metrics for AI embeddings.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function VectorSimilarityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VectorSimilarityClient />
    </>
  );
}
