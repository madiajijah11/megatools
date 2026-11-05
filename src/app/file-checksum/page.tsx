import type { Metadata } from "next";
import FileChecksumClient from "./FileChecksumClient";

export const metadata: Metadata = {
  title: "Large File Hasher & Checksum — MegaTools",
  description:
    "Calculate SHA-256, SHA-512, SHA-384, and SHA-1 checksums for files of any size directly in your browser. Verify file integrity.",
  alternates: {
    canonical: "/file-checksum",
  },
  openGraph: {
    title: "Large File Hasher — MegaTools",
    description: "Free in-browser file checksum & hash verifier.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Large File Hasher",
  url: "https://megatools-tau.vercel.app/file-checksum",
  description: "Calculate SHA-256, SHA-512, SHA-384, and SHA-1 checksums for large files with chunking.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function FileChecksumPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FileChecksumClient />
    </>
  );
}
