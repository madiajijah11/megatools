import type { Metadata } from "next";
import CronParserClient from "./CronParserClient";

export const metadata: Metadata = {
  title: "Cron Expression Generator & Parser — MegaTools",
  description:
    "Generate, parse, explain crontab schedules, and calculate upcoming execution times in your browser.",
  alternates: {
    canonical: "/cron-parser",
  },
  openGraph: {
    title: "Cron Expression Generator & Parser — MegaTools",
    description: "Free in-browser cron schedule builder, human-readable translator, and execution calculator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Cron Expression Generator & Parser",
  url: "https://megatools-tau.vercel.app/cron-parser",
  description: "Parse and explain crontab schedules in plain English and calculate upcoming execution dates.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function CronParserPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CronParserClient />
    </>
  );
}
