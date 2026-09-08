import type { Metadata } from "next";
import RdapLookupClient from "./RdapLookupClient";

export const metadata: Metadata = {
  title: "RDAP Domain & IP Registration Inspector — MegaTools",
  description:
    "Look up domain registration dates, expiration status, registrar info, and IP network blocks via ICANN REST RDAP protocol. Modern WHOIS replacement 100% in your browser.",
  keywords: [
    "rdap lookup",
    "whois lookup tool",
    "domain expiration checker",
    "domain registration lookup",
    "ip ownership lookup",
    "icann rdap inspector",
    "domain status checker",
    "arin ip lookup",
  ],
  openGraph: {
    title: "RDAP Domain & IP Registration Inspector — MegaTools",
    description:
      "Query authoritative domain registration, expiration dates, status flags, and IP ownership via ICANN RDAP protocol.",
  },
  alternates: {
    canonical: "/rdap-lookup",
  },
};

export default function RdapLookupPage() {
  return <RdapLookupClient />;
}
