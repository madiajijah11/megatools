import type { Metadata } from "next";
import PdfMetadataEditorClient from "./PdfMetadataEditorClient";

export const metadata: Metadata = {
  title: "PDF Metadata Editor & Sanitizer — MegaTools",
  description: "View, edit, or 1-click strip all metadata (Title, Author, Subject, Creator, Producer) from PDF documents entirely in your browser with zero data leakage.",
  keywords: [
    "pdf-metadata-editor",
    "pdf metadata remover",
    "strip pdf metadata",
    "edit pdf author",
    "pdf sanitizer",
    "clear pdf title",
    "privacy pdf tool",
    "megatools"
  ],
  alternates: {
    canonical: "/pdf-metadata-editor",
  },
  openGraph: {
    title: "PDF Metadata Editor & Sanitizer — MegaTools",
    description: "Inspect, edit, or purge confidential metadata from PDF documents 100% client-side.",
    url: "https://megatools-tau.vercel.app/pdf-metadata-editor",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Metadata Editor & Sanitizer",
  url: "https://megatools-tau.vercel.app/pdf-metadata-editor",
  description: "Inspect, modify, or 1-click strip all metadata (Title, Author, Subject, Creator) from PDF files in browser RAM.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PdfMetadataEditorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PdfMetadataEditorClient />
    </>
  );
}
