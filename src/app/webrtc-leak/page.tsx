import type { Metadata } from "next";
import WebRTCLeakClient from "./WebRTCLeakClient";

export const metadata: Metadata = {
  title: "WebRTC IP Leak & VPN Shield Tester — MegaTools",
  description:
    "Test if your real public or local IP address leaks through WebRTC STUN requests. Verify VPN security, inspect ICE candidates, and harden browser privacy.",
  keywords: [
    "webrtc leak test",
    "vpn leak test",
    "webrtc ip leak checker",
    "stun ice candidate inspector",
    "browser ip leak detector",
    "vpn shield test",
    "local ip leak check",
    "private ip leak webrtc",
  ],
  openGraph: {
    title: "WebRTC IP Leak & VPN Shield Tester — MegaTools",
    description:
      "Detect if your real public or private IP leaks through WebRTC STUN requests. Test VPN shielding and inspect ICE candidates.",
  },
  alternates: {
    canonical: "/webrtc-leak",
  },
};


const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "WebRTC IP Leak & VPN Shield Tester",
  url: "https://megatools-tau.vercel.app/webrtc-leak",
  description: "Detect if your real public or local IP address leaks through WebRTC STUN requests even while using a VPN or proxy.",
  applicationCategory: "UtilityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
export default function WebRTCLeakPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WebRTCLeakClient />
    </>
  );
}
