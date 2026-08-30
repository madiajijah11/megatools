import type { Metadata } from "next";
import CssGeneratorClient from "./CssGeneratorClient";

export const metadata: Metadata = {
  title: "CSS Glassmorphism & Shadow Generator — MegaTools",
  description:
    "Generate modern CSS Glassmorphism, Box Shadows, Gradients, and Border Radius with interactive live preview.",
  openGraph: {
    title: "CSS Glassmorphism & Shadow Generator — MegaTools",
    description: "Free in-browser CSS and Tailwind style generator with interactive preview.",
  },
};

export default function CssGeneratorPage() {
  return <CssGeneratorClient />;
}
