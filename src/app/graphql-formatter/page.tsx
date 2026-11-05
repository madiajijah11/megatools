import type { Metadata } from "next";
import GraphqlFormatterClient from "./GraphqlFormatterClient";

export const metadata: Metadata = {
  title: "GraphQL Query Beautifier & AST Inspector — MegaTools",
  description:
    "Format, prettify, minify, and extract variables or operation AST metrics from GraphQL queries and mutations client-side.",
  keywords: [
    "graphql formatter",
    "graphql query beautifier",
    "graphql minify online",
    "graphql ast inspector",
    "graphql variable extractor",
    "graphql payload bundler"
  ],
  alternates: {
    canonical: "/graphql-formatter",
  },
  openGraph: {
    title: "GraphQL Query Beautifier & AST Inspector — MegaTools",
    description:
      "Format and inspect GraphQL queries, mutations, and fragments client-side with zero data leakage.",
    url: "https://megatools-tau.vercel.app/graphql-formatter",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "GraphQL Query Beautifier & AST Inspector",
  url: "https://megatools-tau.vercel.app/graphql-formatter",
  description: "Format, prettify, minify, and extract variables or operation AST metrics from GraphQL queries and mutations.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function GraphqlFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GraphqlFormatterClient />
    </>
  );
}
