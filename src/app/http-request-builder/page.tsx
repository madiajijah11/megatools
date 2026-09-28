import type { Metadata } from "next";
import HttpRequestBuilderClient from "./HttpRequestBuilderClient";

export const metadata: Metadata = {
  title: "HTTP Request Builder — MegaTools",
  description: "Free client-side http request builder tool with zero data leakage.",
  keywords: ["http-request-builder", "http request builder", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/http-request-builder",
  },
  openGraph: {
    title: "HTTP Request Builder — MegaTools",
    description: "Free client-side http request builder tool.",
    url: "https://megatools-tau.vercel.app/http-request-builder",
    type: "website",
  },
};

export default function HttpRequestBuilderPage() {
  return <HttpRequestBuilderClient />;
}
