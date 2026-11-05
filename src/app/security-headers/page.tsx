import type { Metadata } from "next";
import SecurityHeadersClient from "./SecurityHeadersClient";

export const metadata: Metadata = {
  title: "Security Headers Generator — MegaTools",
  description:
    "Generate hardened HTTP security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) for Nginx, Vercel, Apache, and Caddy.",
  alternates: {
    canonical: "/security-headers",
  },
  openGraph: {
    title: "Security Headers Generator — MegaTools",
    description: "Free in-browser HTTP security headers config generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Security Headers Generator",
  url: "https://megatools-tau.vercel.app/security-headers",
  description: "Generate hardened HTTP security headers (CSP, HSTS, CORS, X-Frame-Options) for Nginx, Vercel, Apache.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function SecurityHeadersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SecurityHeadersClient />
    </>
  );
}
