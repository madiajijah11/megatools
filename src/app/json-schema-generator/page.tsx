import type { Metadata } from "next";
import JsonSchemaGeneratorClient from "./JsonSchemaGeneratorClient";

export const metadata: Metadata = {
  title: "JSON to JSON Schema Generator — MegaTools",
  description:
    "Instantly generate Draft-07 and 2020-12 JSON Schema validation schemas from JSON sample data directly in your browser.",
  openGraph: {
    title: "JSON to JSON Schema Generator — MegaTools",
    description: "Generate standard JSON Schema validation structures client-side.",
  },
};

export default function JsonSchemaPage() {
  return <JsonSchemaGeneratorClient />;
}
