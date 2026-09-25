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

export default function PdfMetadataEditorPage() {
  return <PdfMetadataEditorClient />;
}
