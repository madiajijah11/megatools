import type { Metadata } from "next";
import Ipv6CalculatorClient from "./Ipv6CalculatorClient";

export const metadata: Metadata = {
  title: "IPv6 & Subnet Calculator — MegaTools",
  description:
    "Calculate IPv6 subnets, expand/compress addresses, compute reverse DNS ip6.arpa, and inspect address scopes in your browser.",
  alternates: {
    canonical: "/ipv6-calculator",
  },
  openGraph: {
    title: "IPv6 & Subnet Calculator — MegaTools",
    description: "Free in-browser IPv6 subnet and prefix calculator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "IPv6 & Subnet Calculator",
  url: "https://megatools-tau.vercel.app/ipv6-calculator",
  description: "Calculate IPv6 subnets, expand/compress addresses, compute reverse DNS ip6.arpa, and inspect address scopes.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function Ipv6CalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Ipv6CalculatorClient />
    </>
  );
}
