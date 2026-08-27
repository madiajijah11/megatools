import type { Metadata } from "next";
import AudioTrimmerClient from "./AudioTrimmerClient";

export const metadata: Metadata = {
  title: "Audio Trimmer & Cutter — MegaTools",
  description:
    "Trim and cut MP3, WAV, and OGG audio clips with a visual waveform in your browser. 100% private.",
  openGraph: {
    title: "Audio Trimmer — MegaTools",
    description: "Free in-browser audio waveform cutter and trimmer.",
  },
};

export default function AudioTrimmerPage() {
  return <AudioTrimmerClient />;
}
