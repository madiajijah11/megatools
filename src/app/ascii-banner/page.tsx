import type { Metadata } from "next";
import AsciiBannerClient from "./AsciiBannerClient";

export const metadata: Metadata = {
  title: "ASCII Art & Terminal Banner Generator — MegaTools",
  description:
    "Convert text into stylish ASCII art FIGlet fonts (Standard, Slant, Doom, Big, Small) and images into ASCII art in your browser.",
  openGraph: {
    title: "ASCII Art & Terminal Banner Generator — MegaTools",
    description: "Generate ASCII text banners and terminal art client-side.",
  },
};

export default function AsciiBannerPage() {
  return <AsciiBannerClient />;
}
