import type { Metadata } from "next";
import RobotsGeneratorClient from "./RobotsGeneratorClient";

export const metadata: Metadata = {
  title: "Robots.txt Generator & URL Match Tester — MegaTools",
  description:
    "Construct standard robots.txt files with AI bot blocking (GPTBot, ClaudeBot), crawl delays, and live URL matching simulation client-side.",
  keywords: [
    "robots.txt generator",
    "robots.txt tester",
    "block ai bots robots.txt",
    "block gptbot claudebot",
    "seo robots.txt builder",
    "url path match tester robots"
  ],
  alternates: {
    canonical: "/robots-generator",
  },
  openGraph: {
    title: "Robots.txt Generator & URL Match Tester — MegaTools",
    description:
      "Generate standard robots.txt files and test path matching rules in real-time with zero server leakage.",
    url: "https://megatools-tau.vercel.app/robots-generator",
    type: "website",
  },
};

export default function RobotsGeneratorPage() {
  return <RobotsGeneratorClient />;
}
