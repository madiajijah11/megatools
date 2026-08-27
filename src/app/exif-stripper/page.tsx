import type { Metadata } from "next";
import ExifStripperClient from "./ExifStripperClient";

export const metadata: Metadata = {
  title: "EXIF & Metadata Stripper — MegaTools",
  description:
    "Strip GPS coordinates, device info, and private metadata from photos before sharing online. 100% private in-browser tool.",
  openGraph: {
    title: "EXIF Stripper — MegaTools",
    description: "Free in-browser photo metadata and GPS stripper.",
  },
};

export default function ExifStripperPage() {
  return <ExifStripperClient />;
}
