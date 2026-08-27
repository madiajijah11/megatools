import type { Metadata } from "next";
import SecurityHeadersClient from "./SecurityHeadersClient";

export const metadata: Metadata = {
  title: "Security Headers Generator — MegaTools",
  description:
    "Generate hardened HTTP security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy) for Nginx, Vercel, Apache, and Caddy.",
  openGraph: {
    title: "Security Headers Generator — MegaTools",
    description: "Free in-browser HTTP security headers config generator.",
  },
};

export default function SecurityHeadersPage() {
  return <SecurityHeadersClient />;
}
