import type { Metadata } from "next";
import SriHashGeneratorClient from "./SriHashGeneratorClient";

export const metadata: Metadata = {
  title: "Subresource Integrity (SRI) Hash Generator — MegaTools",
  description:
    "Generate W3C Subresource Integrity (SRI) hashes (sha256, sha384, sha512) for CDN scripts and stylesheets with HTML tag generator.",
  openGraph: {
    title: "Subresource Integrity (SRI) Hash Generator — MegaTools",
    description: "Generate secure SRI hashes and HTML <script> / <link> tags client-side.",
  },
};

export default function SriHashPage() {
  return <SriHashGeneratorClient />;
}
