import type { Metadata } from "next";
import CodeMinifierClient from "./CodeMinifierClient";

export const metadata: Metadata = {
  title: "HTML & CSS Minifier — MegaTools",
  description:
    "Minify or beautify HTML and CSS code in your browser. Strip comments and whitespace to boost web performance.",
  openGraph: {
    title: "HTML & CSS Minifier — MegaTools",
    description: "Free in-browser HTML and CSS minifier and formatter.",
  },
};

export default function CodeMinifierPage() {
  return <CodeMinifierClient />;
}
