import type { Metadata } from "next";
import TextTransformerClient from "./TextTransformerClient";

export const metadata: Metadata = {
  title: "Text Transformer — MegaTools",
  description:
    "Convert text case (UPPERCASE, camelCase, snake_case and more) and encode or decode HTML entities instantly in your browser.",
  openGraph: {
    title: "Text Transformer — MegaTools",
    description: "Case conversion and HTML entity encoding, all client-side.",
  },
};

export default function TextTransformerPage() {
  return <TextTransformerClient />;
}
