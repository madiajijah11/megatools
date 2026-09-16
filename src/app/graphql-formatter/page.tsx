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

export default function GraphqlFormatterPage() {
  return <GraphqlFormatterClient />;
}
