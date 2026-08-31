import type { Metadata } from "next";
import ClipPathGeneratorClient from "./ClipPathGeneratorClient";

export const metadata: Metadata = {
  title: "CSS Clip-Path & Polygon Shape Generator — MegaTools",
  description:
    "Interactive visual drag-and-drop CSS clip-path polygon generator with presets for triangle, chevron, hexagon, star, trapezoid, and custom shapes.",
  openGraph: {
    title: "CSS Clip-Path & Polygon Shape Generator — MegaTools",
    description: "Generate modern CSS clip-path polygon shapes with real-time visual canvas.",
  },
};

export default function ClipPathPage() {
  return <ClipPathGeneratorClient />;
}
