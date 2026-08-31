import type { Metadata } from "next";
import TotpGeneratorClient from "./TotpGeneratorClient";

export const metadata: Metadata = {
  title: "TOTP 2FA Authenticator Simulator & Secret Tester — MegaTools",
  description:
    "Generate standard 6-digit Time-Based One-Time Passwords (TOTP RFC 6238) from Base32 secret keys or otpauth:// URIs directly in your browser.",
  openGraph: {
    title: "TOTP 2FA Authenticator Simulator — MegaTools",
    description: "Simulate Google Authenticator 2FA tokens and test secret keys client-side.",
  },
};

export default function TotpPage() {
  return <TotpGeneratorClient />;
}
