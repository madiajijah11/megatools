import type { Metadata } from "next";
import FileChecksumClient from "./FileChecksumClient";

export const metadata: Metadata = {
  title: "Large File Hasher & Checksum — MegaTools",
  description:
    "Calculate SHA-256, SHA-512, SHA-384, and SHA-1 checksums for files of any size directly in your browser. Verify file integrity.",
  openGraph: {
    title: "Large File Hasher — MegaTools",
    description: "Free in-browser file checksum & hash verifier.",
  },
};

export default function FileChecksumPage() {
  return <FileChecksumClient />;
}
