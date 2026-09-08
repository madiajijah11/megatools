import type { Metadata } from "next";
import SecretScannerClient from "./SecretScannerClient";

export const metadata: Metadata = {
  title: "Secret & API Key Leak Scanner — MegaTools",
  description:
    "Scan code, config files, .env, and git diffs for leaked API keys, tokens, and database secrets. 100% client-side with 1-click auto-masking.",
  keywords: [
    "secret scanner",
    "api key leak detector",
    "credential leak checker",
    "git leak detector",
    "env scanner",
    "token detector",
    "shannon entropy scanner",
    "code security scanner",
    "auto redact api key",
  ],
  openGraph: {
    title: "Secret & API Key Leak Scanner — MegaTools",
    description:
      "Detect leaked API keys, tokens, database credentials, and high-entropy secrets client-side with 1-click auto-masking.",
  },
  alternates: {
    canonical: "/secret-scanner",
  },
};

export default function SecretScannerPage() {
  return <SecretScannerClient />;
}
