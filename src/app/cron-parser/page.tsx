import type { Metadata } from "next";
import CronParserClient from "./CronParserClient";

export const metadata: Metadata = {
  title: "Cron Expression Generator & Parser — MegaTools",
  description:
    "Generate, parse, explain crontab schedules, and calculate upcoming execution times in your browser.",
  openGraph: {
    title: "Cron Expression Generator & Parser — MegaTools",
    description: "Free in-browser cron schedule builder, human-readable translator, and execution calculator.",
  },
};

export default function CronParserPage() {
  return <CronParserClient />;
}
