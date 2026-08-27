import type { Metadata } from "next";
import FaviconGeneratorClient from "./FaviconGeneratorClient";

export const metadata: Metadata = {
  title: "Favicon & App Icon Generator — MegaTools",
  description:
    "Generate standard website favicons and PWA app icons (16, 32, 48, 180, 192, 512px) in your browser. 100% private.",
  openGraph: {
    title: "Favicon Generator — MegaTools",
    description: "Free in-browser favicon and web app icon generator.",
  },
};

export default function FaviconGeneratorPage() {
  return <FaviconGeneratorClient />;
}
