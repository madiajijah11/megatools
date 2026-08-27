import type { Metadata } from "next";
import SteganographyClient from "./SteganographyClient";

export const metadata: Metadata = {
  title: "Image Steganography — MegaTools",
  description:
    "Hide secret messages inside image pixels (LSB encoding) or decode hidden text in your browser. 100% private.",
  openGraph: {
    title: "Image Steganography — MegaTools",
    description: "Free in-browser image steganography tool (LSB hide & extract).",
  },
};

export default function SteganographyPage() {
  return <SteganographyClient />;
}
