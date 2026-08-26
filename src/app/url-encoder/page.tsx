import type { Metadata } from "next";
import UrlEncoderClient from "./UrlEncoderClient";

export const metadata: Metadata = {
  title: "URL Encoder/Decoder — MegaTools",
  description:
    "Encode text for URLs or decode percent-encoded strings back to readable text. Free, instant, runs in your browser.",
  openGraph: {
    title: "URL Encoder/Decoder — MegaTools",
    description: "Free URL encoder and decoder.",
  },
};

export default function UrlEncoderPage() {
  return <UrlEncoderClient />;
}
