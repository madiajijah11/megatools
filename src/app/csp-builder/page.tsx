import type { Metadata } from "next";
import CspBuilderClient from "./CspBuilderClient";

export const metadata: Metadata = {
  title: "Content Security Policy (CSP) Builder & Analyzer — MegaTools",
  description:
    "Build, test, and analyze hardened Content Security Policy (CSP) headers with strict nonces, SHA-256 hashes, and security risk auditing.",
  keywords: [
    "csp builder",
    "content security policy generator",
    "strict csp generator",
    "csp evaluator",
    "nonce generator csp",
    "nginx csp config",
    "nextjs csp header",
    "xss defense builder"
  ],
  alternates: {
    canonical: "/csp-builder",
  },
  openGraph: {
    title: "Content Security Policy (CSP) Builder & Analyzer — MegaTools",
    description:
      "Generate hardened Content-Security-Policy headers for Nginx, Vercel, and Next.js with zero server leakage.",
    url: "https://megatools-tau.vercel.app/csp-builder",
    type: "website",
  },
};

export default function CspBuilderPage() {
  return <CspBuilderClient />;
}
