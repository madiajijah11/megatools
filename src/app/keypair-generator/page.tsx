import type { Metadata } from "next";
import KeypairGeneratorClient from "./KeypairGeneratorClient";

export const metadata: Metadata = {
  title: "RSA & ECDSA Key Pair Generator — MegaTools",
  description:
    "Generate cryptographically secure RSA and ECDSA public/private key pairs (PEM format) 100% in your browser.",
  openGraph: {
    title: "RSA & ECDSA Key Pair Generator — MegaTools",
    description: "Free in-browser secure cryptographic key pair generator.",
  },
};

export default function KeypairGeneratorPage() {
  return <KeypairGeneratorClient />;
}
