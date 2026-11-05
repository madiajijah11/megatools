import type { Metadata } from "next";
import BinaryConverterClient from "./BinaryConverterClient";

export const metadata: Metadata = {
  title: "Binary & Base Converter — MegaTools",
  description:
    "Convert text and bytes between Binary, Hex, Base58 (Bitcoin/Solana), Base32, and Decimal representations in your browser.",
  alternates: {
    canonical: "/binary-converter",
  },
  openGraph: {
    title: "Binary & Base Converter — MegaTools",
    description: "Free in-browser Binary, Hex, Base58, and Base32 converter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Binary & Base Converter",
  url: "https://megatools-tau.vercel.app/binary-converter",
  description: "Convert text and numbers between Binary, Hex, Base32, Base58 (Bitcoin/Solana), and Decimal.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function BinaryConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BinaryConverterClient />
    </>
  );
}
