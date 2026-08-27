import type { Metadata } from "next";
import YamlJsonClient from "./YamlJsonClient";

export const metadata: Metadata = {
  title: "YAML ↔ JSON Converter — MegaTools",
  description:
    "Convert between YAML and JSON formats with live validation and line-number error reporting in your browser.",
  openGraph: {
    title: "YAML ↔ JSON Converter — MegaTools",
    description: "Free in-browser bidirectional YAML to JSON converter.",
  },
};

export default function YamlJsonPage() {
  return <YamlJsonClient />;
}
