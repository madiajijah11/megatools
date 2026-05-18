import type { Metadata } from "next";
import PasswordClient from "./PasswordClient";

export const metadata: Metadata = {
  title: "Password Generator — MegaTools",
  description:
    "Create strong, random passwords with custom length and character sets. Free and privacy-first.",
  openGraph: {
    title: "Password Generator — MegaTools",
    description: "Free secure password generator.",
  },
};

export default function PasswordGeneratorPage() {
  return <PasswordClient />;
}
