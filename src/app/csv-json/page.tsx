import type { Metadata } from "next";
import CsvJsonClient from "./CsvJsonClient";

export const metadata: Metadata = {
  title: "CSV ↔ JSON Converter — MegaTools",
  description:
    "Convert CSV to JSON and JSON to CSV in your browser with auto-delimiter detection. 100% private.",
  openGraph: {
    title: "CSV ↔ JSON Converter — MegaTools",
    description: "Free in-browser bidirectional CSV to JSON converter.",
  },
};

export default function CsvJsonPage() {
  return <CsvJsonClient />;
}
