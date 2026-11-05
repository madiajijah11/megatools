import type { Metadata } from "next";
import EnvFileEditorClient from "./EnvFileEditorClient";

export const metadata: Metadata = {
  title: "Environment File Editor & Sanitizer — MegaTools",
  description: "Free client-side environment file editor & sanitizer tool with zero data leakage.",
  keywords: ["env-file-editor", "environment file editor & sanitizer", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/env-file-editor",
  },
  openGraph: {
    title: "Environment File Editor & Sanitizer — MegaTools",
    description: "Free client-side environment file editor & sanitizer tool.",
    url: "https://megatools-tau.vercel.app/env-file-editor",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Environment File Editor & Sanitizer",
  url: "https://megatools-tau.vercel.app/env-file-editor",
  description: "Inspect, sanitize, and export .env variables locally without sending secrets anywhere.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function EnvFileEditorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EnvFileEditorClient />
    </>
  );
}
