import type { Metadata } from "next";
import ChmodCalculatorClient from "./ChmodCalculatorClient";

export const metadata: Metadata = {
  title: "Chmod Calculator — MegaTools",
  description:
    "Convert between chmod octal (755) and symbolic (rwxr-xr-x) file permissions. Includes setuid, setgid, and sticky bit. Runs entirely in your browser.",
  alternates: {
    canonical: "/chmod-calculator",
  },
  openGraph: {
    title: "Chmod Calculator — MegaTools",
    description: "Free chmod octal ↔ symbolic permission calculator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Chmod Calculator",
  url: "https://megatools-tau.vercel.app/chmod-calculator",
  description: "Compute file permissions from checkboxes or octal. Symbolic and numeric output.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ChmodCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ChmodCalculatorClient />
    </>
  );
}
