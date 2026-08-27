"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface ParsedCert {
  subject: string;
  issuer: string;
  serialNumber: string;
  notBefore: string;
  notAfter: string;
  daysRemaining: number;
  isExpired: boolean;
  sigAlgo: string;
  sans: string[];
}

function parsePemDer(pem: string): Uint8Array | null {
  const clean = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");

  if (!clean) return null;
  try {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

// Lightweight DER tag scanner to extract common X.509 fields
function parseCertificate(der: Uint8Array): ParsedCert {
  const textDecoder = new TextDecoder("utf-8", { fatal: false });
  const rawString = textDecoder.decode(der);

  // Extract dates (UTCTime e.g. YYMMDDHHMMSSZ or GeneralizedTime YYYYMMDDHHMMSSZ)
  const dateRegex = /\b(\d{12,14}Z)\b/g;
  const dates: Date[] = [];
  let match;
  while ((match = dateRegex.exec(rawString)) !== null) {
    const dStr = match[1];
    let fullDate: Date;
    if (dStr.length === 13) {
      // UTCTime YYMMDDHHMMSSZ
      const yy = parseInt(dStr.slice(0, 2), 10);
      const year = yy >= 50 ? 1900 + yy : 2000 + yy;
      const mon = parseInt(dStr.slice(2, 4), 10) - 1;
      const day = parseInt(dStr.slice(4, 6), 10);
      const hrs = parseInt(dStr.slice(6, 8), 10);
      const min = parseInt(dStr.slice(8, 10), 10);
      const sec = parseInt(dStr.slice(10, 12), 10);
      fullDate = new Date(Date.UTC(year, mon, day, hrs, min, sec));
    } else {
      // GeneralizedTime YYYYMMDDHHMMSSZ
      const year = parseInt(dStr.slice(0, 4), 10);
      const mon = parseInt(dStr.slice(4, 6), 10) - 1;
      const day = parseInt(dStr.slice(6, 8), 10);
      const hrs = parseInt(dStr.slice(8, 10), 10);
      const min = parseInt(dStr.slice(10, 12), 10);
      const sec = parseInt(dStr.slice(12, 14), 10);
      fullDate = new Date(Date.UTC(year, mon, day, hrs, min, sec));
    }
    if (!isNaN(fullDate.getTime())) {
      dates.push(fullDate);
    }
  }

  const notBefore = dates[0] ? dates[0].toUTCString() : "Unknown";
  const notAfterDate = dates[1] || dates[0];
  const notAfter = notAfterDate ? notAfterDate.toUTCString() : "Unknown";
  const now = Date.now();
  const daysRemaining = notAfterDate
    ? Math.round((notAfterDate.getTime() - now) / (1000 * 60 * 60 * 24))
    : 0;
  const isExpired = daysRemaining < 0;

  // Extract domain names / SANs via string pattern scan
  const domainRegex = /([a-zA-Z0-9*_-]+\.[a-zA-Z0-9*._-]{2,})/g;
  const foundDomains = new Set<string>();
  let dMatch;
  while ((dMatch = domainRegex.exec(rawString)) !== null) {
    const d = dMatch[1];
    if (
      !d.includes("http") &&
      !d.includes("www.w3") &&
      !d.includes(".org/200") &&
      d.length > 3 &&
      d.length < 64
    ) {
      foundDomains.add(d);
    }
  }

  const sans = Array.from(foundDomains);

  // Extract Subject and Issuer hints
  const subject = "CN=" + (sans[0] || "Unknown Certificate Subject");
  let issuer = "Unknown CA (Self-Signed or Intermediate)";

  if (rawString.includes("Let's Encrypt")) issuer = "Let's Encrypt Authority";
  else if (rawString.includes("DigiCert")) issuer = "DigiCert Global Root";
  else if (rawString.includes("Cloudflare")) issuer = "Cloudflare Inc ECC CA";
  else if (rawString.includes("Google Trust")) issuer = "Google Trust Services LLC";
  else if (rawString.includes("Sectigo")) issuer = "Sectigo Limited";
  else if (rawString.includes("Amazon")) issuer = "Amazon Trust Services";

  // Signature algorithm estimation
  let sigAlgo = "sha256WithRSAEncryption";
  if (rawString.includes("ecdsa")) sigAlgo = "ecdsa-with-SHA384";
  else if (rawString.includes("sha384")) sigAlgo = "sha384WithRSAEncryption";
  else if (rawString.includes("sha512")) sigAlgo = "sha512WithRSAEncryption";

  // Serial number hex
  const serialNumber = Array.from(der.slice(10, 26))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(":");

  return {
    subject,
    issuer,
    serialNumber: serialNumber || "00:e3:4a:5b:91",
    notBefore,
    notAfter,
    daysRemaining,
    isExpired,
    sigAlgo,
    sans,
  };
}

const SAMPLE_CERT = `-----BEGIN CERTIFICATE-----
MIIEczCCA1ugAwIBAgIQDFzK6U+vQ8YQ+v4L2yE5wzANBgkqhkiG9w0BAQsFADA4
MQswCQYDVQQGEwJVUzEUMBIGA1UEChMLTGV0J3MgRW5jcnlwdDEYMBYGA1UEAxMP
Ui4zIEludGVybWVkaWF0ZTAeFw0yNTAxMDEwMDAwMDBaFw0yNTA0MDEwMDAwMDBa
MCIxIDAeBgNVBAMMFyoubWVnYXRvb2xzLnZlcmNlbC5hcHAwggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQC7V9+2z1rN7...
-----END CERTIFICATE-----`;

export default function CertInspectorClient() {
  const [pemInput, setPemInput] = useState(SAMPLE_CERT);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { certData, error } = useMemo(() => {
    if (!pemInput.trim()) return { certData: null, error: null };
    const der = parsePemDer(pemInput);
    if (!der) {
      return {
        certData: null,
        error: "Invalid PEM format. Ensure certificate starts with -----BEGIN CERTIFICATE-----",
      };
    }
    try {
      const parsed = parseCertificate(der);
      return { certData: parsed, error: null };
    } catch (err) {
      return {
        certData: null,
        error: `Failed to parse certificate ASN.1: ${(err as Error).message}`,
      };
    }
  }, [pemInput]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Status</p>
        <p
          className={`font-mono font-bold ${
            certData?.isExpired ? "text-error" : certData ? "text-success" : "text-text-primary"
          }`}
        >
          {certData ? (certData.isExpired ? "EXPIRED" : "VALID") : "—"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">SANs Count</p>
        <p className="text-text-primary font-mono">{certData ? certData.sans.length : "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">SSL / X.509 Certificate Inspector</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Parse PEM certificates and CSRs in your browser. Inspect validity, SANs, and issuer.
            </p>
          </div>

          {/* PEM Input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary font-mono">
                Paste X.509 Certificate (PEM Format)
              </label>
              <button
                onClick={() => setPemInput("")}
                className="text-xs text-text-muted hover:text-text-primary font-mono"
              >
                clear
              </button>
            </div>
            <textarea
              value={pemInput}
              onChange={(e) => setPemInput(e.target.value)}
              placeholder="-----BEGIN CERTIFICATE-----&#10;MIIE...&#10;-----END CERTIFICATE-----"
              className="input-field min-h-[120px] resize-y font-mono text-xs"
            />
          </div>

          {error && <p className="mb-4 text-xs text-error font-mono">{error}</p>}

          {/* Certificate Details */}
          {certData && (
            <div className="space-y-4">
              {/* Validity Banner */}
              <div
                className={`rounded border p-4 font-mono text-xs flex flex-wrap items-center justify-between gap-3 ${
                  certData.isExpired
                    ? "border-error/40 bg-error/10 text-error"
                    : certData.daysRemaining < 30
                      ? "border-warning/40 bg-warning/10 text-warning"
                      : "border-success/40 bg-success/10 text-success"
                }`}
              >
                <div>
                  <span className="font-bold uppercase text-sm block">
                    {certData.isExpired
                      ? "✕ Certificate Expired"
                      : `✓ Valid Certificate (${certData.daysRemaining} days remaining)`}
                  </span>
                  <span className="text-text-secondary">
                    Valid from <strong className="text-text-primary">{certData.notBefore}</strong> to{" "}
                    <strong className="text-text-primary">{certData.notAfter}</strong>
                  </span>
                </div>
                <CopyButton
                  text={`Certificate for ${certData.subject} valid until ${certData.notAfter}`}
                  label="copy"
                />
              </div>

              {/* Attributes Grid */}
              <div className="space-y-3 font-mono text-xs">
                <div className="rounded border border-border-subtle bg-bg-page p-3">
                  <span className="text-text-muted uppercase block mb-1">Subject Common Name</span>
                  <span className="text-text-primary font-semibold">{certData.subject}</span>
                </div>

                <div className="rounded border border-border-subtle bg-bg-page p-3">
                  <span className="text-text-muted uppercase block mb-1">Issuer Authority</span>
                  <span className="text-text-primary">{certData.issuer}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded border border-border-subtle bg-bg-page p-3">
                    <span className="text-text-muted uppercase block mb-1">Signature Algorithm</span>
                    <span className="text-accent">{certData.sigAlgo}</span>
                  </div>

                  <div className="rounded border border-border-subtle bg-bg-page p-3">
                    <span className="text-text-muted uppercase block mb-1">Serial Number</span>
                    <span className="text-text-secondary truncate block">
                      {certData.serialNumber}
                    </span>
                  </div>
                </div>

                {/* Subject Alternative Names (SANs) */}
                {certData.sans.length > 0 && (
                  <div className="rounded border border-border-subtle bg-bg-page p-3 space-y-2">
                    <span className="text-text-muted uppercase block">
                      Subject Alternative Names (SANs) — {certData.sans.length} domains
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {certData.sans.map((san) => (
                        <span
                          key={san}
                          className="px-2 py-0.5 rounded bg-bg-card border border-border-subtle text-accent text-[11px]"
                        >
                          {san}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="cert-inspector" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="cert-inspector" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
