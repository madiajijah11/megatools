"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

type Tab = "spf" | "dmarc" | "dkim";

const POPULAR_PROVIDERS = [
  { name: "Google Workspace / Gmail", include: "_spf.google.com" },
  { name: "Microsoft 365 / Outlook", include: "spf.protection.outlook.com" },
  { name: "SendGrid", include: "sendgrid.net" },
  { name: "Mailgun", include: "mailgun.org" },
  { name: "Amazon SES", include: "amazonses.com" },
  { name: "Zoho Mail", include: "zoho.com" },
  { name: "Postmark", include: "spf.mtasv.net" },
  { name: "Resend", include: "resend.com" },
];

export default function EmailDnsGeneratorClient() {
  const [activeTab, setActiveTab] = useState<Tab>("spf");
  const [domain, setDomain] = useState("example.com");

  // SPF states
  const [spfIncludeMx, setSpfIncludeMx] = useState(true);
  const [spfIncludeA, setSpfIncludeA] = useState(true);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(["_spf.google.com"]);
  const [customIp4, setCustomIp4] = useState("");
  const [spfQualifier, setSpfQualifier] = useState<"~all" | "-all" | "?all">("~all");

  // DMARC states
  const [dmarcPolicy, setDmarcPolicy] = useState<"none" | "quarantine" | "reject">("quarantine");
  const [dmarcSubPolicy, setDmarcSubPolicy] = useState<"none" | "quarantine" | "reject">("quarantine");
  const [dmarcPercentage, setDmarcPercentage] = useState<number>(100);
  const [dmarcRuaEmail, setDmarcRuaEmail] = useState("dmarc-reports@example.com");
  const [dmarcSpfAlign, setDmarcSpfAlign] = useState<"r" | "s">("r");
  const [dmarcDkimAlign, setDmarcDkimAlign] = useState<"r" | "s">("r");

  // DKIM states
  const [dkimSelector, setDkimSelector] = useState("s1");
  const [dkimPublicKey, setDkimPublicKey] = useState(
    "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC3..."
  );
  // Toggle SPF provider
  const toggleProvider = (includeVal: string) => {
    if (selectedProviders.includes(includeVal)) {
      setSelectedProviders(selectedProviders.filter((p) => p !== includeVal));
    } else {
      setSelectedProviders([...selectedProviders, includeVal]);
    }
  };

  // SPF Record
  const spfRecord = useMemo(() => {
    const parts = ["v=spf1"];
    if (spfIncludeMx) parts.push("mx");
    if (spfIncludeA) parts.push("a");
    selectedProviders.forEach((p) => parts.push(`include:${p}`));
    if (customIp4.trim()) {
      customIp4
        .split(",")
        .map((ip) => ip.trim())
        .filter(Boolean)
        .forEach((ip) => parts.push(`ip4:${ip}`));
    }
    parts.push(spfQualifier);
    return parts.join(" ");
  }, [spfIncludeMx, spfIncludeA, selectedProviders, customIp4, spfQualifier]);

  // DMARC Record
  const dmarcRecord = useMemo(() => {
    const parts = [`v=DMARC1`, `p=${dmarcPolicy}`];
    if (dmarcSubPolicy !== dmarcPolicy) {
      parts.push(`sp=${dmarcSubPolicy}`);
    }
    if (dmarcPercentage < 100) {
      parts.push(`pct=${dmarcPercentage}`);
    }
    if (dmarcRuaEmail.trim()) {
      parts.push(`rua=mailto:${dmarcRuaEmail.trim()}`);
    }
    if (dmarcSpfAlign !== "r") {
      parts.push(`aspf=${dmarcSpfAlign}`);
    }
    if (dmarcDkimAlign !== "r") {
      parts.push(`adkim=${dmarcDkimAlign}`);
    }
    return parts.join("; ");
  }, [dmarcPolicy, dmarcSubPolicy, dmarcPercentage, dmarcRuaEmail, dmarcSpfAlign, dmarcDkimAlign]);

  // DKIM Record
  const dkimRecord = useMemo(() => {
    return `v=DKIM1; k=rsa; p=${dkimPublicKey.trim()}`;
  }, [dkimPublicKey]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">DNS Record</p>
        <p className="text-accent font-mono text-xs font-bold uppercase">{activeTab}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Record Type</p>
        <p className="text-text-primary font-mono text-xs">TXT Record</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="email-dns-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Domain input */}
          <div className="mb-6 p-4 rounded-xl bg-bg-page border border-border-subtle flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs font-mono text-text-secondary whitespace-nowrap">Your Domain Name:</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 mb-6 bg-bg-page p-1 rounded-lg border border-border-subtle">
            {(
              [
                { id: "spf", label: "SPF Record (Sender Policy Framework)" },
                { id: "dmarc", label: "DMARC Record (Policy & Reporting)" },
                { id: "dkim", label: "DKIM Record (DomainKeys Identified Mail)" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-xs font-mono rounded transition-colors ${
                  activeTab === tab.id
                    ? "bg-accent-soft text-accent font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SPF View */}
          {activeTab === "spf" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-4">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spfIncludeMx}
                      onChange={(e) => setSpfIncludeMx(e.target.checked)}
                      className="accent-accent"
                    />
                    Authorize MX Servers (mx)
                  </label>
                  <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={spfIncludeA}
                      onChange={(e) => setSpfIncludeA(e.target.checked)}
                      className="accent-accent"
                    />
                    Authorize Main Domain IP (a)
                  </label>
                </div>

                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-2 font-bold">
                    Third-Party Email Sending Providers:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {POPULAR_PROVIDERS.map((prov) => (
                      <label
                        key={prov.include}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                          selectedProviders.includes(prov.include)
                            ? "bg-accent/10 border-accent text-accent"
                            : "bg-bg-card border-border-subtle text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProviders.includes(prov.include)}
                          onChange={() => toggleProvider(prov.include)}
                          className="accent-accent"
                        />
                        <span className="truncate">{prov.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">
                      Custom IPv4 Addresses (comma separated):
                    </label>
                    <input
                      type="text"
                      value={customIp4}
                      onChange={(e) => setCustomIp4(e.target.value)}
                      placeholder="198.51.100.1, 203.0.113.5"
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">
                      Enforcement Policy:
                    </label>
                    <select
                      value={spfQualifier}
                      onChange={(e) => setSpfQualifier(e.target.value as "~all" | "-all" | "?all")}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value="~all">~all (SoftFail - Recommended for high deliverability)</option>
                      <option value="-all">-all (HardFail - Strict rejection of unauthorized servers)</option>
                      <option value="?all">?all (Neutral - Testing mode)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Output */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-secondary font-bold uppercase">
                    DNS TXT Record for @ or {domain}:
                  </span>
                  <CopyButton text={spfRecord} />
                </div>
                <div className="p-3 bg-bg-card border border-border-subtle rounded font-mono text-xs text-accent break-all select-all">
                  {spfRecord}
                </div>
              </div>
            </div>
          )}

          {/* DMARC View */}
          {activeTab === "dmarc" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">
                      Main Domain Policy (p=):
                    </label>
                    <select
                      value={dmarcPolicy}
                      onChange={(e) => setDmarcPolicy(e.target.value as "none" | "quarantine" | "reject")}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value="none">none (Monitor only - No mail action taken)</option>
                      <option value="quarantine">quarantine (Send unauthenticated mail to spam folder)</option>
                      <option value="reject">reject (Drop unauthenticated mail completely)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">
                      Subdomain Policy (sp=):
                    </label>
                    <select
                      value={dmarcSubPolicy}
                      onChange={(e) => setDmarcSubPolicy(e.target.value as "none" | "quarantine" | "reject")}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value="none">none</option>
                      <option value="quarantine">quarantine</option>
                      <option value="reject">reject</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">
                      Aggregate Report Email (rua=):
                    </label>
                    <input
                      type="email"
                      value={dmarcRuaEmail}
                      onChange={(e) => setDmarcRuaEmail(e.target.value)}
                      placeholder="dmarc@example.com"
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-mono text-text-secondary">Percentage (pct=):</label>
                      <span className="text-xs font-mono text-accent font-bold">{dmarcPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={10}
                      value={dmarcPercentage}
                      onChange={(e) => setDmarcPercentage(Number(e.target.value))}
                      className="w-full accent-accent cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">SPF Alignment Mode (aspf=):</label>
                    <select
                      value={dmarcSpfAlign}
                      onChange={(e) => setDmarcSpfAlign(e.target.value as "r" | "s")}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value="r">r (Relaxed - Subdomains allowed)</option>
                      <option value="s">s (Strict - Exact domain match required)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">DKIM Alignment Mode (adkim=):</label>
                    <select
                      value={dmarcDkimAlign}
                      onChange={(e) => setDmarcDkimAlign(e.target.value as "r" | "s")}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value="r">r (Relaxed)</option>
                      <option value="s">s (Strict)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Output */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-secondary font-bold uppercase">
                    DNS TXT Record for _dmarc.{domain}:
                  </span>
                  <CopyButton text={dmarcRecord} />
                </div>
                <div className="p-3 bg-bg-card border border-border-subtle rounded font-mono text-xs text-accent break-all select-all">
                  {dmarcRecord}
                </div>
              </div>
            </div>
          )}

          {/* DKIM View */}
          {activeTab === "dkim" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-4">
                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">
                    DKIM Key Selector:
                  </label>
                  <input
                    type="text"
                    value={dkimSelector}
                    onChange={(e) => setDkimSelector(e.target.value)}
                    placeholder="e.g. google, default, or s1"
                    className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                  <p className="text-[10px] font-mono text-text-muted mt-1">
                    This sets your DNS host to: <span className="text-accent font-bold">{dkimSelector}._domainkey.{domain}</span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">
                    Public Key (Base64 string):
                  </label>
                  <textarea
                    value={dkimPublicKey}
                    onChange={(e) => setDkimPublicKey(e.target.value)}
                    rows={4}
                    placeholder="Paste RSA public key without header..."
                    className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none break-all"
                  />
                </div>
              </div>

              {/* Output */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-secondary font-bold uppercase">
                    DNS TXT Record for {dkimSelector}._domainkey.{domain}:
                  </span>
                  <CopyButton text={dkimRecord} />
                </div>
                <div className="p-3 bg-bg-card border border-border-subtle rounded font-mono text-xs text-accent break-all select-all">
                  {dkimRecord}
                </div>
              </div>
            </div>
          )}
      </div>
    </ToolLayout>
  );
}