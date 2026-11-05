import type { Metadata } from "next";
import RegexTesterClient from "./RegexTesterClient";

export const metadata: Metadata = {
  title: "Regex Tester — MegaTools",
  description:
    "Test regular expressions live in your browser. Highlighted matches, capture groups, and match stats.",
  alternates: {
    canonical: "/regex-tester",
  },
  openGraph: {
    title: "Regex Tester — MegaTools",
    description: "Free online regex tester with live highlighting.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Regex Tester",
  url: "https://megatools-tau.vercel.app/regex-tester",
  description: "Test regular expressions live with match highlighting and capture groups.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function RegexTesterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RegexTesterClient />
    </>
  );
}
