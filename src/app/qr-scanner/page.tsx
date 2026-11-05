import type { Metadata } from "next";
import QrScannerClient from "./QrScannerClient";

export const metadata: Metadata = {
  title: "QR Scanner — MegaTools",
  description:
    "Decode QR codes from image files right in your browser. No uploads, no server.",
  alternates: {
    canonical: "/qr-scanner",
  },
  openGraph: {
    title: "QR Scanner — MegaTools",
    description: "Free browser-side QR code decoder.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QR Scanner",
  url: "https://megatools-tau.vercel.app/qr-scanner",
  description: "Decode QR codes from image files right in your browser. No uploads.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function QrScannerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <QrScannerClient />
    </>
  );
}
