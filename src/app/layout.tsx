import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col antialiased">
        <header className="sticky top-0 z-50 border-b border-mega-border glass">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <a href="/" className="text-xl font-bold tracking-tight">
              <span className="gradient-text">✦ Mega</span>
              <span className="text-mega-muted">Tools</span>
            </a>
            <nav className="flex items-center gap-3 sm:gap-4 text-sm text-mega-muted">
              <a href="/qrcode" className="hover:text-mega-accent-light transition-colors hidden sm:inline">
                QR
              </a>
              <a href="/json-formatter" className="hover:text-mega-accent-light transition-colors hidden sm:inline">
                JSON
              </a>
              <a href="/password-generator" className="hover:text-mega-accent-light transition-colors hidden sm:inline">
                Password
              </a>
              <a href="/uuid-generator" className="hover:text-mega-accent-light transition-colors hidden md:inline">
                UUID
              </a>
              <a href="/base64" className="hover:text-mega-accent-light transition-colors hidden md:inline">
                Base64
              </a>
              <a href="/markdown-preview" className="hover:text-mega-accent-light transition-colors hidden lg:inline">
                Markdown
              </a>
              <a href="/image-compressor" className="hover:text-mega-accent-light transition-colors hidden lg:inline">
                Image
              </a>
              <a href="/text-diff" className="hover:text-mega-accent-light transition-colors hidden lg:inline">
                Diff
              </a>
              <a
                href="https://ko-fi.com/genzodr"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-mega-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-mega-accent-light transition-colors"
              >
                ☕ Support
              </a>
            </nav>
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
        <footer className="border-t border-mega-border py-6 text-center text-sm text-mega-muted">
          <p>✦ MegaTools — Free. Fast. Private. No data leaves your browser.</p>
        </footer>
      </body>
    </html>
  );
}
