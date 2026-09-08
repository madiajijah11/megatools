import type { Metadata } from "next";
import DataUrlClient from "./DataUrlClient";

export const metadata: Metadata = {
  title: "Base64 Data URL & Asset Embedder — MegaTools",
  description:
    "Convert images, SVGs, fonts, and files into RFC 2397 Data URLs, CSS background-image code, and HTML tags with live size overhead metrics 100% in your browser.",
  keywords: [
    "data url generator",
    "base64 data uri converter",
    "embed image in css",
    "svg to data url",
    "image to base64 data url",
    "font to data url",
    "inline asset embedder",
    "data uri generator",
  ],
  openGraph: {
    title: "Base64 Data URL & Asset Embedder — MegaTools",
    description:
      "Transform images, fonts, and SVGs into Base64 Data URLs, CSS snippets, and HTML tags with live overhead metrics.",
  },
  alternates: {
    canonical: "/data-url",
  },
};

export default function DataUrlPage() {
  return <DataUrlClient />;
}
