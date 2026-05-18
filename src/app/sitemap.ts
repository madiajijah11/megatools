import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://megatools.vercel.app";
  const pages = [
    "",
    "/qrcode",
    "/json-formatter",
    "/password-generator",
    "/uuid-generator",
    "/base64",
    "/markdown-preview",
    "/image-compressor",
    "/text-diff",
  ];

  return pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: path === "" ? 1.0 : 0.8,
  }));
}
