import type { Metadata } from "next";
import PasswordAnalyzerClient from "./PasswordAnalyzerClient";

export const metadata: Metadata = {
  title: "Password Entropy & Strength Analyzer — MegaTools",
  description:
    "Analyze password entropy, brute-force crack time, character pool distribution, and security weaknesses 100% locally in your browser.",
  openGraph: {
    title: "Password Entropy & Strength Analyzer — MegaTools",
    description: "Free in-browser password entropy and crack time estimator.",
  },
};

export default function PasswordAnalyzerPage() {
  return <PasswordAnalyzerClient />;
}
