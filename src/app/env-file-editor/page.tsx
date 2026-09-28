import type { Metadata } from "next";
import EnvFileEditorClient from "./EnvFileEditorClient";

export const metadata: Metadata = {
  title: "Environment File Editor & Sanitizer — MegaTools",
  description: "Free client-side environment file editor & sanitizer tool with zero data leakage.",
  keywords: ["env-file-editor", "environment file editor & sanitizer", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/env-file-editor",
  },
  openGraph: {
    title: "Environment File Editor & Sanitizer — MegaTools",
    description: "Free client-side environment file editor & sanitizer tool.",
    url: "https://megatools-tau.vercel.app/env-file-editor",
    type: "website",
  },
};

export default function EnvFileEditorPage() {
  return <EnvFileEditorClient />;
}
