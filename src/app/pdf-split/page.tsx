import type { Metadata } from "next";
import PdfSplitClient from "./PdfSplitClient";

export const metadata: Metadata = {
  title: "Split PDF — MegaTools",
  description:
    "Extract specific pages or page ranges from a PDF document in your browser. 100% private.",
  openGraph: {
    title: "Split PDF — MegaTools",
    description: "Free in-browser PDF page extractor and splitter.",
  },
};

export default function PdfSplitPage() {
  return <PdfSplitClient />;
}
