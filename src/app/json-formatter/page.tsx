import type { Metadata } from "next";
import JSONClient from "./JSONClient";

export const metadata: Metadata = {
  title: "JSON Formatter — MegaTools",
  description:
    "Format, minify, and validate JSON data instantly. Free, fast, runs in your browser.",
  alternates: {
    canonical: "/json-formatter",
  },
  openGraph: {
    title: "JSON Formatter — MegaTools",
    description: "Free JSON formatter, minifier, and validator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "JSON Formatter",
  url: "https://megatools-tau.vercel.app/json-formatter",
  description: "Format, validate, and beautify JSON data with syntax highlighting.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function JSONFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JSONClient />
    </>
  );
}
