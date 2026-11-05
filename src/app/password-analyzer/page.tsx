import type { Metadata } from "next";
import PasswordAnalyzerClient from "./PasswordAnalyzerClient";

export const metadata: Metadata = {
  title: "Password Entropy & Strength Analyzer — MegaTools",
  description:
    "Analyze password entropy, brute-force crack time, character pool distribution, and security weaknesses 100% locally in your browser.",
  alternates: {
    canonical: "/password-analyzer",
  },
  openGraph: {
    title: "Password Entropy & Strength Analyzer — MegaTools",
    description: "Free in-browser password entropy and crack time estimator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Password Entropy & Strength Analyzer",
  url: "https://megatools-tau.vercel.app/password-analyzer",
  description: "Evaluate password complexity, Shannon entropy bits, and brute-force cracking resistance.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PasswordAnalyzerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PasswordAnalyzerClient />
    </>
  );
}
