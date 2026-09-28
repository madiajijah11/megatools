import type { Metadata } from "next";
import OpenapiToTsClient from "./OpenapiToTsClient";

export const metadata: Metadata = {
  title: "OpenAPI to TypeScript & Zod — MegaTools",
  description: "Free client-side openapi to typescript & zod tool with zero data leakage.",
  keywords: ["openapi-to-ts", "openapi to typescript & zod", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/openapi-to-ts",
  },
  openGraph: {
    title: "OpenAPI to TypeScript & Zod — MegaTools",
    description: "Free client-side openapi to typescript & zod tool.",
    url: "https://megatools-tau.vercel.app/openapi-to-ts",
    type: "website",
  },
};

export default function OpenapiToTsPage() {
  return <OpenapiToTsClient />;
}
