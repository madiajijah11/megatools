import type { Metadata } from "next";
import EmailDnsGeneratorClient from "./EmailDnsGeneratorClient";

export const metadata: Metadata = {
  title: "SPF, DKIM & DMARC DNS Record Generator — MegaTools",
  description:
    "Generate and configure DNS TXT records for SPF, DKIM, and DMARC email authentication to prevent spam and domain spoofing.",
  openGraph: {
    title: "SPF, DKIM & DMARC DNS Record Generator — MegaTools",
    description: "Generate compliant SPF, DKIM, and DMARC DNS security records client-side.",
  },
};

export default function EmailDnsPage() {
  return <EmailDnsGeneratorClient />;
}
