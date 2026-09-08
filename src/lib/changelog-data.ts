export type ChangeType = "added" | "updated" | "improved" | "fixed";

export interface ChangelogItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: ChangeType;
  toolHref?: string;
  toolName?: string;
  description: string;
  highlights?: string[];
}

export const CHANGELOG_ITEMS: ChangelogItem[] = [
  {
    id: "2026-09-04-dns-lookup",
    date: "2026-09-04",
    title: "DNS over HTTPS (DoH) Lookup & Records Inspector",
    type: "added",
    toolHref: "/dns-lookup",
    toolName: "DNS over HTTPS Lookup",
    description: "Added an encrypted browser-based DNS lookup tool powered by Cloudflare (1.1.1.1) and Google (8.8.8.8) DoH JSON resolvers with DNSSEC verification.",
    highlights: [
      "Query A, AAAA, MX, TXT, CNAME, NS, SOA, CAA, and PTR records directly from the browser",
      "Switch seamlessly between Cloudflare and Google DoH endpoints",
      "DNSSEC Authenticated Data (AD) flag inspection and TTL countdown metrics",
      "All-in-one 'ALL' mode to aggregate host IP, mail servers, and text verification records simultaneously",
    ],
  },
  {
    id: "2026-09-04-webrtc-leak",
    date: "2026-09-04",
    title: "WebRTC IP Leak & VPN Shield Tester: In-Browser STUN Probe",
    type: "added",
    toolHref: "/webrtc-leak",
    toolName: "WebRTC IP Leak & VPN Shield Tester",
    description: "Added an automated WebRTC diagnostic tool to verify if your real WAN or LAN IP leaks past VPN or proxy tunnels through STUN ICE candidate requests.",
    highlights: [
      "Probes public Google STUN servers to detect server-reflexive (srflx) and host candidates",
      "Automatic side-by-side comparison between WebRTC candidates and HTTP egress IP",
      "Detects mDNS anonymization vs actual multi-homed IP exposure",
      "Actionable remediation guides for hardening Firefox, Brave, Chrome, and Edge",
    ],
  },
  {
    id: "2026-09-04-pwned-checker",
    date: "2026-09-04",
    title: "Pwned Password Checker: HaveIBeenPwned k-Anonymity Engine",
    type: "added",
    toolHref: "/pwned-checker",
    toolName: "Pwned Password & Data Breach Checker",
    description: "Launched an airgapped data breach password scanner using mathematical k-Anonymity — verify password exposures in 800M+ leaked records with zero plaintext leakage.",
    highlights: [
      "Mathematical k-Anonymity guarantee — only 5-hex SHA-1 prefix is ever queried against HIBP",
      "Exact breach exposure count and threat severity classification (Extreme, High, Compromised)",
      "Real-time prefix/suffix cryptographic pipeline visualization",
      "Immediate security recommendations and 100% in-browser hash computation",
    ],
  },
  {
    id: "2026-09-04-secret-scanner",
    date: "2026-09-04",
    title: "Secret & API Key Leak Scanner: Client-Side Credential Defense",
    type: "added",
    toolHref: "/secret-scanner",
    toolName: "Secret & API Key Leak Scanner",
    description: "Launched an airgapped credential leak scanner with regex heuristics and Shannon entropy analysis to detect leaked tokens and auto-sanitize source code.",
    highlights: [
      "100% client-side inspection — zero code or secrets ever leave your browser",
      "Detects 14+ credential signatures including AWS, GitHub, OpenAI, Anthropic, Google, Stripe, Slack, and database URIs",
      "Shannon entropy calculation to surface high-entropy pseudo-random secrets lacking standard prefixes",
      "1-Click Auto-Masking to sanitize sensitive files before committing to Git or sharing publicly",
    ],
  },
  {
    id: "2026-09-03-binary-converter-omnidirectional",
    date: "2026-09-03",
    title: "Binary & Base Converter: Omnidirectional Multi-Input",
    type: "improved",
    toolHref: "/binary-converter",
    toolName: "Binary & Base Converter",
    description: "Upgraded the converter to support full omnidirectional input. Edit any of the 6 data representations in real time to synchronize all other formats automatically.",
    highlights: [
      "All 6 representations (Text UTF-8, Binary 8-bit, Hexadecimal, Base58, Base32, Decimal) are now editable inputs",
      "Editing any field automatically decodes and updates all other fields instantaneously",
      "Inline error validation per field (e.g. invalid base58 characters or odd-length hex) without overwriting valid data",
      "Quick action Reset Sample and Clear All buttons with per-field copy buttons",
    ],
  },
  {
    id: "2026-08-31-ai-model-comparator-overhaul",
    date: "2026-08-31",
    title: "AI Model Comparator: Native models.dev Dataset & Advanced Sorting",
    type: "improved",
    toolHref: "/ai-model-comparator",
    toolName: "AI Model Comparator",
    description: "Overhauled the AI Model Comparator to ingest the native models.dev schema verbatim, adding frontier model metrics, context window filters, and smart release sorting.",
    highlights: [
      "Direct models.dev open dataset integration powering real-time frontier LLM comparisons",
      "Default sorting by newest release date with toggleable price, context length, and modality sorting",
      "Comprehensive token pricing breakdown per 1M tokens (input, output, cached, reasoning)",
      "Context window and parameter size filters covering major labs (OpenAI, Anthropic, Google, Meta, DeepSeek)",
    ],
  },
  {
    id: "2025-05-16-batch-6-blockchain-ai",
    date: "2025-05-16",
    title: "8 New Blockchain & AI Engineering Utilities (73 Total)",
    type: "added",
    description: "Expanded the tool catalog with 5 in-browser cryptographic Web3 tools and 3 AI/LLM engineering utilities with models.dev sync support.",
    highlights: [
      "Blockchain: Ethereum Unit & Gas Fee Calculator (Wei/Gwei/ETH), EIP-55 Address Checksum & Validator",
      "Blockchain: Solana SOL/Lamports & Ed25519 Inspector, Keccak-256 Hasher & 4-Byte Selector, Merkle Tree & Airdrop Proof Builder",
      "AI & LLM: AI Model Pricing & Context Matrix (models.dev live sync), Universal Multi-Provider Payload Exporter, Vector Cosine Similarity Calculator",
    ],
  },
  {
    id: "2025-05-15-cyber-terminal-boot",
    date: "2025-05-15",
    title: "Cyber Terminal UI, Boot Sequence & Tmux Telemetry",
    type: "added",
    description: "Enhanced the interface with an authentic terminal experience including Linux kernel boot animation, live telemetry status bar, and CRT scanlines.",
    highlights: [
      "Cyber kernel boot sequence splash screen with quick skip and replay",
      "Realtime Tmux telemetry status bar with UTC clock, memory heap, and 0ms latency",
      "Retro CRT scanline mode with persistent header toggle",
      "ASCII Art glowing hero banner with interactive grep search",
      "Standardized 2-column input/output alignment across converter tools",
    ],
  },
  {
    id: "2025-05-15-notifications-changelog",
    date: "2025-05-15",
    title: "Changelog & Live Notification System",
    type: "added",
    toolHref: "/changelog",
    toolName: "Changelog",
    description: "Added in-app notification bell and dedicated changelog page to keep track of new tools, major updates, and bug fixes.",
    highlights: [
      "Real-time unread badge indicator with local storage sync",
      "Quick notification popover in header",
      "Dedicated /changelog timeline page with type filtering",
    ],
  },
  {
    id: "2025-05-10-batch-5-tools",
    date: "2025-05-10",
    title: "12 New Developer, Media, & Security Utilities",
    type: "added",
    description: "Expanded the tool catalog to 65 total tools with new utilities for developers, audio/video editing, and cybersecurity.",
    highlights: [
      "Network Tools: DNS Lookup, Subnet Calculator, Port Scanner Simulator",
      "Security: CSR Generator, SSL Certificate Decoder, Hash Cracker Simulator",
      "Media: Audio Pitch/Speed Shifter, Video Frame Extractor",
      "Developer: Crontab Guru, JSON to Typescript, SQL to Prisma",
    ],
  },
  {
    id: "2025-05-02-seo-indexnow",
    date: "2025-05-02",
    title: "IndexNow & Search Verification Integration",
    type: "improved",
    description: "Integrated automated IndexNow submission script and enhanced search engine verification tags for faster tool indexing.",
    highlights: [
      "Instant IndexNow ping to Bing and Yandex",
      "Dynamic XML sitemap auto-sync with tool registry",
    ],
  },
  {
    id: "2025-04-25-batch-4-tools",
    date: "2025-04-25",
    title: "15 New Format Converters & Media Utilities",
    type: "added",
    description: "Reaching 53 total tools with rich client-side converters and utilities.",
    highlights: [
      "CSS Tools: Glassmorphism Generator, Neumorphism Generator, Box Shadow Builder",
      "Audio/Video: BPM Tap Tempo, Audio Visualizer, Voice Recorder",
      "Data: YAML to JSON, JSON to CSV, Regex Tester & Debugger",
    ],
  },
  {
    id: "2025-04-18-ui-improvements",
    date: "2025-04-18",
    title: "Responsive Layout & Dark Terminal Optimizations",
    type: "improved",
    description: "Optimized mobile drawer navigation, quick switcher keyboard shortcuts (Cmd/Ctrl + K), and UI space efficiency.",
    highlights: [
      "Enhanced OpenGraph previewer 2-column layout",
      "Instant tool search with keyboard arrow navigation",
      "Zero server latency - 100% client-side privacy architecture",
    ],
  },
];
