import type { Metadata } from "next";
import KeycodeTesterClient from "./KeycodeTesterClient";

export const metadata: Metadata = {
  title: "Keyboard Event & KeyCode Tester — MegaTools",
  description:
    "Test keyboard events in real time. Inspect event.key, event.code, keyCode, which, and modifier states in your browser.",
  alternates: {
    canonical: "/keycode-tester",
  },
  openGraph: {
    title: "Keyboard Event & KeyCode Tester — MegaTools",
    description: "Free in-browser interactive JavaScript keyboard event and keycode inspector.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Keyboard Event & KeyCode Tester",
  url: "https://megatools-tau.vercel.app/keycode-tester",
  description: "Interactive keyboard event inspector. Inspect event.key, code, legacy keyCode, and modifiers live.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function KeycodeTesterPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <KeycodeTesterClient />
    </>
  );
}
