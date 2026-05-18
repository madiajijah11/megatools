import type { Metadata } from "next";
import Base64Client from "./Base64Client";

export const metadata: Metadata = {
  title: "Base64 Encode/Decode — MegaTools",
  description:
    "Encode text to Base64 or decode Base64 back to readable text. Free, instant, runs in your browser.",
  openGraph: {
    title: "Base64 Encode/Decode — MegaTools",
    description: "Free Base64 encoder and decoder.",
  },
};

export default function Base64Page() {
  return <Base64Client />;
}
