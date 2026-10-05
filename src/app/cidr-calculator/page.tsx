import type { Metadata } from "next";
import CidrCalculatorClient from "./CidrCalculatorClient";

export const metadata: Metadata = {
  title: "CIDR Calculator & Subnet Mask Notation Tool — MegaTools",
  description:
    "Free IPv4 CIDR notation calculator: compute network address, broadcast, netmask, wildcard, host IP range, and subnet classes instantly in your browser.",
  keywords: [
    "cidr notation calculator",
    "cidr tool",
    "ipv4 subnet calculator",
    "subnet mask calculator",
    "cidr range calculator",
    "network broadcast address calculator",
    "megatools"
  ],
  alternates: {
    canonical: "/cidr-calculator",
  },
  openGraph: {
    title: "CIDR Calculator & Subnet Tool — MegaTools",
    description: "Free browser-side IPv4 CIDR notation and subnet calculator.",
    url: "https://megatools-tau.vercel.app/cidr-calculator",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CIDR Notation Calculator",
  url: "https://megatools-tau.vercel.app/cidr-calculator",
  description: "Calculate IPv4 subnets, network/broadcast IP, host ranges, and CIDR masks.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function CidrCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CidrCalculatorClient />
    </>
  );
}
