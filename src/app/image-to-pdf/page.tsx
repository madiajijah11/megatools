import type { Metadata } from "next";
import ImageToPdfClient from "./ImageToPdfClient";

export const metadata: Metadata = {
  title: "Image to PDF — MegaTools",
  description:
    "Convert PNG, JPG, and WebP images into a multi-page PDF document. 100% private in-browser tool.",
  openGraph: {
    title: "Image to PDF — MegaTools",
    description: "Free in-browser image to PDF converter.",
  },
};

export default function ImageToPdfPage() {
  return <ImageToPdfClient />;
}
