import type { Metadata } from "next";
import Ipv6CalculatorClient from "./Ipv6CalculatorClient";

export const metadata: Metadata = {
  title: "IPv6 & Subnet Calculator — MegaTools",
  description:
    "Calculate IPv6 subnets, expand/compress addresses, compute reverse DNS ip6.arpa, and inspect address scopes in your browser.",
  openGraph: {
    title: "IPv6 & Subnet Calculator — MegaTools",
    description: "Free in-browser IPv6 subnet and prefix calculator.",
  },
};

export default function Ipv6CalculatorPage() {
  return <Ipv6CalculatorClient />;
}
