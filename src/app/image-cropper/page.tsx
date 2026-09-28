import type { Metadata } from "next";
import ImageCropperClient from "./ImageCropperClient";

export const metadata: Metadata = {
  title: "Image Cropper & Resizer — MegaTools",
  description: "Free client-side image cropper & resizer tool with zero data leakage.",
  keywords: ["image-cropper", "image cropper & resizer", "developer tool", "online tool", "megatools"],
  alternates: {
    canonical: "/image-cropper",
  },
  openGraph: {
    title: "Image Cropper & Resizer — MegaTools",
    description: "Free client-side image cropper & resizer tool.",
    url: "https://megatools-tau.vercel.app/image-cropper",
    type: "website",
  },
};

export default function ImageCropperPage() {
  return <ImageCropperClient />;
}
