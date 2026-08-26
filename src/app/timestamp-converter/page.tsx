import type { Metadata } from "next";
import TimestampConverterClient from "./TimestampConverterClient";

export const metadata: Metadata = {
  title: "Timestamp Converter — MegaTools",
  description:
    "Convert Unix timestamps to dates and back. Seconds or milliseconds, live local timezone output, relative time. Everything stays in your browser.",
  openGraph: {
    title: "Timestamp Converter — MegaTools",
    description: "Free Unix timestamp converter.",
  },
};

export default function TimestampConverterPage() {
  return <TimestampConverterClient />;
}
