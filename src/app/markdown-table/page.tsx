import type { Metadata } from "next";
import MarkdownTableClient from "./MarkdownTableClient";

export const metadata: Metadata = {
  title: "Markdown Table Generator & Editor — MegaTools",
  description:
    "Interactive visual matrix table editor for generating Markdown Tables, HTML tables, and LaTeX tables in real-time.",
  alternates: {
    canonical: "/markdown-table",
  },
  openGraph: {
    title: "Markdown Table Generator & Editor — MegaTools",
    description: "Generate and format Markdown, HTML, and LaTeX tables visually in your browser.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Markdown Table Generator & Editor",
  url: "https://megatools-tau.vercel.app/markdown-table",
  description: "Interactive visual matrix table editor for generating Markdown, HTML, and LaTeX tables in real-time.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function MarkdownTablePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarkdownTableClient />
    </>
  );
}
