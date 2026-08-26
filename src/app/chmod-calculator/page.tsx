import type { Metadata } from "next";
import ChmodCalculatorClient from "./ChmodCalculatorClient";

export const metadata: Metadata = {
  title: "Chmod Calculator — MegaTools",
  description:
    "Convert between chmod octal (755) and symbolic (rwxr-xr-x) file permissions. Includes setuid, setgid, and sticky bit. Runs entirely in your browser.",
  openGraph: {
    title: "Chmod Calculator — MegaTools",
    description: "Free chmod octal ↔ symbolic permission calculator.",
  },
};

export default function ChmodCalculatorPage() {
  return <ChmodCalculatorClient />;
}
