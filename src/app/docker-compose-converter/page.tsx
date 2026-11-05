import type { Metadata } from "next";
import DockerComposeConverterClient from "./DockerComposeConverterClient";

export const metadata: Metadata = {
  title: "Docker Run to Docker Compose Converter — MegaTools",
  description:
    "Convert docker run CLI commands into clean, production-ready docker-compose.yml configuration files instantly in your browser.",
  alternates: {
    canonical: "/docker-compose-converter",
  },
  openGraph: {
    title: "Docker Run to Docker Compose Converter — MegaTools",
    description: "Convert docker run commands to docker-compose.yml files client-side.",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Docker Run to Docker Compose Converter",
  url: "https://megatools-tau.vercel.app/docker-compose-converter",
  description: "Convert docker run CLI commands into clean, production-ready docker-compose.yml configuration files.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function DockerComposePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DockerComposeConverterClient />
    </>
  );
}
