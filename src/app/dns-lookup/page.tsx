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

export default function DnsLookupPage() {
  return <DnsLookupClient />;
}
