import type { Metadata } from "next";
import UUIDClient from "./UUIDClient";

export const metadata: Metadata = {
  title: "UUID Generator — MegaTools",
  description:
    "Generate UUID v4 identifiers instantly. Single or bulk generation. One click to copy.",
  openGraph: {
    title: "UUID Generator — MegaTools",
    description: "Free UUID v4 generator.",
  },
};

export default function UUIDGeneratorPage() {
  return <UUIDClient />;
}
