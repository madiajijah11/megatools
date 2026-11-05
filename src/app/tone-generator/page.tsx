import type { Metadata } from "next";
import ToneGeneratorClient from "./ToneGeneratorClient";

export const metadata: Metadata = {
  title: "Web Audio Tone & Frequency Synthesizer — MegaTools",
  description:
    "Generate pure audio tones (20Hz - 20,000Hz), binaural beats, white/pink/brown noise, and inspect live waveforms on an oscilloscope 100% in your browser.",
  keywords: [
    "tone generator",
    "frequency generator",
    "online audio synthesizer",
    "binaural beats generator",
    "white noise generator",
    "pink noise online",
    "440hz tone generator",
    "audio oscilloscope",
  ],
  openGraph: {
    title: "Web Audio Tone & Frequency Synthesizer — MegaTools",
    description:
      "Generate acoustic frequencies, binaural beats, and colored noise with a real-time oscilloscope.",
  },
  alternates: {
    canonical: "/tone-generator",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Web Audio Tone & Frequency Synthesizer",
  url: "https://megatools-tau.vercel.app/tone-generator",
  description: "Generate pure acoustic frequencies (20Hz - 20kHz), binaural beats, and colored noise (white, pink, brown) with a live oscilloscope.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function ToneGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToneGeneratorClient />
    </>
  );
}
