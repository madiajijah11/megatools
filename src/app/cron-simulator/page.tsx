import type { Metadata } from "next";
import CronSimulatorClient from "./CronSimulatorClient";

export const metadata: Metadata = {
  title: "Crontab Schedule Visualizer & Next 20 Executions Calendar — MegaTools",
  description:
    "Simulate cron schedules, calculate next 20 upcoming execution timestamps in local/UTC time, and visualize active hours heatmap client-side.",
  keywords: [
    "cron simulator",
    "crontab visualizer",
    "cron next executions calculator",
    "cron expression tester",
    "cron schedule to english",
    "linux crontab simulator"
  ],
  alternates: {
    canonical: "/cron-simulator",
  },
  openGraph: {
    title: "Crontab Schedule Visualizer & Next 20 Executions Calendar — MegaTools",
    description:
      "Visualize crontab schedules, countdown to next trigger, and calculate the next 20 execution timestamps client-side with zero data leakage.",
    url: "https://megatools-tau.vercel.app/cron-simulator",
    type: "website",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Crontab Schedule Visualizer & Next 20 Executions Calendar",
  url: "https://megatools-tau.vercel.app/cron-simulator",
  description: "Simulate cron schedules, calculate next 20 upcoming execution timestamps in local/UTC time, and visualize active hours heatmap.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function CronSimulatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CronSimulatorClient />
    </>
  );
}
