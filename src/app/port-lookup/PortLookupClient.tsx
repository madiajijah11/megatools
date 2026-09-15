"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface PortInfo {
  port: number;
  protocol: "TCP" | "UDP" | "TCP/UDP";
  service: string;
  name: string;
  category: "Web" | "Database" | "Remote Access" | "Mail" | "Network/Core" | "DevOps/Cloud";
  risk: "Critical" | "Warning" | "Standard";
  description: string;
  riskNote: string;
  mitigation: string;
}

const PORTS_DATA: PortInfo[] = [
  {
    port: 20,
    protocol: "TCP",
    service: "FTP Data",
    name: "File Transfer Protocol (Data)",
    category: "Network/Core",
    risk: "Warning",
    description: "Used by active FTP servers for transferring actual file content.",
    riskNote: "Unencrypted traffic. Credentials and file contents sent in cleartext.",
    mitigation: "Use SFTP (SSH Port 22) or FTPS (TLS).",
  },
  {
    port: 21,
    protocol: "TCP",
    service: "FTP Control",
    name: "File Transfer Protocol (Control)",
    category: "Network/Core",
    risk: "Critical",
    description: "Command and authentication channel for FTP servers.",
    riskNote: "Sends usernames and passwords in cleartext. Vulnerable to sniffing and brute-force.",
    mitigation: "Disable FTP; migrate to SFTP (port 22).",
  },
  {
    port: 22,
    protocol: "TCP",
    service: "SSH / SFTP",
    name: "Secure Shell / Secure FTP",
    category: "Remote Access",
    risk: "Standard",
    description: "Encrypted remote terminal access and secure file transfer.",
    riskNote: "Frequent target for automated brute-force botnets when left on default port.",
    mitigation: "Disable password login, use Ed25519 public keys, configure fail2ban.",
  },
  {
    port: 23,
    protocol: "TCP",
    service: "Telnet",
    name: "Telnet Remote Login",
    category: "Remote Access",
    risk: "Critical",
    description: "Legacy unencrypted command-line terminal interface.",
    riskNote: "Transmits all keystrokes and passwords in plaintext over the wire.",
    mitigation: "Disable immediately. Replace with SSH.",
  },
  {
    port: 25,
    protocol: "TCP",
    service: "SMTP",
    name: "Simple Mail Transfer Protocol",
    category: "Mail",
    risk: "Warning",
    description: "MTA server-to-server email routing.",
    riskNote: "Open relays can be abused for spam campaigns and spoofing.",
    mitigation: "Enforce STARTTLS, SPF, DKIM, DMARC, and restrict relaying.",
  },
  {
    port: 53,
    protocol: "TCP/UDP",
    service: "DNS",
    name: "Domain Name System",
    category: "Network/Core",
    risk: "Warning",
    description: "Translates human domain names into IP addresses.",
    riskNote: "UDP DNS servers can be used in amplified Distributed Denial of Service (DDoS) reflection attacks.",
    mitigation: "Disable open recursive resolvers; implement DNSSEC and rate-limiting.",
  },
  {
    port: 80,
    protocol: "TCP",
    service: "HTTP",
    name: "Hypertext Transfer Protocol",
    category: "Web",
    risk: "Warning",
    description: "Unencrypted web traffic protocol.",
    riskNote: "Subject to Man-in-the-Middle (MitM) eavesdropping, session hijacking, and injection.",
    mitigation: "Redirect all port 80 traffic to HTTPS (port 443) with HSTS enabled.",
  },
  {
    port: 110,
    protocol: "TCP",
    service: "POP3",
    name: "Post Office Protocol v3",
    category: "Mail",
    risk: "Critical",
    description: "Client-side email retrieval protocol.",
    riskNote: "Unencrypted passwords and message content sent over network.",
    mitigation: "Use POP3S (Port 995 with SSL/TLS) or IMAPS (Port 993).",
  },
  {
    port: 123,
    protocol: "UDP",
    service: "NTP",
    name: "Network Time Protocol",
    category: "Network/Core",
    risk: "Warning",
    description: "Clock synchronization across network devices.",
    riskNote: "Often abused in massive UDP amplification DDoS attacks (monlist vulnerability).",
    mitigation: "Disable monlist feature; restrict NTP server access to internal subnets.",
  },
  {
    port: 143,
    protocol: "TCP",
    service: "IMAP",
    name: "Internet Message Access Protocol",
    category: "Mail",
    risk: "Warning",
    description: "Synchronizes emails across multiple devices in real time.",
    riskNote: "Cleartext credentials without STARTTLS.",
    mitigation: "Use IMAPS (Port 993) with strict TLS certificates.",
  },
  {
    port: 389,
    protocol: "TCP/UDP",
    service: "LDAP",
    name: "Lightweight Directory Access Protocol",
    category: "Network/Core",
    risk: "Critical",
    description: "Directory services and corporate identity authentication.",
    riskNote: "Cleartext directory queries leak corporate user accounts and password hashes.",
    mitigation: "Use LDAPS (Port 636) with TLS or StartTLS.",
  },
  {
    port: 443,
    protocol: "TCP",
    service: "HTTPS",
    name: "Hypertext Transfer Protocol Secure",
    category: "Web",
    risk: "Standard",
    description: "Encrypted web communications via TLS/SSL.",
    riskNote: "Safe protocol, but requires strong cipher suites (TLS 1.2/1.3) and valid certificates.",
    mitigation: "Use modern TLS ciphers, disable SSLv3/TLS 1.0/1.1, and enable HSTS.",
  },
  {
    port: 445,
    protocol: "TCP",
    service: "SMB / CIFS",
    name: "Server Message Block",
    category: "Network/Core",
    risk: "Critical",
    description: "Windows file, printer, and IPC sharing.",
    riskNote: "High-value attack vector for ransomware (EternalBlue, WannaCry, NotPetya).",
    mitigation: "Block port 445 at WAN firewall. Never expose SMB to the public internet.",
  },
  {
    port: 993,
    protocol: "TCP",
    service: "IMAPS",
    name: "IMAP over SSL/TLS",
    category: "Mail",
    risk: "Standard",
    description: "Encrypted email synchronization.",
    riskNote: "Safe when configured with modern TLS certificates.",
    mitigation: "Enforce TLS 1.2/1.3 and require multi-factor authentication (MFA).",
  },
  {
    port: 995,
    protocol: "TCP",
    service: "POP3S",
    name: "POP3 over SSL/TLS",
    category: "Mail",
    risk: "Standard",
    description: "Encrypted email download protocol.",
    riskNote: "Safe standard for legacy POP3 clients.",
    mitigation: "Use valid SSL certificates and strong passwords.",
  },
  {
    port: 1433,
    protocol: "TCP",
    service: "MS SQL",
    name: "Microsoft SQL Server",
    category: "Database",
    risk: "Critical",
    description: "Relational database engine for Microsoft SQL Server.",
    riskNote: "High target for automated password brute-force and remote code execution exploits.",
    mitigation: "Bind to localhost/VPC only; use VPN/SSH tunnel for remote administrative access.",
  },
  {
    port: 1521,
    protocol: "TCP",
    service: "Oracle DB",
    name: "Oracle Database Listener",
    category: "Database",
    risk: "Critical",
    description: "Default listener port for Oracle database instances.",
    riskNote: "TNS listener poisoning and brute-force attacks.",
    mitigation: "Restrict access via security groups; never expose to public IP.",
  },
  {
    port: 3306,
    protocol: "TCP",
    service: "MySQL / MariaDB",
    name: "MySQL Database Server",
    category: "Database",
    risk: "Critical",
    description: "Default connection port for MySQL and MariaDB databases.",
    riskNote: "Frequent target for credential stuffing and database dumping.",
    mitigation: "Bind to 127.0.0.1; enforce TLS; use VPN or private subnet for app servers.",
  },
  {
    port: 3389,
    protocol: "TCP/UDP",
    service: "RDP",
    name: "Remote Desktop Protocol (Windows)",
    category: "Remote Access",
    risk: "Critical",
    description: "Microsoft graphical remote desktop management.",
    riskNote: "Top attack vector for ransomware gangs (BlueKeep vulnerability, brute force).",
    mitigation: "Never expose port 3389 directly. Use WireGuard/VPN or Azure Bastion + MFA.",
  },
  {
    port: 5432,
    protocol: "TCP",
    service: "PostgreSQL",
    name: "PostgreSQL Database",
    category: "Database",
    risk: "Critical",
    description: "Relational database management system.",
    riskNote: "Unauthorized connections can dump or corrupt database contents.",
    mitigation: "Configure pg_hba.conf strictly, enforce SSL, and place behind private VPC.",
  },
  {
    port: 6379,
    protocol: "TCP",
    service: "Redis",
    name: "Redis In-Memory Data Store",
    category: "Database",
    risk: "Critical",
    description: "In-memory key-value cache and database.",
    riskNote: "Historically shipped without default password. Exposed Redis allows instant root RCE via crontab overwrite.",
    mitigation: "Bind to 127.0.0.1 only, set strong `requirepass`, rename dangerous commands (FLUSHALL, CONFIG).",
  },
  {
    port: 8080,
    protocol: "TCP",
    service: "HTTP-Alt / Proxy",
    name: "Alternative Web Server / Tomcat",
    category: "Web",
    risk: "Warning",
    description: "Often used for web development, proxy servers, Spring Boot, or Apache Tomcat.",
    riskNote: "Often left unprotected with default administrative credentials (e.g. Tomcat manager).",
    mitigation: "Place behind reverse proxy with TLS and authentication.",
  },
  {
    port: 8443,
    protocol: "TCP",
    service: "HTTPS-Alt",
    name: "Alternative HTTPS / Admin Panels",
    category: "Web",
    risk: "Standard",
    description: "Encrypted alternative web port, common for web control panels (Plesk, UniFi).",
    riskNote: "Targeted for router and management panel exploits.",
    mitigation: "Restrict access by IP allowlist and enforce strong 2FA.",
  },
  {
    port: 9200,
    protocol: "TCP",
    service: "Elasticsearch",
    name: "Elasticsearch REST API",
    category: "Database",
    risk: "Critical",
    description: "Distributed search and analytics engine REST interface.",
    riskNote: "Exposed Elasticsearch clusters frequently leak millions of records to automated scrapers.",
    mitigation: "Enable X-Pack security, set API keys, and block public WAN traffic.",
  },
  {
    port: 27017,
    protocol: "TCP",
    service: "MongoDB",
    name: "MongoDB Database Instance",
    category: "Database",
    risk: "Critical",
    description: "NoSQL document database default port.",
    riskNote: "Frequently ransomed when exposed without authentication.",
    mitigation: "Enable `security.authorization: enabled` in mongod.conf; bind to private IP.",
  },
];

