import type { Metadata } from "next";
import HtmlToJsxClient from "./HtmlToJsxClient";

export const metadata: Metadata = {
  title: "HTML / SVG to JSX Converter — MegaTools",
  description:
    "Convert raw HTML and SVG code into React and Next.js compatible JSX instantly in your browser.",
  alternates: {
    canonical: "/html-to-jsx",
  },
  openGraph: {
    title: "HTML / SVG to JSX Converter — MegaTools",
    description: "Free in-browser HTML & SVG to React JSX converter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HTML / SVG to JSX Converter",
  url: "https://megatools-tau.vercel.app/html-to-jsx",
  description: "Convert raw HTML and SVG into React and Next.js compatible JSX with camelCase attributes and style objects.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function HtmlToJsxPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HtmlToJsxClient />
    </>
  );
}
