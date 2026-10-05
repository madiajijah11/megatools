import type { Metadata } from "next";
import SqlFormatterClient from "./SqlFormatterClient";

export const metadata: Metadata = {
  title: "SQL Formatter & Beautifier (PostgreSQL, MySQL, SQLite) — MegaTools",
  description:
    "Format, beautify, and minify SQL queries in your browser. Supports PostgreSQL beautifier, MySQL, SQLite, and Standard SQL with instant syntax highlighting.",
  keywords: [
    "postgresql beautifier",
    "mysql beautifier",
    "sql formatter online",
    "format sql query",
    "sql beautify",
    "sqlite query formatter",
    "sql minifier"
  ],
  alternates: {
    canonical: "/sql-formatter",
  },
  openGraph: {
    title: "SQL Formatter & Beautifier — MegaTools",
    description: "Free in-browser PostgreSQL, MySQL, and SQLite beautifier.",
    url: "https://megatools-tau.vercel.app/sql-formatter",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SQL Formatter & Beautifier",
  url: "https://megatools-tau.vercel.app/sql-formatter",
  description: "Client-side SQL formatting and beautifying tool for PostgreSQL, MySQL, and SQLite.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function SqlFormatterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SqlFormatterClient />
    </>
  );
}
