import type { Metadata } from "next";
import AesCryptoClient from "./AesCryptoClient";

export const metadata: Metadata = {
  title: "AES Encrypt/Decrypt — MegaTools",
  description:
    "Encrypt and decrypt text with a passphrase using AES-256-GCM via the Web Crypto API. Everything runs in your browser — your passphrase and data never leave your device.",
  openGraph: {
    title: "AES Encrypt/Decrypt — MegaTools",
    description: "Passphrase encryption in your browser via Web Crypto.",
  },
};

export default function AesCryptoPage() {
  return <AesCryptoClient />;
}
