import type { Metadata } from "next";
import SqlToTsClient from "./SqlToTsClient";

export const metadata: Metadata = {
  title: "SQL DDL to TypeScript & Zod Schema — MegaTools",
  description: "Convert SQL CREATE TABLE statements (PostgreSQL, MySQL, SQLite) into TypeScript interfaces, types, and Zod schemas 100% in your browser.",
  keywords: [
    "sql-to-ts",
    "sql to typescript",
    "ddl to typescript interface",
    "sql to zod schema",
    "create table to ts",
    "postgres ddl to typescript",
    "developer tool",
    "megatools"
  ],
  alternates: {
    canonical: "/sql-to-ts",
  },
  openGraph: {
    title: "SQL DDL to TypeScript & Zod Schema — MegaTools",
    description: "Generate clean TypeScript interfaces and Zod validation schemas from SQL CREATE TABLE statements offline.",
    url: "https://megatools-tau.vercel.app/sql-to-ts",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SQL DDL to TypeScript & Zod Schema",
  url: "https://megatools-tau.vercel.app/sql-to-ts",
  description: "Convert SQL CREATE TABLE statements (PostgreSQL, MySQL, SQLite) into TypeScript interfaces, types, and Zod schemas.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function SqlToTsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SqlToTsClient />
    </>
  );
}
