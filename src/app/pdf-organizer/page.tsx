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


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Page Rotator & Reorder Grid",
  url: "https://megatools-tau.vercel.app/pdf-organizer",
  description: "Reorder pages, rotate orientations (90°/180°/270°), and delete unwanted pages visually with in-browser compilation.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PdfOrganizerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PdfOrganizerClient />
    </>
  );
}
