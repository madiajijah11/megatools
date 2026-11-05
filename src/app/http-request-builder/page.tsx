import type { Metadata } from "next";
import HttpRequestBuilderClient from "./HttpRequestBuilderClient";

export const metadata: Metadata = {
  title: "HTTP Request Builder — MegaTools",
  description: "Free client-side http request builder tool with zero data leakage.",
  keywords: ["http-request-builder", "http request builder", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/http-request-builder",
  },
  openGraph: {
    title: "HTTP Request Builder — MegaTools",
    description: "Free client-side http request builder tool.",
    url: "https://megatools-tau.vercel.app/http-request-builder",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HTTP Request Builder",
  url: "https://megatools-tau.vercel.app/http-request-builder",
  description: "Build one HTTP request and export it as cURL, fetch, Axios, or Python requests code.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function HttpRequestBuilderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HttpRequestBuilderClient />
    </>
  );
}
