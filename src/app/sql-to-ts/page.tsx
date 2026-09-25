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

export default function SqlToTsPage() {
  return <SqlToTsClient />;
}
