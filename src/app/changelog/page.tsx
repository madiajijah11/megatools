import type { Metadata } from "next";
import ChangelogClient from "./ChangelogClient";

export const metadata: Metadata = {
  title: "Changelog & Updates — MegaTools",
  description:
    "See what's new in MegaTools. Track newly added tools, major updates, UI improvements, and bug fixes across all 65+ browser-based utilities.",
  alternates: {
    canonical: "/changelog",
  },
  openGraph: {
    title: "MegaTools Changelog & Updates",
    description: "Latest tools, feature improvements, and releases on MegaTools.",
    url: "https://megatools-tau.vercel.app/changelog",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "MegaTools Changelog & Updates",
  url: "https://megatools-tau.vercel.app/changelog",
  description: "Track newly added tools, major updates, and bug fixes across all browser-based utilities.",
};

export default function ChangelogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ChangelogClient />
    </>
  );
}
