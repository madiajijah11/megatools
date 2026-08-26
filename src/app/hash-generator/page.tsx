import type { Metadata } from "next";
import HashClient from "./HashClient";

export const metadata: Metadata = {
  title: "Hash Generator — MegaTools",
  description:
    "Compute SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text instantly. Runs entirely in your browser.",
  openGraph: {
    title: "Hash Generator — MegaTools",
    description: "Free browser-side SHA hash generator.",
  },
};

export default function HashGeneratorPage() {
  return <HashClient />;
}
