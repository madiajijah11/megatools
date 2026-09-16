import type { Metadata } from "next";
import RegexExplainerClient from "./RegexExplainerClient";

export const metadata: Metadata = {
  title: "Regex Visual Explainer & AST Token Breakdown — MegaTools",
  description:
    "Deconstruct regular expressions into clear plain-English token explanations, lookarounds, capture groups, and quantifier breakdowns client-side.",
  keywords: [
    "regex explainer",
    "regex to english",
    "explain regular expression online",
    "regex token visualizer",
    "regex ast breakdown",
    "regex tutor tool"
  ],
  alternates: {
    canonical: "/regex-explainer",
  },
  openGraph: {
    title: "Regex Visual Explainer & AST Token Breakdown — MegaTools",
    description:
      "Understand complex regular expressions with step-by-step token breakdowns and plain English explanations with zero data leakage.",
    url: "https://megatools-tau.vercel.app/regex-explainer",
    type: "website",
  },
};

export default function RegexExplainerPage() {
  return <RegexExplainerClient />;
}
