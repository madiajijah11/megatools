import type { Metadata } from "next";
import PdfMergeClient from "./PdfMergeClient";

export const metadata: Metadata = {
  title: "Merge PDF — MegaTools",
  description:
    "Combine multiple PDF documents into a single file in your browser. 100% private, no server uploads.",
  openGraph: {
    title: "Merge PDF — MegaTools",
    description: "Free in-browser PDF merge tool. Fast and completely client-side.",
  },
};

export default function PdfMergePage() {
  return <PdfMergeClient />;
}
