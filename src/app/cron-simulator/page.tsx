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

export default function CronSimulatorPage() {
  return <CronSimulatorClient />;
}
