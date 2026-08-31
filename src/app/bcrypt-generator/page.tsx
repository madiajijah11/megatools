import type { Metadata } from "next";
import BcryptGeneratorClient from "./BcryptGeneratorClient";

export const metadata: Metadata = {
  title: "Bcrypt Hash Generator & Verifier — MegaTools",
  description:
    "Generate secure Bcrypt password hashes ($2a$, $2b$, $2y$) and verify plaintext passwords against existing hashes 100% in your browser.",
  openGraph: {
    title: "Bcrypt Hash Generator & Verifier — MegaTools",
    description: "Generate and verify Bcrypt password hashes client-side with configurable salt rounds.",
  },
};

export default function BcryptPage() {
  return <BcryptGeneratorClient />;
}
