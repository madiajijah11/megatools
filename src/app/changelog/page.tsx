import type { Metadata } from "next";
import ChangelogClient from "./ChangelogClient";

export const metadata: Metadata = {
  title: "Changelog & Updates — MegaTools",
  description:
    "See what's new in MegaTools. Track newly added tools, major updates, UI improvements, and bug fixes across all 65+ browser-based utilities.",
  openGraph: {
    title: "MegaTools Changelog & Updates",
    description: "Latest tools, feature improvements, and releases on MegaTools.",
  },
};

export default function ChangelogPage() {
  return <ChangelogClient />;
}
