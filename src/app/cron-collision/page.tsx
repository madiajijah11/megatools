import type { Metadata } from "next";
import CronCollisionClient from "./CronCollisionClient";

export const metadata: Metadata = {
  title: "Distributed Cron Collision & Thundering Herd Analyzer — MegaTools",
  description:
    "Analyze multi-job cron fleets, detect high-concurrency thundering herd collisions on databases and APIs, visualize 24-hour execution heatmaps, and auto-jitter cron schedules.",
  keywords: [
    "cron collision analyzer",
    "thundering herd detector",
    "cron jitter optimizer",
    "crontab concurrency analyzer",
    "kubernetes cronjob schedule optimizer",
    "multi cron job visualizer",
    "distributed cron overlap checker",
    "celery beat schedule collision",
    "devops cron audit tool",
    "database spike cron analyzer",
  ],
  alternates: {
    canonical: "/cron-collision",
  },
  openGraph: {
    title: "Distributed Cron Collision & Thundering Herd Analyzer — MegaTools",
    description:
      "Detect overlapping cron jobs causing database bottlenecks and server spikes. Visual 24-hour concurrency heatmaps and 1-click schedule de-collision optimizer.",
    url: "https://megatools-tau.vercel.app/cron-collision",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Distributed Cron Collision & Thundering Herd Analyzer",
  url: "https://megatools-tau.vercel.app/cron-collision",
  description:
    "Free client-side DevOps analyzer to detect schedule collisions, thundering herd spikes, and concurrency bottlenecks across multi-job crontabs and Kubernetes CronJobs.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function CronCollisionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CronCollisionClient />
    </>
  );
}
