import type { Metadata } from "next";
import HmacGeneratorClient from "./HmacGeneratorClient";

export const metadata: Metadata = {
  title: "HMAC Hash & Webhook Signature Generator — MegaTools",
  description:
    "Generate and verify HMAC (SHA-256, SHA-512, SHA-384, SHA-1) signatures client-side using native Web Crypto API.",
  openGraph: {
    title: "HMAC Hash & Signature Generator — MegaTools",
    description: "Free in-browser HMAC generator and webhook signature verifier.",
  },
};

export default function HmacGeneratorPage() {
  return <HmacGeneratorClient />;
}
