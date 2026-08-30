import type { Metadata } from "next";
import CurlConverterClient from "./CurlConverterClient";

export const metadata: Metadata = {
  title: "cURL to Code Converter — MegaTools",
  description:
    "Convert cURL commands to JavaScript fetch, Python requests, Axios, and Go net/http instantly in your browser.",
  openGraph: {
    title: "cURL to Code Converter — MegaTools",
    description: "Free in-browser cURL to JS, Python, Axios, and Go code generator.",
  },
};

export default function CurlConverterPage() {
  return <CurlConverterClient />;
}
