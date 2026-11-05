import type { Metadata } from "next";
import MarkdownClient from "./MarkdownClient";

export const metadata: Metadata = {
  title: "Markdown Preview — MegaTools",
  description:
    "Write Markdown (.md) or MDX (.mdx) and see the rendered preview side by side. Free, instant, runs in your browser.",
  alternates: {
    canonical: "/markdown-preview",
  },
  openGraph: {
    title: "Markdown Preview — MegaTools",
    description: "Free live Markdown and MDX preview editor with JSX support.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Markdown Preview",
  url: "https://megatools-tau.vercel.app/markdown-preview",
  description: "Write Markdown and see the rendered HTML preview side by side. Supports both .md and .mdx formats.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function MarkdownPreviewPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarkdownClient />
    </>
  );
}
