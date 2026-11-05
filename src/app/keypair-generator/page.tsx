import type { Metadata } from "next";
import KeypairGeneratorClient from "./KeypairGeneratorClient";

export const metadata: Metadata = {
  title: "RSA & ECDSA Key Pair Generator — MegaTools",
  description:
    "Generate cryptographically secure RSA and ECDSA public/private key pairs (PEM format) 100% in your browser.",
  alternates: {
    canonical: "/keypair-generator",
  },
  openGraph: {
    title: "RSA & ECDSA Key Pair Generator — MegaTools",
    description: "Free in-browser secure cryptographic key pair generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "RSA & ECDSA Key Pair Generator",
  url: "https://megatools-tau.vercel.app/keypair-generator",
  description: "Generate asymmetric encryption & signing key pairs in standard PEM format (PKCS#8 / SPKI).",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function KeypairGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KeypairGeneratorClient />
    </>
  );
}
