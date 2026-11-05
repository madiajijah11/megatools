import type { Metadata } from "next";
import EmailDnsGeneratorClient from "./EmailDnsGeneratorClient";

export const metadata: Metadata = {
  title: "SPF, DKIM & DMARC DNS Record Generator — MegaTools",
  description:
    "Generate and configure DNS TXT records for SPF, DKIM, and DMARC email authentication to prevent spam and domain spoofing.",
  alternates: {
    canonical: "/email-dns-generator",
  },
  openGraph: {
    title: "SPF, DKIM & DMARC DNS Record Generator — MegaTools",
    description: "Generate compliant SPF, DKIM, and DMARC DNS security records client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SPF, DKIM & DMARC DNS Record Generator",
  url: "https://megatools-tau.vercel.app/email-dns-generator",
  description: "Generate compliant DNS TXT records for SPF, DKIM, and DMARC email authentication and anti-spoofing.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function EmailDnsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EmailDnsGeneratorClient />
    </>
  );
}
