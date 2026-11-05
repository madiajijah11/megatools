import type { Metadata } from "next";
import StringEscapeClient from "./StringEscapeClient";

export const metadata: Metadata = {
  title: "String & Regex Escaper / Unescaper — MegaTools",
  description:
    "Escape and unescape strings for JSON, JavaScript, SQL, Regular Expressions, Shell, and HTML in your browser.",
  alternates: {
    canonical: "/string-escape",
  },
  openGraph: {
    title: "String & Regex Escaper / Unescaper — MegaTools",
    description: "Free in-browser string and regex escaper/unescaper for developers.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "String & Regex Escaper / Unescaper",
  url: "https://megatools-tau.vercel.app/string-escape",
  description: "Escape and unescape strings for JSON, JavaScript, SQL, Regular Expressions, Shell, and HTML.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function StringEscapePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StringEscapeClient />
    </>
  );
}
