import type { Metadata } from "next";
import ColorConverterProClient from "./ColorConverterProClient";

export const metadata: Metadata = {
  title: "Color Converter & Palette Studio — MegaTools",
  description: "Free client-side color converter & palette studio tool with zero data leakage.",
  keywords: ["color-converter-pro", "color converter & palette studio", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/color-converter-pro",
  },
  openGraph: {
    title: "Color Converter & Palette Studio — MegaTools",
    description: "Free client-side color converter & palette studio tool.",
    url: "https://megatools-tau.vercel.app/color-converter-pro",
    type: "website",
  },
};

export default function ColorConverterProPage() {
  return <ColorConverterProClient />;
}
