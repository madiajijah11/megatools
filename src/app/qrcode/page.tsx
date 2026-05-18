import type { Metadata } from "next";
import QRClient from "./QRClient";

export const metadata: Metadata = {
  title: "QR Code Generator — MegaTools",
  description:
    "Generate QR codes from text or URLs. Download as PNG. Free, instant, privacy-first.",
  openGraph: {
    title: "QR Code Generator — MegaTools",
    description: "Free QR code generator.",
  },
};

export default function QRPage() {
  return <QRClient />;
}
