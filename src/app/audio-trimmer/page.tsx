import type { Metadata } from "next";
import AudioTrimmerClient from "./AudioTrimmerClient";

export const metadata: Metadata = {
  title: "Audio Trimmer & Cutter (WAV, MP3, OGG Waveform Cutter) — MegaTools",
  description:
    "Free in-browser audio cutter & trimmer. Cut WAV, MP3, and OGG audio with an interactive visual waveform. 100% private, no server upload required.",
  keywords: [
    "wav cutter",
    "ogg cutter",
    "wav trimmer",
    "audio trimmer online",
    "mp3 cutter free",
    "waveform audio cutter",
    "browser audio editor"
  ],
  alternates: {
    canonical: "/audio-trimmer",
  },
  openGraph: {
    title: "Audio Trimmer & WAV Cutter — MegaTools",
    description: "Free in-browser audio waveform cutter and trimmer for WAV, MP3, and OGG.",
    url: "https://megatools-tau.vercel.app/audio-trimmer",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Audio Trimmer & Cutter",
  url: "https://megatools-tau.vercel.app/audio-trimmer",
  description: "Trim and cut audio files (WAV, MP3, OGG) with an interactive waveform generator.",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function AudioTrimmerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AudioTrimmerClient />
    </>
  );
}
