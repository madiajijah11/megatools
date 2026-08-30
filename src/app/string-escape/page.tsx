import type { Metadata } from "next";
import StringEscapeClient from "./StringEscapeClient";

export const metadata: Metadata = {
  title: "String & Regex Escaper / Unescaper — MegaTools",
  description:
    "Escape and unescape strings for JSON, JavaScript, SQL, Regular Expressions, Shell, and HTML in your browser.",
  openGraph: {
    title: "String & Regex Escaper / Unescaper — MegaTools",
    description: "Free in-browser string and regex escaper/unescaper for developers.",
  },
};

export default function StringEscapePage() {
  return <StringEscapeClient />;
}
