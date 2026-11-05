import type { Metadata } from "next";
import PasswordClient from "./PasswordClient";

export const metadata: Metadata = {
  title: "Password Generator — MegaTools",
  description:
    "Create strong, random passwords with custom length and character sets. Free and privacy-first.",
  alternates: {
    canonical: "/password-generator",
  },
  openGraph: {
    title: "Password Generator — MegaTools",
    description: "Free secure password generator.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Password Generator",
  url: "https://megatools-tau.vercel.app/password-generator",
  description: "Create strong, random passwords with custom length and character sets.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function PasswordGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PasswordClient />
    </>
  );
}
