import type { Metadata } from "next";
import JwtDecoderClient from "./JwtDecoderClient";

export const metadata: Metadata = {
  title: "JWT Decoder — MegaTools",
  description:
    "Decode JWT header and payload instantly. Inspect claims and check token expiry (exp) right in your browser.",
  openGraph: {
    title: "JWT Decoder — MegaTools",
    description: "Decode JWT header/payload and check expiry in your browser.",
  },
};

export default function JwtDecoderPage() {
  return <JwtDecoderClient />;
}
