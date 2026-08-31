import type { Metadata } from "next";
import MarkdownTableClient from "./MarkdownTableClient";

export const metadata: Metadata = {
  title: "Markdown Table Generator & Editor — MegaTools",
  description:
    "Interactive visual matrix table editor for generating Markdown Tables, HTML tables, and LaTeX tables in real-time.",
  openGraph: {
    title: "Markdown Table Generator & Editor — MegaTools",
    description: "Generate and format Markdown, HTML, and LaTeX tables visually in your browser.",
  },
};

export default function MarkdownTablePage() {
  return <MarkdownTableClient />;
}
