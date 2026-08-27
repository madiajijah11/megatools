import type { Metadata } from "next";
import ScreenRecorderClient from "./ScreenRecorderClient";

export const metadata: Metadata = {
  title: "Screen & Audio Recorder — MegaTools",
  description:
    "Record your screen, browser tab, or app window with microphone audio directly in your browser. 100% private, zero uploads.",
  openGraph: {
    title: "Screen Recorder — MegaTools",
    description: "Free in-browser screen and audio recorder. No software install required.",
  },
};

export default function ScreenRecorderPage() {
  return <ScreenRecorderClient />;
}
