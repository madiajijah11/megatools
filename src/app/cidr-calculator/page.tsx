import type { Metadata } from "next";
import CidrCalculatorClient from "./CidrCalculatorClient";

export const metadata: Metadata = {
  title: "CIDR Calculator — MegaTools",
  description:
    "IPv4 subnet calculator: network, broadcast, netmask, wildcard, host range and class — all computed in your browser.",
  openGraph: {
    title: "CIDR Calculator — MegaTools",
    description: "Free browser-side IPv4 CIDR subnet calculator.",
  },
};

export default function CidrCalculatorPage() {
  return <CidrCalculatorClient />;
}
