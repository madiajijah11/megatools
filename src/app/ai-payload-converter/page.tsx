import type { Metadata } from "next";
import AiPayloadConverterClient from "./AiPayloadConverterClient";

export const metadata: Metadata = {
  title: "Universal AI Payload & Multi-Provider SDK Exporter — MegaTools",
  description:
    "Convert prompt and parameters into official JSON payloads and SDK code for OpenAI, Anthropic Claude, Google Gemini, DeepSeek, and Ollama 100% in your browser.",
  openGraph: {
    title: "Universal AI Payload & SDK Exporter",
    description: "Instant in-browser multi-provider AI prompt to API payload & SDK code generator.",
  },
};

export default function AiPayloadConverterPage() {
  return <AiPayloadConverterClient />;
}
