import type { Metadata } from "next";
import AspectRatioCalculatorClient from "./AspectRatioCalculatorClient";

export const metadata: Metadata = {
  title: "Aspect Ratio & Resolution Calculator — MegaTools",
  description:
    "Calculate aspect ratios (16:9, 4:3, 21:9, 1:1), scale dimensions proportionally, find greatest common divisors (GCD), and compute video bitrates.",
  alternates: {
    canonical: "/aspect-ratio-calculator",
  },
  openGraph: {
    title: "Aspect Ratio & Resolution Calculator — MegaTools",
    description: "Calculate aspect ratios, pixel scaling, and display dimensions client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Aspect Ratio & Resolution Calculator",
  url: "https://megatools-tau.vercel.app/aspect-ratio-calculator",
  description: "Calculate aspect ratios (16:9, 4:3, 21:9), scale pixel dimensions proportionally, and find GCD reductions.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function AspectRatioPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AspectRatioCalculatorClient />
    </>
  );
}
