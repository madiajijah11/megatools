import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QuickSwitchBar from "@/components/QuickSwitchBar";

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-bg-page text-text-primary">
        <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
              <span className="gradient-text">✦ Mega</span>
              <span className="text-text-secondary">Tools</span>
            </a>
            <QuickSwitchBar />
            <a
              href="https://ko-fi.com/genzodr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary hidden sm:flex text-sm py-1.5 px-3"
            >
              ☕ Support
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
              url: "https://megatools.vercel.app",
              description:
                "Free online tools: QR generator, JSON formatter, password generator, and more. Privacy-first, runs in your browser.",
              applicationCategory: "UtilityApplication",
              operatingSystem: "All",
              offers: { "@type": "Offer", price: "0" },
            }),
          }}
        />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border-subtle py-4 text-center text-sm text-text-muted">
          <p>MegaTools — Free. Fast. Private. No data leaves your browser.</p>
        </footer>
      </body>
    </html>
  );
}
