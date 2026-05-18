import type { Metadata } from "next";
import MarkdownClient from "./MarkdownClient";

export const metadata: Metadata = {
  title: "Markdown Preview — MegaTools",
  description:
    "Write Markdown and see the rendered HTML preview side by side. Free, instant, runs in your browser.",
  openGraph: {
    title: "Markdown Preview — MegaTools",
    description: "Free live Markdown preview editor.",
  },
};

export default function MarkdownPreviewPage() {
  return <MarkdownClient />;
}
