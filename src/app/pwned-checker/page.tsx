import type { Metadata } from "next";
import PwnedCheckerClient from "./PwnedCheckerClient";

export const metadata: Metadata = {
  title: "Pwned Password & Data Breach Checker — MegaTools",
  description:
    "Check if your passwords have been leaked in billions of breached records using HaveIBeenPwned k-Anonymity privacy model. 100% private in-browser SHA-1 hashing.",
  keywords: [
    "pwned password checker",
    "data breach checker",
    "password leak test",
    "have i been pwned api",
    "k-anonymity password check",
    "sha1 hash breach lookup",
    "credential compromise tester",
    "cybersecurity password audit",
  ],
  openGraph: {
    title: "Pwned Password & Data Breach Checker — MegaTools",
    description:
      "Check if your password was exposed in data breaches with mathematical k-Anonymity privacy. Zero plain-text leaves your device.",
  },
  alternates: {
    canonical: "/pwned-checker",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Pwned Password & Data Breach Checker",
  url: "https://megatools-tau.vercel.app/pwned-checker",
  description: "Check if your password has been exposed in billions of leaked records using mathematical k-Anonymity privacy.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PwnedCheckerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PwnedCheckerClient />
    </>
  );
}
