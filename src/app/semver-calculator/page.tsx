import type { Metadata } from "next";
import SemverCalculatorClient from "./SemverCalculatorClient";

export const metadata: Metadata = {
  title: "Semantic Versioning Calculator & Range Tester — MegaTools",
  description: "Calculate, bump, and test SemVer 2.0 ranges (^, ~, >=, ||) with instant match feedback and version precedence sorting. 100% client-side in browser RAM.",
  keywords: [
    "semver-calculator",
    "semver range tester",
    "npm version bump",
    "semantic versioning checker",
    "caret vs tilde semver",
    "semver sorter",
    "developer tool",
    "megatools"
  ],
  alternates: {
    canonical: "/semver-calculator",
  },
  openGraph: {
    title: "Semantic Versioning Calculator & Range Tester — MegaTools",
    description: "Interactive SemVer 2.0 calculator, version bumper, and dependency range evaluator.",
    url: "https://megatools-tau.vercel.app/semver-calculator",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Semantic Versioning Calculator & Range Tester",
  url: "https://megatools-tau.vercel.app/semver-calculator",
  description: "Evaluate SemVer 2.0 ranges, simulate Major/Minor/Patch bumps, and sort multi-version releases in browser RAM.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function SemverCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SemverCalculatorClient />
    </>
  );
}
