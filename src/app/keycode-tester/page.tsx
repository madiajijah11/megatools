import type { Metadata } from "next";
import KeycodeTesterClient from "./KeycodeTesterClient";

export const metadata: Metadata = {
  title: "Keyboard Event & KeyCode Tester — MegaTools",
  description:
    "Test keyboard events in real time. Inspect event.key, event.code, keyCode, which, and modifier states in your browser.",
  openGraph: {
    title: "Keyboard Event & KeyCode Tester — MegaTools",
    description: "Free in-browser interactive JavaScript keyboard event and keycode inspector.",
  },
};

export default function KeycodeTesterPage() {
  return <KeycodeTesterClient />;
}
