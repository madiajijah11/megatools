import type { Metadata } from "next";
import ComposeVisualizerClient from "./ComposeVisualizerClient";

export const metadata: Metadata = {
  title: "Docker Compose Visualizer & Security Linter — MegaTools",
  description:
    "Parse docker-compose.yml files, visualize service topologies, networks, ports, and storage volumes, audit security risks (root user, 0.0.0.0 wildcard ports, privileged mode, missing limits), and generate 1-click hardened YAML and Mermaid architecture diagrams.",
  keywords: [
    "docker compose visualizer",
    "docker compose security linter",
    "compose security audit",
    "docker compose diagram generator",
    "docker compose to mermaid",
    "harden docker compose",
    "docker security scanner",
    "docker port exposure checker",
    "docker socket mount warning",
    "docker compose viewer online",
    "devops docker tools",
  ],
  alternates: {
    canonical: "/compose-visualizer",
  },
  openGraph: {
    title: "Docker Compose Visualizer & Security Linter — MegaTools",
    description:
      "Interactive Docker Compose topology visualizer, security vulnerability scanner, and 1-click production YAML hardening engine.",
    url: "https://megatools-tau.vercel.app/compose-visualizer",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Docker Compose Visualizer & Security Linter",
  url: "https://megatools-tau.vercel.app/compose-visualizer",
  description:
    "Free in-browser Docker Compose visualizer and security linter. Detect root users, wildcard port bindings, privileged containers, missing resource limits, and auto-generate hardened compose files and Mermaid diagrams.",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function ComposeVisualizerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ComposeVisualizerClient />
    </>
  );
}
