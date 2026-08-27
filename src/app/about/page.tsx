import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About MegaTools — Privacy-First Developer Tools",
  description:
    "Learn about MegaTools: 38 fast, free, 100% in-browser developer, media, and cybersecurity tools running with zero server uploads.",
  openGraph: {
    title: "About MegaTools",
    description: "The story and architecture behind MegaTools.",
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="card p-6 sm:p-10 space-y-8">
        <div>
          <p className="text-xs font-mono text-text-muted mb-2">$ cat /etc/megatools/about.md</p>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-text">About MegaTools</span>
          </h1>
          <p className="mt-3 text-base text-text-secondary leading-relaxed">
            MegaTools is a privacy-first suite of 38 free developer, media, and cybersecurity utilities engineered to run 100% inside your web browser.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            [1] The Mission: Zero Servers, Total Privacy
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            Most online utility websites require users to upload sensitive files, certificates, source code, and passwords to remote third-party servers. This creates severe security risks, potential data leaks, and corporate compliance violations.
          </p>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            MegaTools was built on a single uncompromising rule: <strong>Your data must never leave your computer.</strong> Every algorithm — from SHA-512 cryptographic hashing, AES-256-GCM encryption, PDF merging, audio trimming, to image steganography — is executed locally on your device using native Web APIs (Web Crypto, HTML5 Canvas, Web Audio, and WebAssembly).
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            [2] What We Offer (38 Free Tools)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-secondary">
            <div className="rounded border border-border-subtle bg-bg-page p-3">
              <span className="text-accent font-bold block mb-1">📄 PDF &amp; Documents</span>
              <span>Merge PDFs, Split &amp; extract ranges, convert multi-image collections to PDF.</span>
            </div>
            <div className="rounded border border-border-subtle bg-bg-page p-3">
              <span className="text-accent font-bold block mb-1">🔐 Security &amp; Cryptography</span>
              <span>AES-256 encryption, SHA hash generator, JWT decoder, SSL cert inspector, steganography.</span>
            </div>
            <div className="rounded border border-border-subtle bg-bg-page p-3">
              <span className="text-accent font-bold block mb-1">📱 Media, Audio &amp; Video</span>
              <span>Screen &amp; audio recorder, audio waveform trimmer, EXIF GPS stripper, favicon generator.</span>
            </div>
            <div className="rounded border border-border-subtle bg-bg-page p-3">
              <span className="text-accent font-bold block mb-1">📝 Format &amp; Code</span>
              <span>SQL formatter, HTML/CSS minifier, SVG optimizer, CSV ↔ JSON, YAML ↔ JSON, Markdown preview.</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            [3] Open Web &amp; Performance
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            MegaTools is built with modern web technologies: Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4. Pages are statically pre-rendered for instant sub-second loading speeds across the globe via Vercel Edge Network.
          </p>
        </div>

        <div className="border-t border-border-subtle pt-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="btn-primary py-2 px-6 text-xs">
            $ explore all tools
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
            <Link href="/privacy" className="hover:text-accent">
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-accent">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
