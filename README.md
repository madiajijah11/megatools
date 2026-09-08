# [megatools]$ ✦

> **85 free, client-side developer, media, blockchain, AI, and cybersecurity tools** — running 100% in your browser. Zero server uploads, zero tracking, total privacy.

🌐 **Live URL**: [megatools-tau.vercel.app](https://megatools-tau.vercel.app)

---

## 🛠️ Complete Tools Directory (85 Tools)

### 📄 PDF & Documents (5)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **Merge PDF** | `/pdf-merge` | `pdf-lib` | Combine multiple PDF files into one with custom page reordering |
| **Split PDF** | `/pdf-split` | `pdf-lib` | Extract specific pages or custom ranges (e.g. `1-3, 5, 8-10`) |
| **Image to PDF** | `/image-to-pdf` | `pdf-lib` + Canvas | Convert multiple photos (PNG/JPG/WebP) into a clean PDF document |
| **PDF Page Rotator & Reorder Grid** | `/pdf-organizer` | `pdf-lib` Client Engine | Reorder pages, rotate orientations (90°/180°), and delete pages visually |
| **PDF Watermark & Stamp Studio** | `/pdf-watermark` | `pdf-lib` Client Engine | Stamp diagonal/centered text watermarks across PDF pages with opacity control |

### ⟠ Blockchain & Web3 (6)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **Ethereum Unit & Gas Fee Calculator** | `/eth-unit-converter` | BigInt Precision Math | High-precision conversion between Wei, Gwei, Finney, and ETH with EIP-1559 gas fee estimation |
| **EIP-55 Address Checksum & Validator** | `/eip55-checksum` | Keccak-256 Checksum | Verify EVM wallet addresses and encode lowercase strings to official EIP-55 mixed-case checksums |
| **Solana SOL / Lamports Converter & Inspector** | `/solana-converter` | Base58 & Ed25519 | Convert SOL ↔ Lamports ($10^9$), calculate account rent fees, and decode Ed25519 public keys |
| **Keccak-256 Hasher & 4-Byte Selector** | `/keccak-calculator` | Keccak-256 Engine | Calculate Ethereum Keccak-256 hashes, Solidity 4-byte method selectors, and EVM event topics |
| **Merkle Tree Root & Airdrop Proof Builder** | `/merkle-tree-generator` | Sorted Pair Keccak | Generate cryptographic Merkle roots and OpenZeppelin-compatible verification proofs for airdrops |
| **BIP-39 Mnemonic Seed Phrase Studio** | `/bip39-generator` | BIP-39 & PBKDF2 | Generate 12/24-word recovery phrases, verify checksums, and derive master seeds |

### 🤖 AI & LLM Engineering (5)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **AI Model Pricing & Context Matrix** | `/ai-model-comparator` | models.dev Open API | Real-time cost calculator and specs matrix for 25+ LLM models with models.dev live sync support |
| **Universal AI Payload & SDK Exporter** | `/ai-payload-converter` | Multi-Provider AST | Convert system prompts and parameters into official JSON payloads for OpenAI, Claude, Gemini, and Ollama |
| **Vector Cosine Similarity & Distance Engine** | `/vector-similarity` | Vector Math Engine | Calculate Cosine Similarity, Dot Product, Euclidean (L2), and Manhattan (L1) metrics for AI embeddings |
| **RAG Document Chunker & Splitter** | `/rag-chunker` | Recursive Splitting | Partition documents into semantic chunks with overlap visualizer and Vector DB export |
| **Structured System Prompt Architect** | `/prompt-architect` | Prompt AST | Engineer hardened XML/Markdown system prompts with guardrails and few-shot examples |

### 🔐 Security & Cryptography (16)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **WebRTC IP Leak & VPN Shield Tester** | `/webrtc-leak` | WebRTC STUN & ICE | Detect real IP leaks bypassing VPN tunnels via browser STUN candidate probes |
| **Pwned Password & Data Breach Checker** | `/pwned-checker` | HIBP k-Anonymity & SHA-1 | Check password exposures against 800M+ breach records with mathematical privacy |
| **Secret & API Key Leak Scanner** | `/secret-scanner` | Shannon Entropy & Regex | Detect leaked cloud keys, tokens, and DB credentials client-side with 1-click auto-masking |
| **HMAC Hash & Signature Generator** | `/hmac-generator` | Web Crypto API | Compute & verify HMAC (SHA-256, SHA-512, SHA-384, SHA-1) signatures |
| **RSA & ECDSA Key Pair Generator** | `/keypair-generator` | Web Crypto API | Generate asymmetric keys (RSA 2048/4096-bit, ECDSA P-256/P-384) in PEM format |
| **Password Entropy & Strength Analyzer** | `/password-analyzer` | Shannon Entropy | Evaluate password entropy bits, GPU crack time, and security weaknesses |
| **Security Headers Generator** | `/security-headers` | Config Generator | Generate hardened HTTP headers (CSP, HSTS, X-Frame-Options) for Nginx, Vercel, Apache |
| **SSL / X.509 Certificate Inspector** | `/cert-inspector` | ASN.1 Parser | Parse PEM certificates & CSRs locally, inspect validity, SANs, and issuer |
| **Binary & Base Converter** | `/binary-converter` | Bitwise Math | Real-time multi-base converter (Text, Binary, Hex, Base58, Base32, Decimal) |
| **Hash Generator** | `/hash-generator` | Web Crypto API | Compute SHA-1, SHA-256, SHA-384, and SHA-512 hashes simultaneously |
| **AES Encrypt / Decrypt** | `/aes-crypto` | Web Crypto API | Encrypt/decrypt text using AES-256-GCM + PBKDF2 (150,000 iterations) |
| **JWT Decoder** | `/jwt-decoder` | Native Text API | Decode header & payload, inspect claims, and check expiry status |
| **Large File Hasher** | `/file-checksum` | Web Crypto (Chunked) | Compute checksums for files of any size with hash integrity verifier |
| **Password Generator** | `/password-generator` | Crypto API | Create strong, cryptographically random passwords with custom sets |
| **UUID Generator** | `/uuid-generator` | `crypto.randomUUID` | Generate UUID v4 identifiers (single or bulk up to 100) |
| **Image Steganography** | `/steganography` | Canvas Pixel LSB | Hide secret messages in image pixels or extract hidden payloads |

### 📱 Media, Audio & Video (11)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **SVG to PNG / JPG / WebP Converter** | `/svg-converter` | Canvas Rasterizer | Rasterize & upscale vector SVG files to 1x, 2x, 4x bitmap images |
| **Image Color Palette Extractor** | `/color-extractor` | Color Quantization | Extract dominant palettes, HEX/RGB/HSL, and CSS variables from images |
| **Screen & Audio Recorder** | `/screen-recorder` | MediaRecorder API | Record screen, browser tabs, or app windows with mic commentary |
| **Audio Trimmer & Cutter** | `/audio-trimmer` | Web Audio API | Trim and cut MP3/WAV/OGG audio clips with visual waveform in browser |
| **QR Code Generator** | `/qrcode` | `qrcode` + Canvas | Generate custom QR codes from text/URLs and download as PNG |
| **QR Scanner** | `/qr-scanner` | BarcodeDetector API | Decode QR codes from image files locally without external servers |
| **Image Converter** | `/image-converter` | Canvas API | Convert between PNG, JPG, and WebP formats with quality control |
| **Image Compressor** | `/image-compressor` | Canvas API | Compress and resize image dimensions with side-by-side comparison |
| **EXIF & Metadata Stripper** | `/exif-stripper` | Canvas API | Strip GPS coordinates, device tags, and metadata from photos |
| **Favicon & Icon Generator** | `/favicon-generator` | Canvas API | Generate standard icon sizes (16, 32, 48, 180, 192, 512px) + HTML tags |
| **Web Audio Tone & Frequency Synthesizer** | `/tone-generator` | Web Audio API | Generate pure tones (20Hz-20kHz), binaural beats, and colored noise with oscilloscope |

### 📝 Format & Code (17)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **cURL to Code Converter** | `/curl-converter` | Shell AST Parser | Convert cURL commands into JavaScript fetch, Python requests, Axios, and Go code |
| **JSON to TypeScript & Zod Schema** | `/json-to-ts` | AST Generator | Infer TypeScript interfaces, types, and Zod validation schemas from JSON |
| **HTML / SVG to JSX Converter** | `/html-to-jsx` | Regex AST | Convert raw HTML and SVG into React/JSX with camelCase attributes & style objects |
| **String & Regex Escaper / Unescaper** | `/string-escape` | String Encoding | Escape & unescape text for JSON, JS, SQL, RegEx, Shell, and HTML |
| **CSS Glassmorphism & Shadow Generator** | `/css-generator` | CSS3 Engine | Visual generator for Glassmorphism, Box Shadows / Glow, and Gradients |
| **OpenGraph & Social Meta Tag Previewer** | `/og-previewer` | OG Parser | Preview social cards for Google, Twitter/X, Discord, FB and export meta tags |
| **SQL Formatter & Beautifier** | `/sql-formatter` | `sql-formatter` | Format, indent, and beautify SQL queries (PostgreSQL, MySQL, SQLite) |
| **HTML & CSS Minifier** | `/code-minifier` | Regex Parser | Minify or beautify HTML and CSS code to optimize website load speeds |
| **SVG Optimizer & Cleaner** | `/svg-optimizer` | DOM Parser | Clean and minify SVG vector files by stripping editor bloat & metadata |
| **JSON Formatter** | `/json-formatter` | Native JSON API | Format, validate, and minify JSON with syntax highlighting |
| **Base64 Encode/Decode** | `/base64` | `TextEncoder`/`Decoder` | Encode and decode Base64 strings with UTF-8 support |
| **URL Encoder/Decoder** | `/url-encoder` | Native Text API | Encode and decode query params or full URLs safely |
| **CSV ↔ JSON Converter** | `/csv-json` | Native String/Regex | Bidirectional CSV/JSON converter with auto-delimiter detection |
| **YAML ↔ JSON Converter** | `/yaml-json` | `js-yaml` | Convert between YAML and JSON with line-number error reporting |
| **Text Diff Checker** | `/text-diff` | LCS Algorithm | Compare two texts and highlight line-by-line differences |
| **Text Transformer** | `/text-transformer` | String Ops | 10 case converters (camel, snake, kebab...) & HTML entity encoder |
| **Markdown Preview** | `/markdown-preview` | `@mdx-js/mdx` | Live Markdown and MDX renderer with sanitized output |
| **Base64 Data URL & Asset Embedder** | `/data-url` | FileReader API | Convert images, fonts, and SVGs into RFC 2397 Data URLs & CSS rules |

### ⚙️ Dev & Network (12)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **RDAP Domain & Registration Inspector** | `/rdap-lookup` | ICANN RDAP Protocol | Query domain registration, expiration, transfer locks, and IP ownership |
| **DNS over HTTPS (DoH) Lookup** | `/dns-lookup` | Cloudflare & Google DoH | Query A, AAAA, MX, TXT, CNAME, NS, SOA records with DNSSEC validation |
| **Cron Expression Generator & Parser** | `/cron-parser` | Cron Engine | Parse and explain crontab schedules in plain English & calculate upcoming runs |
| **HTTP Status Codes & Headers Explorer** | `/http-status` | RFC Directory | Searchable directory for HTTP status codes (100–599) and common headers |
| **Keyboard Event & KeyCode Tester** | `/keycode-tester` | KeyboardEvent API | Inspect event.key, code, legacy keyCode, and modifier keys in real time |
| **IPv6 & Subnet Calculator** | `/ipv6-calculator` | Bitwise IPv6 Engine | Expand, compress, calculate CIDR subnet ranges, and inspect address scopes |
| **Common Ports Reference** | `/port-lookup` | Port Database | Database of standard & security-sensitive TCP/UDP ports with risk notes |
| **Color Contrast & Palette** | `/color-contrast` | Color Science | WCAG 2.1 contrast ratio checker (AA/AAA) with HEX/RGB/HSL conversions |
| **Timestamp Converter** | `/timestamp-converter` | Date / Intl API | Convert Unix timestamps (s/ms auto-detect) to dates with live ticker |
| **Regex Tester** | `/regex-tester` | Native RegExp | Live regex testing with match highlighting and capture group breakdowns |
| **Chmod Calculator** | `/chmod-calculator` | Bitwise Logic | Interactive permission checkbox grid ↔ octal & symbolic notation |
| **CIDR Calculator** | `/cidr-calculator` | Pure Math | IPv4 subnet calculator (network, broadcast, netmask, usable hosts) |
|---|---|---|---|
| **Common Ports Reference** | `/port-lookup` | Port Database | Database of standard & security-sensitive TCP/UDP ports with risk notes |
| **Color Contrast & Palette** | `/color-contrast` | Color Science | WCAG 2.1 contrast ratio checker (AA/AAA) with HEX/RGB/HSL conversions |
| **Timestamp Converter** | `/timestamp-converter` | Date / Intl API | Convert Unix timestamps (s/ms auto-detect) to dates with live ticker |
| **Regex Tester** | `/regex-tester` | Native RegExp | Live regex testing with match highlighting and capture group breakdowns |
| **Chmod Calculator** | `/chmod-calculator` | Bitwise Logic | Interactive permission checkbox grid ↔ octal & symbolic notation |
| **CIDR Calculator** | `/cidr-calculator` | Pure Math | IPv4 subnet calculator (network, broadcast, netmask, usable hosts) |

---

## 💻 Tech Stack & Architecture

- **Framework**: Next.js 16 (App Router + Turbopack) + React 19
- **Language**: TypeScript 5 (Strict mode)
- **Styling**: Tailwind CSS v4 (`@theme inline` Dark Terminal aesthetic)
- **Analytics**: `@vercel/analytics`
- **Dependencies**:
  - `pdf-lib` — In-browser PDF manipulation
  - `js-yaml` — In-browser YAML parsing
  - `sql-formatter` — In-browser SQL query formatting
  - `qrcode` — QR code rendering
  - `@mdx-js/mdx` & `@mdx-js/react` — Markdown/MDX parser

---

## 🖥️ Terminal & Hacker Features

- **Cyber Boot Sequence** (`BootSplash`): Fast Linux kernel initialization splash on first visit, replayable anytime via status bar.
- **CRT Scanline Mode** (`[CRT: ON/OFF]`): Retro CRT monitor scanlines and phosphor glow toggle with local persistence.
- **Tmux Telemetry Status Bar**: Real-time UTC clock, heap memory estimate, and client latency monitoring.
- **Notification & Changelog**: Realtime unread indicator and complete release timeline at `/changelog`.
- **System Architecture**: Detailed in [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## ⚡ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build with type-checking
npm run build

# Run linter
npm run lint
```

---

## ☕ Support the Project

If MegaTools saves you time, support the project via crypto:

- **BTC**: `bc1q3aej7x9wlvl54syt4qm48xcdn6zqa64cm6dwj6`
- **ETH**: `0xae69f5bcf7762bb5fe34d3832fd7d1954054674b`
- **SOL**: `6Et2XmHSdAD4QBR9Apdt9AVeJ77ktr1piV49q7RD4SLk`
- **KAS**: `kaspa:qypgw7xw60yvxv5pcjncdv4f30wanju0g64hw3204wreayajt3025qgde344ycq`

---

## 📄 License

MIT License
