import type { Metadata } from "next";
import DockerComposeConverterClient from "./DockerComposeConverterClient";

export const metadata: Metadata = {
  title: "Docker Run to Docker Compose Converter — MegaTools",
  description:
    "Convert docker run CLI commands into clean, production-ready docker-compose.yml configuration files instantly in your browser.",
  openGraph: {
    title: "Docker Run to Docker Compose Converter — MegaTools",
    description: "Convert docker run commands to docker-compose.yml files client-side.",
  },
};

export default function DockerComposePage() {
  return <DockerComposeConverterClient />;
}
