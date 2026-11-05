import type { Metadata } from "next";
import TotpGeneratorClient from "./TotpGeneratorClient";

export const metadata: Metadata = {
  title: "TOTP 2FA Authenticator Simulator & Secret Tester — MegaTools",
  description:
    "Generate standard 6-digit Time-Based One-Time Passwords (TOTP RFC 6238) from Base32 secret keys or otpauth:// URIs directly in your browser.",
  alternates: {
    canonical: "/totp-generator",
  },
  openGraph: {
    title: "TOTP 2FA Authenticator Simulator — MegaTools",
    description: "Simulate Google Authenticator 2FA tokens and test secret keys client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TOTP 2FA Authenticator Simulator",
  url: "https://megatools-tau.vercel.app/totp-generator",
  description: "Generate standard 6-digit Time-Based One-Time Passwords (RFC 6238) from Base32 secret keys or otpauth:// URIs.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function TotpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TotpGeneratorClient />
    </>
  );
}
