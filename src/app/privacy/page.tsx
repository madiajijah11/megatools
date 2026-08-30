import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — MegaTools",
  description:
    "Privacy Policy for MegaTools. Learn how we protect your privacy through 100% client-side, zero-server architecture.",
  openGraph: {
    title: "Privacy Policy — MegaTools",
    description: "Our commitment to 100% client-side privacy and data protection.",
  },
};

export default function PrivacyPage() {
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
          <p className="text-xs font-mono text-text-muted mb-2">$ cat /var/log/privacy-policy.md</p>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-text">Privacy Policy</span>
          </h1>
          <p className="mt-2 text-xs font-mono text-text-muted">
            Last Updated: August 27, 2026 · Effective Date: January 1, 2026
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            1. Core Principle: 100% Client-Side Processing
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            At MegaTools, your privacy is not just a policy — it is fundamentally baked into our technical architecture. All developer, media, and security utilities available on this site execute entirely inside your web browser (client-side).
          </p>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            When you enter text, generate cryptographic keys, merge PDF documents, encode Base64, compress photos, or inspect SSL certificates:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-text-secondary font-sans text-sm">
            <li>Your files, texts, passwords, and data are <strong>never transmitted</strong> to any server.</li>
            <li>No backend database or cloud storage holds your input or output files.</li>
            <li>All memory allocated for data processing is instantly released when you close or refresh the tab.</li>
          </ul>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            2. Web Analytics &amp; Cookies
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            To understand overall website performance and visitor counts, we may use privacy-respecting analytics tools such as Vercel Analytics and Google Analytics (GA4).
          </p>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            These analytics services only collect aggregated, non-personally identifiable technical information (such as browser type, general country-level location, device category, and pages visited). They never inspect or collect the contents of the files you process in our tools.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            3. Third-Party Advertising &amp; Google AdSense
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            We may display third-party advertisements (such as Google AdSense or developer ad networks) to support server hosting costs and keep MegaTools 100% free for everyone.
          </p>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            Third-party vendors, including Google, use cookies to serve ads based on prior visits to this or other websites. You may opt out of personalized advertising by visiting Google Ads Settings (
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              google.com/settings/ads
            </a>
            ) or via the Network Advertising Initiative (
            <a
              href="https://www.aboutads.info"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              aboutads.info
            </a>
            ).
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            4. GDPR &amp; CCPA Compliance
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            Because MegaTools does not collect, process, or store personal user data on external servers, we are fully compliant with the European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            5. Changes &amp; Inquiries
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            We reserve the right to update this Privacy Policy as new features or browser APIs are introduced. Any updates will be reflected on this page with an updated timestamp.
          </p>
        </div>

        <div className="border-t border-border-subtle pt-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="btn-primary py-2 px-6 text-xs">
            $ return to tools
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono text-text-muted">
            <Link href="/about" className="hover:text-accent">
              About Us
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
