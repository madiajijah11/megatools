import type { Metadata } from "next";
import CurlConverterClient from "./CurlConverterClient";

export const metadata: Metadata = {
  title: "cURL to Code Converter — MegaTools",
  description:
    "Convert cURL commands to JavaScript fetch, Python requests, Axios, and Go net/http instantly in your browser.",
  alternates: {
    canonical: "/curl-converter",
  },
  openGraph: {
    title: "cURL to Code Converter — MegaTools",
    description: "Free in-browser cURL to JS, Python, Axios, and Go code generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "cURL to Code Converter",
  url: "https://megatools-tau.vercel.app/curl-converter",
  description: "Convert cURL commands into JavaScript fetch, Python requests, Axios, and Go code.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function CurlConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CurlConverterClient />
    </>
  );
}
