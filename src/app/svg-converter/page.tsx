import type { Metadata } from "next";
import SvgConverterClient from "./SvgConverterClient";

export const metadata: Metadata = {
  title: "SVG to PNG / JPG / WebP Converter — MegaTools",
  description:
    "Convert and upscale SVG files and code to PNG, JPG, and WebP at 1x, 2x, 4x resolutions directly in your browser.",
  openGraph: {
    title: "SVG to PNG / JPG / WebP Converter — MegaTools",
    description: "Free in-browser SVG rasterizer and upscaler.",
  },
};

export default function SvgConverterPage() {
  return <SvgConverterClient />;
}
