import type { Metadata } from "next";
import ColorContrastClient from "./ColorContrastClient";

export const metadata: Metadata = {
  title: "Color Contrast & Palette Checker — MegaTools",
  description:
    "WCAG 2.1 accessibility contrast ratio checker (AA/AAA compliance) with HEX, RGB, and HSL conversions.",
  openGraph: {
    title: "Color Contrast Checker — MegaTools",
    description: "Free in-browser WCAG 2.1 color contrast and accessibility tester.",
  },
};

export default function ColorContrastPage() {
  return <ColorContrastClient />;
}
