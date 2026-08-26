import type { Metadata } from "next";
import RegexTesterClient from "./RegexTesterClient";

export const metadata: Metadata = {
  title: "Regex Tester — MegaTools",
  description:
    "Test regular expressions live in your browser. Highlighted matches, capture groups, and match stats.",
  openGraph: {
    title: "Regex Tester — MegaTools",
    description: "Free online regex tester with live highlighting.",
  },
};

export default function RegexTesterPage() {
  return <RegexTesterClient />;
}
