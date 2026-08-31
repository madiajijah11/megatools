import type { Metadata } from "next";
import DeviceInspectorClient from "./DeviceInspectorClient";

export const metadata: Metadata = {
  title: "Browser & Device Inspector (Client Specs) — MegaTools",
  description:
    "Inspect your browser hardware concurrency, GPU WebGL renderer, display DPI, network status, battery level, and client fingerprints in real-time.",
  openGraph: {
    title: "Browser & Device Inspector — MegaTools",
    description: "Inspect browser, hardware, WebGL GPU, screen, and client specs privately in your browser.",
  },
};

export default function DeviceInspectorPage() {
  return <DeviceInspectorClient />;
}
