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


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RDAP Domain & IP Registration Inspector",
  url: "https://megatools-tau.vercel.app/rdap-lookup",
  description: "Query authoritative domain registration, expiration dates, status flags, and IP ownership via ICANN",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function RdapLookupPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RdapLookupClient />
    </>
  );
}
