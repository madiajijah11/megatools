import type { Metadata } from "next";
import TimestampConverterClient from "./TimestampConverterClient";

export const metadata: Metadata = {
  title: "Timestamp Converter — MegaTools",
  description:
    "Convert Unix timestamps to dates and back. Seconds or milliseconds, live local timezone output, relative time. Everything stays in your browser.",
  alternates: {
    canonical: "/timestamp-converter",
  },
  openGraph: {
    title: "Timestamp Converter — MegaTools",
    description: "Free Unix timestamp converter.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Timestamp Converter",
  url: "https://megatools-tau.vercel.app/timestamp-converter",
  description: "Convert Unix timestamps to dates and back, with relative time and live epoch.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function TimestampConverterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TimestampConverterClient />
    </>
  );
}
