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

export default function ToneGeneratorPage() {
  return <ToneGeneratorClient />;
}
