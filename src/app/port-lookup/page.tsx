import type { Metadata } from "next";
import PortLookupClient from "./PortLookupClient";

export const metadata: Metadata = {
  title: "Common Ports Reference — MegaTools",
  description:
    "Database of standard & security-sensitive TCP/UDP ports with service descriptions and vulnerability risk notes.",
  openGraph: {
    title: "Common Ports Reference — MegaTools",
    description: "Free in-browser TCP/UDP ports and security risk inspector.",
  },
};

export default function PortLookupPage() {
  return <PortLookupClient />;
}
