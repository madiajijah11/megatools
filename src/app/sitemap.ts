import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tool-data";
import { CHANGELOG_ITEMS } from "@/lib/changelog-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://megatools-tau.vercel.app";

  // Build map of toolHref -> latest changelog date
  const toolDateMap = new Map<string, string>();
  for (const item of CHANGELOG_ITEMS) {
    if (item.toolHref && !toolDateMap.has(item.toolHref)) {
      toolDateMap.set(item.toolHref, item.date);
    }
  }

  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/changelog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
  ];

  const defaultDate = new Date("2026-10-01T00:00:00.000Z");

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${base}${page.path}`,
    lastModified: page.path === "/changelog" && CHANGELOG_ITEMS.length > 0 
      ? new Date(`${CHANGELOG_ITEMS[0].date}T00:00:00.000Z`) 
      : defaultDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const toolEntries: MetadataRoute.Sitemap = TOOLS.map((tool) => {
    const changeDate = toolDateMap.get(tool.href);
    return {
      url: `${base}${tool.href}`,
      lastModified: changeDate ? new Date(`${changeDate}T00:00:00.000Z`) : defaultDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    };
  });

  return [...staticEntries, ...toolEntries];
}
