import type { Metadata } from "next";
import QRClient from "./QRClient";

export const metadata: Metadata = {
  title: "QR Code Generator — MegaTools",
  description:
    "Generate QR codes from text or URLs. Download as PNG. Free, instant, privacy-first.",
  alternates: {
    canonical: "/qrcode",
  },
  openGraph: {
    title: "QR Code Generator — MegaTools",
    description: "Free QR code generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QR Code Generator",
  url: "https://megatools-tau.vercel.app/qrcode",
  description: "Generate QR codes from text, URLs, or any data. Download as PNG instantly.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function QRPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <QRClient />
    </>
  );
}
