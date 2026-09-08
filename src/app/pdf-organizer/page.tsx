import type { Metadata } from "next";
import PdfOrganizerClient from "./PdfOrganizerClient";

export const metadata: Metadata = {
  title: "PDF Page Rotator & Reorder Grid — MegaTools",
  description:
    "Reorder, rotate, and delete pages from PDF files client-side. Fast, visual, and privacy-first with zero server uploads.",
  keywords: [
    "pdf organizer",
    "rotate pdf pages",
    "reorder pdf pages",
    "delete pdf pages",
    "pdf page reorder online",
    "pdf rotator tool",
    "client-side pdf editor",
  ],
  openGraph: {
    title: "PDF Page Rotator & Reorder Grid — MegaTools",
    description:
      "Visual grid to rotate, reorder, and remove pages from PDF documents entirely in your browser.",
  },
  alternates: {
    canonical: "/pdf-organizer",
  },
};

export default function PdfOrganizerPage() {
  return <PdfOrganizerClient />;
}
