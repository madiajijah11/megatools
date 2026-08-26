import type { Metadata } from "next";
import QrScannerClient from "./QrScannerClient";

export const metadata: Metadata = {
  title: "QR Scanner — MegaTools",
  description:
    "Decode QR codes from image files right in your browser. No uploads, no server.",
  openGraph: {
    title: "QR Scanner — MegaTools",
    description: "Free browser-side QR code decoder.",
  },
};

export default function QrScannerPage() {
  return <QrScannerClient />;
}
