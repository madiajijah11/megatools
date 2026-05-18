import type { Metadata } from "next";
import JSONClient from "./JSONClient";

export const metadata: Metadata = {
  title: "JSON Formatter — MegaTools",
  description:
    "Format, minify, and validate JSON data instantly. Free, fast, runs in your browser.",
  openGraph: {
    title: "JSON Formatter — MegaTools",
    description: "Free JSON formatter, minifier, and validator.",
  },
};

export default function JSONFormatterPage() {
  return <JSONClient />;
}
