import type { Metadata } from "next";
import HttpStatusClient from "./HttpStatusClient";

export const metadata: Metadata = {
  title: "HTTP Status Codes & Headers Explorer (1xx-5xx RFC Guide) — MegaTools",
  description:
    "Fast lookup for all HTTP status codes (200, 404, 500, RFC 9110) & common request/response headers with clear explanations and code examples. 100% free.",
  keywords: [
    "http status codes",
    "http response codes",
    "http headers explorer",
    "404 not found rfc",
    "http 9110",
    "rest api status codes",
    "developer tools"
  ],
  alternates: {
    canonical: "/http-status",
  },
  openGraph: {
    title: "HTTP Status Codes & Headers Explorer — MegaTools",
    description: "Instant searchable directory of all HTTP status codes (1xx-5xx) and RFC headers.",
    url: "https://megatools-tau.vercel.app/http-status",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HTTP Status Codes Explorer",
  url: "https://megatools-tau.vercel.app/http-status",
  description: "Search and inspect HTTP status codes and headers with RFC references.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function HttpStatusPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HttpStatusClient />
    </>
  );
}
