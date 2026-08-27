import type { Metadata } from "next";
import CertInspectorClient from "./CertInspectorClient";

export const metadata: Metadata = {
  title: "SSL / X.509 Certificate Inspector — MegaTools",
  description:
    "Parse and inspect X.509 SSL/TLS certificates and CSRs (PEM format) in your browser. 100% private.",
  openGraph: {
    title: "Certificate Inspector — MegaTools",
    description: "Free in-browser X.509 SSL certificate and SANs parser.",
  },
};

export default function CertInspectorPage() {
  return <CertInspectorClient />;
}
