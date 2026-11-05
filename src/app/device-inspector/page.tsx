import type { Metadata } from "next";
import DeviceInspectorClient from "./DeviceInspectorClient";

export const metadata: Metadata = {
  title: "Browser & Device Inspector (Client Specs) — MegaTools",
  description:
    "Inspect your browser hardware concurrency, GPU WebGL renderer, display DPI, network status, battery level, and client fingerprints in real-time.",
  alternates: {
    canonical: "/device-inspector",
  },
  openGraph: {
    title: "Browser & Device Inspector — MegaTools",
    description: "Inspect browser, hardware, WebGL GPU, screen, and client specs privately in your browser.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Browser & Device Inspector",
  url: "https://megatools-tau.vercel.app/device-inspector",
  description: "Inspect browser hardware concurrency, GPU WebGL renderer, display DPI, network status, and battery level.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function DeviceInspectorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DeviceInspectorClient />
    </>
  );
}
