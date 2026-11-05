import type { Metadata } from "next";
import BcryptGeneratorClient from "./BcryptGeneratorClient";

export const metadata: Metadata = {
  title: "Bcrypt Hash Generator & Verifier — MegaTools",
  description:
    "Generate secure Bcrypt password hashes ($2a$, $2b$, $2y$) and verify plaintext passwords against existing hashes 100% in your browser.",
  alternates: {
    canonical: "/bcrypt-generator",
  },
  openGraph: {
    title: "Bcrypt Hash Generator & Verifier — MegaTools",
    description: "Generate and verify Bcrypt password hashes client-side with configurable salt rounds.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Bcrypt Hash Generator & Verifier",
  url: "https://megatools-tau.vercel.app/bcrypt-generator",
  description: "Generate secure Bcrypt password hashes ($2b$) and verify plaintext passwords against existing hashes.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function BcryptPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BcryptGeneratorClient />
    </>
  );
}
