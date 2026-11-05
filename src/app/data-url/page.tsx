import type { Metadata } from "next";
import DataUrlClient from "./DataUrlClient";

export const metadata: Metadata = {
  title: "Base64 Data URL & Asset Embedder — MegaTools",
  description:
    "Convert images, SVGs, fonts, and files into RFC 2397 Data URLs, CSS background-image code, and HTML tags with live size overhead metrics 100% in your browser.",
  keywords: [
    "data url generator",
    "base64 data uri converter",
    "embed image in css",
    "svg to data url",
    "image to base64 data url",
    "font to data url",
    "inline asset embedder",
    "data uri generator",
  ],
  openGraph: {
    title: "Base64 Data URL & Asset Embedder — MegaTools",
    description:
      "Transform images, fonts, and SVGs into Base64 Data URLs, CSS snippets, and HTML tags with live overhead metrics.",
  },
  alternates: {
    canonical: "/data-url",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Base64 Data URL & Asset Embedder",
  url: "https://megatools-tau.vercel.app/data-url",
  description: "Convert images, fonts, SVGs, and files into inline Base64 Data URLs, CSS background snippets, and HTML tags.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function DataUrlPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DataUrlClient />
    </>
  );
}
