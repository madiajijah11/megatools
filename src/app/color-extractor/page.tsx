import type { Metadata } from "next";
import ColorExtractorClient from "./ColorExtractorClient";

export const metadata: Metadata = {
  title: "Image Color Palette Extractor — MegaTools",
  description:
    "Extract dominant colors and generate color palettes (HEX, RGB, HSL, CSS Variables) from any image client-side.",
  openGraph: {
    title: "Image Color Palette Extractor — MegaTools",
    description: "Free in-browser dominant color palette extractor.",
  },
};

export default function ColorExtractorPage() {
  return <ColorExtractorClient />;
}
