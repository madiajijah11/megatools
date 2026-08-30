import type { Metadata } from "next";
import JsonToTsClient from "./JsonToTsClient";

export const metadata: Metadata = {
  title: "JSON to TypeScript & Zod Schema — MegaTools",
  description:
    "Convert JSON into TypeScript interfaces, types, and Zod validation schemas instantly in your browser.",
  openGraph: {
    title: "JSON to TypeScript & Zod Schema — MegaTools",
    description: "Free in-browser JSON to TypeScript interface and Zod schema generator.",
  },
};

export default function JsonToTsPage() {
  return <JsonToTsClient />;
}
