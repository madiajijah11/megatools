import type { Metadata } from "next";
import JsonToCsvClient from "./JsonToCsvClient";

export const metadata: Metadata = {
  title: "JSON to CSV / TSV Converter & Table Exporter — MegaTools",
  description:
    "Convert JSON arrays and nested objects into clean CSV or TSV spreadsheets with automatic key flattening and live table preview.",
  keywords: [
    "json to csv",
    "json to tsv",
    "json flatten to csv",
    "json table exporter",
    "convert json array to spreadsheet",
    "json to excel converter"
  ],
  alternates: {
    canonical: "/json-to-csv",
  },
  openGraph: {
    title: "JSON to CSV / TSV Converter & Table Exporter — MegaTools",
    description:
      "Transform JSON arrays and nested structures into CSV and TSV spreadsheets client-side with zero data leakage.",
    url: "https://megatools-tau.vercel.app/json-to-csv",
    type: "website",
  },
};

export default function JsonToCsvPage() {
  return <JsonToCsvClient />;
}
