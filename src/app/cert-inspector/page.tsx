import type { Metadata } from "next";
import CertInspectorClient from "./CertInspectorClient";

export const metadata: Metadata = {
  title: "SSL / X.509 Certificate Inspector — MegaTools",
  description:
    "Parse and inspect X.509 SSL/TLS certificates and CSRs (PEM format) in your browser. 100% private.",
  alternates: {
    canonical: "/cert-inspector",
  },
  openGraph: {
    title: "Certificate Inspector — MegaTools",
    description: "Free in-browser X.509 SSL certificate and SANs parser.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SSL / X.509 Certificate Inspector",
  url: "https://megatools-tau.vercel.app/cert-inspector",
  description: "Parse and inspect X.509 certificates and CSRs (PEM format) locally without sending keys anywhere.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function CertInspectorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CertInspectorClient />
    </>
  );
}
