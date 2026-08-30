import type { Metadata } from "next";
import OgPreviewerClient from "./OgPreviewerClient";

export const metadata: Metadata = {
  title: "OpenGraph & Social Meta Tag Previewer — MegaTools",
  description:
    "Preview social share cards for Google, Twitter/X, Discord, Facebook, and generate HTML & Next.js metadata tags.",
  openGraph: {
    title: "OpenGraph & Social Meta Tag Previewer — MegaTools",
    description: "Free in-browser OpenGraph card previewer and meta tag generator.",
  },
};

export default function OgPreviewerPage() {
  return <OgPreviewerClient />;
}
