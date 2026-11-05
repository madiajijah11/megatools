import type { Metadata } from "next";
import AesCryptoClient from "./AesCryptoClient";

export const metadata: Metadata = {
  title: "AES Encrypt/Decrypt — MegaTools",
  description:
    "Encrypt and decrypt text with a passphrase using AES-256-GCM via the Web Crypto API. Everything runs in your browser — your passphrase and data never leave your device.",
  alternates: {
    canonical: "/aes-crypto",
  },
  openGraph: {
    title: "AES Encrypt/Decrypt — MegaTools",
    description: "Passphrase encryption in your browser via Web Crypto.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "AES Encrypt/Decrypt",
  url: "https://megatools-tau.vercel.app/aes-crypto",
  description: "Encrypt or decrypt text with a passphrase using AES-GCM. Keys never leave your device.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function AesCryptoPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AesCryptoClient />
    </>
  );
}
