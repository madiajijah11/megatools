import type { Metadata } from "next";
import UserAgentParserClient from "./UserAgentParserClient";

export const metadata: Metadata = {
  title: "User-Agent String Parser & Client Hints Inspector — MegaTools",
  description:
    "Parse User-Agent strings, detect browser versions, OS architecture, device models, and AI search crawler bots client-side.",
  keywords: [
    "user agent parser",
    "ua parser online",
    "detect browser from user agent",
    "bot crawler detector",
    "client hints inspector",
    "device detection user agent",
    "gptbot user agent test"
  ],
  alternates: {
    canonical: "/user-agent-parser",
  },
  openGraph: {
    title: "User-Agent String Parser & Client Hints Inspector — MegaTools",
    description:
      "Inspect browser engine, OS architecture, device model, and bot crawler identity from any User-Agent string.",
    url: "https://megatools-tau.vercel.app/user-agent-parser",
    type: "website",
  },
};

export default function UserAgentParserPage() {
  return <UserAgentParserClient />;
}
