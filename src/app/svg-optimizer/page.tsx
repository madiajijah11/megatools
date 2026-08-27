import type { Metadata } from "next";
import SvgOptimizerClient from "./SvgOptimizerClient";

export const metadata: Metadata = {
  title: "SVG Optimizer & Cleaner — MegaTools",
  description:
    "Clean, minify, and strip bloat from SVG vector files in your browser. Remove editor metadata and reduce file size.",
  openGraph: {
    title: "SVG Optimizer — MegaTools",
    description: "Free in-browser SVG vector cleaner and optimizer.",
  },
};

export default function SvgOptimizerPage() {
  return <SvgOptimizerClient />;
}
