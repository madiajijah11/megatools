import type { Metadata } from "next";
import TextTransformerClient from "./TextTransformerClient";

export const metadata: Metadata = {
  title: "Text Transformer — MegaTools",
  description:
    "Convert text case (UPPERCASE, camelCase, snake_case and more) and encode or decode HTML entities instantly in your browser.",
  alternates: {
    canonical: "/text-transformer",
  },
  openGraph: {
    title: "Text Transformer — MegaTools",
    description: "Case conversion and HTML entity encoding, all client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Text Transformer",
  url: "https://megatools-tau.vercel.app/text-transformer",
  description: "Convert text case (camel, snake, kebab...) and encode/decode HTML entities.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function TextTransformerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TextTransformerClient />
    </>
  );
}
