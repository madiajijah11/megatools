import type { Metadata } from "next";
import HtmlToJsxClient from "./HtmlToJsxClient";

export const metadata: Metadata = {
  title: "HTML / SVG to JSX Converter — MegaTools",
  description:
    "Convert raw HTML and SVG code into React and Next.js compatible JSX instantly in your browser.",
  openGraph: {
    title: "HTML / SVG to JSX Converter — MegaTools",
    description: "Free in-browser HTML & SVG to React JSX converter.",
  },
};

export default function HtmlToJsxPage() {
  return <HtmlToJsxClient />;
}
