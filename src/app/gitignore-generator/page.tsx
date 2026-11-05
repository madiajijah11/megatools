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


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Gitignore Generator",
  url: "https://megatools-tau.vercel.app/gitignore-generator",
  description: "Compose a project-ready .gitignore from popular language, framework, OS, and editor presets.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function GitignoreGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GitignoreGeneratorClient />
    </>
  );
}
