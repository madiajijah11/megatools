import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — MegaTools",
  description:
    "Terms of Service for MegaTools. Review our conditions of use and service disclaimer.",
  openGraph: {
    title: "Terms of Service — MegaTools",
    description: "Terms and conditions for using MegaTools.",
  },
};

export default function TermsPage() {
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
          <p className="text-xs font-mono text-text-muted mb-2">$ cat /var/log/terms-of-service.md</p>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="gradient-text">Terms of Service</span>
          </h1>
          <p className="mt-2 text-xs font-mono text-text-muted">
            Last Updated: August 27, 2026 · Effective Date: January 1, 2026
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            1. Agreement to Terms
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            By accessing or using MegaTools (<span className="font-mono text-accent">megatools.vercel.app</span>), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should discontinue use of the site.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            2. Permitted Use &amp; Lawful Conduct
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            MegaTools is provided free of charge for software developers, system administrators, students, and general internet users. You agree not to use the tools to generate malicious payloads, conduct unauthorized penetration attacks, or violate local or international cyber laws.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            3. Disclaimer of Warranties (&quot;AS IS&quot;)
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            MegaTools is provided on an <strong>&quot;AS IS&quot;</strong> and <strong>&quot;AS AVAILABLE&quot;</strong> basis without warranties of any kind, whether express, implied, or statutory. While we take great care in testing cryptographic implementations and format parsers, we do not guarantee that the outputs will always be error-free or uninterrupted.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs border-t border-border-subtle pt-6">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            4. Limitation of Liability
          </h2>
          <p className="text-text-secondary leading-relaxed font-sans text-sm">
            In no event shall MegaTools, its creators, or contributors be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our tools, including loss of data or corruption of files.
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
            <Link href="/privacy" className="hover:text-accent">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
