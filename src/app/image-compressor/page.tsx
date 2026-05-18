import type { Metadata } from "next";
import ImageClient from "./ImageClient";

export const metadata: Metadata = {
  title: "Image Compressor — MegaTools",
  description:
    "Compress images in your browser. Drag and drop, adjust quality, download instantly. Nothing is uploaded.",
  openGraph: {
    title: "Image Compressor — MegaTools",
    description: "Free browser-based image compressor.",
  },
};

export default function ImageCompressorPage() {
  return <ImageClient />;
}
