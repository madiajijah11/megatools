import type { Metadata } from "next";
import MarkdownClient from "./MarkdownClient";

export const metadata: Metadata = {
  title: "Markdown Preview — MegaTools",
  description:
    "Write Markdown (.md) or MDX (.mdx) and see the rendered preview side by side. Free, instant, runs in your browser.",
  openGraph: {
    title: "Markdown Preview — MegaTools",
    description: "Free live Markdown and MDX preview editor with JSX support.",
  },
};

export default function MarkdownPreviewPage() {
  return <MarkdownClient />;
}
