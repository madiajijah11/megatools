import type { Metadata } from "next";
import ScreenRecorderClient from "./ScreenRecorderClient";

export const metadata: Metadata = {
  title: "Screen & Audio Recorder — MegaTools",
  description:
    "Record your screen, browser tab, or app window with microphone audio directly in your browser. 100% private, zero uploads.",
  alternates: {
    canonical: "/screen-recorder",
  },
  openGraph: {
    title: "Screen Recorder — MegaTools",
    description: "Free in-browser screen and audio recorder. No software install required.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Screen & Audio Recorder",
  url: "https://megatools-tau.vercel.app/screen-recorder",
  description: "Record your screen, browser tab, or app window with microphone audio. 100% private, zero uploads.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ScreenRecorderPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScreenRecorderClient />
    </>
  );
}
