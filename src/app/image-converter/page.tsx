import type { Metadata } from "next";
import ImageConverterClient from "./ImageConverterClient";

export const metadata: Metadata = {
  title: "Image Converter — MegaTools",
  description:
    "Convert images between PNG, JPG, and WebP formats with quality control in your browser. 100% private.",
  openGraph: {
    title: "Image Converter — MegaTools",
    description: "Free in-browser image format converter.",
  },
};

export default function ImageConverterPage() {
  return <ImageConverterClient />;
}
