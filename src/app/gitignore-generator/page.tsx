import type { Metadata } from "next";
import GitignoreGeneratorClient from "./GitignoreGeneratorClient";

export const metadata: Metadata = {
  title: "Gitignore Generator — MegaTools",
  description: "Free client-side gitignore generator tool with zero data leakage.",
  keywords: ["gitignore-generator", "gitignore generator", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/gitignore-generator",
  },
  openGraph: {
    title: "Gitignore Generator — MegaTools",
    description: "Free client-side gitignore generator tool.",
    url: "https://megatools-tau.vercel.app/gitignore-generator",
    type: "website",
  },
};

export default function GitignoreGeneratorPage() {
  return <GitignoreGeneratorClient />;
}
