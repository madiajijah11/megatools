import type { Metadata } from "next";
import DnsLookupClient from "./DnsLookupClient";

export const metadata: Metadata = {
  title: "DNS over HTTPS (DoH) Lookup & Records Inspector — MegaTools",
  description:
    "Query DNS records (A, AAAA, MX, TXT, CNAME, NS, SOA, CAA) directly from Cloudflare and Google DoH resolvers in your browser. Fast, encrypted, privacy-first.",
  keywords: [
    "dns lookup",
    "dns over https lookup",
    "doh inspector",
    "mx record checker",
    "txt record lookup",
    "cloudflare doh query",
    "google doh query",
    "dnssec validator",
    "domain name resolver",
  ],
  openGraph: {
    title: "DNS over HTTPS (DoH) Lookup & Records Inspector — MegaTools",
    description:
      "Inspect DNS records (A, AAAA, MX, TXT, CNAME, NS, SOA) via Cloudflare and Google encrypted DoH JSON APIs.",
  },
  alternates: {
    canonical: "/dns-lookup",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DNS over HTTPS (DoH) Lookup & Records Inspector",
  url: "https://megatools-tau.vercel.app/dns-lookup",
  description: "Query A, AAAA, MX, TXT, CNAME, NS, and SOA records directly from Cloudflare and Google DoH resolvers.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function DnsLookupPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DnsLookupClient />
    </>
  );
}
