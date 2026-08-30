import type { Metadata } from "next";
import HttpStatusClient from "./HttpStatusClient";

export const metadata: Metadata = {
  title: "HTTP Status Codes & Headers Explorer — MegaTools",
  description:
    "Instant lookup directory for all HTTP status codes (1xx-5xx) and common HTTP request/response headers with RFC references.",
  openGraph: {
    title: "HTTP Status Codes & Headers Explorer — MegaTools",
    description: "Free in-browser searchable directory for HTTP status codes and headers.",
  },
};

export default function HttpStatusPage() {
  return <HttpStatusClient />;
}
