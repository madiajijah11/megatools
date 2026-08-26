import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tool-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://megatools.vercel.app";
  const pages = ["", ...TOOLS.map((t) => t.href)];

  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "" ? 1.0 : 0.8,
  }));
}
