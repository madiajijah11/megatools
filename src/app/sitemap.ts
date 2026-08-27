import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tool-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://megatools-tau.vercel.app";
  const pages = ["", "/about", "/privacy", "/terms", ...TOOLS.map((t) => t.href)];

  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "" ? 1.0 : 0.8,
  }));
}
