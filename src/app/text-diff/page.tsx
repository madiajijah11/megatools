import type { Metadata } from "next";
import DiffClient from "./DiffClient";

export const metadata: Metadata = {
  title: "Text Diff Checker — MegaTools",
  description:
    "Compare two texts and see the differences highlighted line by line. Free, fast, runs in your browser.",
  openGraph: {
    title: "Text Diff Checker — MegaTools",
    description: "Free text diff checker.",
  },
};

export default function TextDiffPage() {
  return <DiffClient />;
}
