import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QuickSwitchBar from "@/components/QuickSwitchBar";
import CopyButton from "@/components/CopyButton";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";

const SUPPORT_ADDRESSES = [
  { chain: "BTC", address: "bc1q3aej7x9wlvl54syt4qm48xcdn6zqa64cm6dwj6" },
  { chain: "ETH", address: "0xae69f5bcf7762bb5fe34d3832fd7d1954054674b" },
  { chain: "SOL", address: "6Et2XmHSdAD4QBR9Apdt9AVeJ77ktr1piV49q7RD4SLk" },
];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MegaTools — Free Online Tools for Everyone",
  description:
    "Free, fast, privacy-first online tools. QR Generator, JSON Formatter, Password Generator, UUID Generator, Base64, Markdown Preview, and more — all in your browser.",
  keywords: [
    "free online tools",
    "QR generator",
    "JSON formatter",
    "password generator",
    "UUID",
    "Base64",
    "developer tools",
  ],
  openGraph: {
    title: "MegaTools — Free Online Tools",
    description: "Free, fast, privacy-first tools for devs and everyone.",
  },
  verification: {
    google: "VNK6qw2Ov-15QBCr5sZYMYncz4GzXBmqcf1OZwBq2WE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-bg-page text-text-primary">
        <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-1 text-lg font-bold tracking-tight">
              <span className="text-text-secondary">[</span>
              <span className="gradient-text">megatools</span>
              <span className="text-text-secondary">]$</span>
            </Link>
            <QuickSwitchBar />
            <a href="#support" className="btn-primary hidden sm:flex text-sm py-1.5 px-3">
              Support
            </a>
          </div>
        </header>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "MegaTools",
              url: "https://megatools-tau.vercel.app",
              description:
                "Free online tools: QR generator, JSON formatter, password generator, and more. Privacy-first, runs in your browser.",
              applicationCategory: "UtilityApplication",
              operatingSystem: "All",
              offers: { "@type": "Offer", price: "0" },
            }),
          }}
        />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border-subtle py-6 text-sm text-text-muted">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-text-secondary">
              <span className="text-accent">$</span> megatools --free --fast --private{" "}
              <span className="animate-pulse-soft text-accent">▊</span>
            </p>
            <p className="mt-1">No data leaves your browser.</p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono text-text-muted">
              <Link href="/about" className="hover:text-accent transition-colors">
                About Us
              </Link>
              <span>·</span>
              <Link href="/privacy" className="hover:text-accent transition-colors">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-accent transition-colors">
                Terms of Service
              </Link>
            </div>

            <div id="support" className="mt-6 scroll-mt-20 border-t border-border-subtle pt-4">
              <p className="mb-2 text-text-primary font-semibold uppercase tracking-wider text-xs font-mono">
                Support the project
              </p>
              {SUPPORT_ADDRESSES.map((a) => (
                <div
                  key={a.chain}
                  className="flex flex-wrap items-center gap-2 py-1 break-all"
                >
                  <span className="w-10 shrink-0 font-semibold text-text-primary font-mono text-xs">
                    {a.chain}
                  </span>
                  <code className="text-xs sm:text-sm text-text-secondary">
                    {a.address}
                  </code>
                  <CopyButton text={a.address} label="copy" />
                </div>
              ))}
            </div>
          </div>
        </footer>
        <Analytics />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}
