import type { Metadata } from "next";
import PortLookupClient from "./PortLookupClient";

export const metadata: Metadata = {
  title: "Common Ports Reference — MegaTools",
  description:
    "Database of standard & security-sensitive TCP/UDP ports with service descriptions and vulnerability risk notes.",
  alternates: {
    canonical: "/port-lookup",
  },
  openGraph: {
    title: "Common Ports Reference — MegaTools",
    description: "Free in-browser TCP/UDP ports and security risk inspector.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Common Ports Reference",
  url: "https://megatools-tau.vercel.app/port-lookup",
  description: "Database of standard & security-sensitive TCP/UDP ports with service info and vulnerability risk notes.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PortLookupPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PortLookupClient />
    </>
  );
}
