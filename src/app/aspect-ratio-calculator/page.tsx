import type { Metadata } from "next";
import AspectRatioCalculatorClient from "./AspectRatioCalculatorClient";

export const metadata: Metadata = {
  title: "Aspect Ratio & Resolution Calculator — MegaTools",
  description:
    "Calculate aspect ratios (16:9, 4:3, 21:9, 1:1), scale dimensions proportionally, find greatest common divisors (GCD), and compute video bitrates.",
  openGraph: {
    title: "Aspect Ratio & Resolution Calculator — MegaTools",
    description: "Calculate aspect ratios, pixel scaling, and display dimensions client-side.",
  },
};

export default function AspectRatioPage() {
  return <AspectRatioCalculatorClient />;
}
