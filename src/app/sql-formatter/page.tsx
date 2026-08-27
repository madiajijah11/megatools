import type { Metadata } from "next";
import SqlFormatterClient from "./SqlFormatterClient";

export const metadata: Metadata = {
  title: "SQL Formatter & Beautifier — MegaTools",
  description:
    "Format, beautify, and minify SQL queries in your browser. Supports PostgreSQL, MySQL, SQLite, and Standard SQL.",
  openGraph: {
    title: "SQL Formatter — MegaTools",
    description: "Free in-browser SQL beautifier and minifier.",
  },
};

export default function SqlFormatterPage() {
  return <SqlFormatterClient />;
}
