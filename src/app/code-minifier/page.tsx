import type { Metadata } from "next";
import CodeMinifierClient from "./CodeMinifierClient";

export const metadata: Metadata = {
  title: "HTML & CSS Minifier — MegaTools",
  description:
    "Minify or beautify HTML and CSS code in your browser. Strip comments and whitespace to boost web performance.",
  alternates: {
    canonical: "/code-minifier",
  },
  openGraph: {
    title: "HTML & CSS Minifier — MegaTools",
    description: "Free in-browser HTML and CSS minifier and formatter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HTML & CSS Minifier",
  url: "https://megatools-tau.vercel.app/code-minifier",
  description: "Minify or beautify HTML and CSS code to optimize website load speeds and strip unnecessary bytes.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function CodeMinifierPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CodeMinifierClient />
    </>
  );
}
