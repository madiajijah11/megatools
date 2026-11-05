import type { Metadata } from "next";
import PdfWatermarkClient from "./PdfWatermarkClient";

export const metadata: Metadata = {
  title: "PDF Watermark & Stamp Studio — MegaTools",
  description:
    "Add custom text watermarks ('CONFIDENTIAL', 'DRAFT', 'DO NOT COPY') across PDF pages with adjustable opacity, angle, and font size 100% in your browser.",
  keywords: [
    "pdf watermark tool",
    "stamp pdf online",
    "confidential watermark pdf",
    "add watermark to pdf",
    "pdf text overlay",
    "client-side pdf watermark",
    "rotate pdf watermark",
  ],
  openGraph: {
    title: "PDF Watermark & Stamp Studio — MegaTools",
    description:
      "Stamp custom diagonal or centered watermarks on PDF pages with adjustable angle, opacity, and color.",
  },
  alternates: {
    canonical: "/pdf-watermark",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Watermark & Stamp Studio",
  url: "https://megatools-tau.vercel.app/pdf-watermark",
  description: "Stamp diagonal or centered watermarks (",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PdfWatermarkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PdfWatermarkClient />
    </>
  );
}