export default function PortLookupClient() {
  const [query, setQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState<string>("ALL");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  
  const filteredPorts = useMemo(() => {
    return PORTS_DATA.filter((p) => {
      const matchQuery =
        query.trim() === "" ||
        p.port.toString().includes(query.trim()) ||
        p.service.toLowerCase().includes(query.toLowerCase()) ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase());

      const matchProto = protocolFilter === "ALL" || p.protocol.includes(protocolFilter);
      const matchRisk = riskFilter === "ALL" || p.risk === riskFilter;

      return matchQuery && matchProto && matchRisk;
    });
  }, [query, protocolFilter, riskFilter]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Matching Ports</p>
        <p className="text-text-primary font-mono">{filteredPorts.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Total Database</p>
        <p className="text-text-primary font-mono">{PORTS_DATA.length} ports</p>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="port-lookup" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">

          {/* Search bar */}
          <div className="mb-6">
            <div className="flex items-center input-field !py-0 h-12 text-sm">
              <span className="text-accent select-none font-mono mr-2">&gt; search:</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search port number (e.g. 22, 3389, 6379) or service (ssh, redis, mysql)..."
                className="w-full bg-transparent outline-none border-none placeholder:text-text-muted font-mono"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs text-text-muted hover:text-text-primary font-mono"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Protocol:</span>
              {["ALL", "TCP", "UDP"].map((proto) => (
                <button
                  key={proto}
                  onClick={() => setProtocolFilter(proto)}
                  className={`py-1 px-2.5 rounded border transition-colors ${
                    protocolFilter === proto
                      ? "border-accent bg-accent-soft text-accent font-bold"
                      : "border-border-subtle bg-bg-page text-text-secondary hover:border-accent"
                  }`}
                >
                  {proto}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-text-muted">Risk:</span>
              {["ALL", "Critical", "Warning", "Standard"].map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskFilter(r)}
                  className={`py-1 px-2.5 rounded border transition-colors ${
                    riskFilter === r
                      ? "border-accent bg-accent-soft text-accent font-bold"
                      : "border-border-subtle bg-bg-page text-text-secondary hover:border-accent"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Port List */}
          <div className="space-y-4">
            {filteredPorts.map((item) => (
              <div
                key={`${item.port}-${item.protocol}`}
                className="rounded border border-border-subtle bg-bg-page p-4 space-y-2 hover:border-accent/40 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-accent">
                      :{item.port}
                    </span>
                    <span className="text-xs font-mono rounded bg-bg-card border border-border-subtle px-1.5 py-0.5 text-text-secondary">
                      {item.protocol}
                    </span>
                    <span className="font-semibold text-text-primary text-sm">
                      {item.service}
                    </span>
                    <span className="text-xs text-text-muted">({item.name})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded border font-semibold ${
                        item.risk === "Critical"
                          ? "border-error/40 bg-error/10 text-error"
                          : item.risk === "Warning"
                            ? "border-warning/40 bg-warning/10 text-warning"
                            : "border-success/40 bg-success/10 text-success"
                      }`}
                    >
                      {item.risk} Risk
                    </span>
                    <CopyButton
                      text={`Port ${item.port}/${item.protocol} - ${item.service} (${item.name}): ${item.description}`}
                      label="copy"
                    />
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {item.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="rounded bg-bg-card border border-border-subtle p-2">
                    <span className="text-error font-semibold block mb-0.5">⚠️ Security Risk:</span>
                    <span className="text-text-secondary">{item.riskNote}</span>
                  </div>
                  <div className="rounded bg-bg-card border border-border-subtle p-2">
                    <span className="text-accent font-semibold block mb-0.5">🛡️ Mitigation:</span>
                    <span className="text-text-secondary">{item.mitigation}</span>
                  </div>
                </div>
              </div>
            ))}

            {filteredPorts.length === 0 && (
              <p className="text-center text-text-muted py-8 font-mono text-sm">
                No matching ports found for &quot;{query}&quot;.
              </p>
            )}
          </div>
      </div>
    </ToolLayout>
  );
}