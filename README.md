# [megatools]$ ✦

> **38 free, client-side developer, media, and cybersecurity tools** — running 100% in your browser. Zero server uploads, zero tracking, total privacy.

🌐 **Live URL**: [megatools-tau.vercel.app](https://megatools-tau.vercel.app)

---

## 🛠️ Complete Tools Directory (38 Tools)

### 📄 PDF & Documents (3)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **Merge PDF** | `/pdf-merge` | `pdf-lib` | Combine multiple PDF files into one with custom page reordering |
| **Split PDF** | `/pdf-split` | `pdf-lib` | Extract specific pages or custom ranges (e.g. `1-3, 5, 8-10`) |
| **Image to PDF** | `/image-to-pdf` | `pdf-lib` + Canvas | Convert multiple photos (PNG/JPG/WebP) into a clean PDF document |

### 🔐 Security & Cryptography (10)
| Tool | Route | Engine | Description |
|---|---|---|---|
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

### 📱 Media, Audio & Video (8)
| Tool | Route | Engine | Description |
|---|---|---|---|
| **Screen & Audio Recorder** | `/screen-recorder` | MediaRecorder API | Record screen, browser tabs, or app windows with mic commentary |
| **Audio Trimmer & Cutter** | `/audio-trimmer` | Web Audio API | Trim and cut MP3/WAV/OGG audio clips with visual waveform in browser |
| **QR Code Generator** | `/qrcode` | `qrcode` + Canvas | Generate custom QR codes from text/URLs and download as PNG |
| **QR Scanner** | `/qr-scanner` | BarcodeDetector API | Decode QR codes from image files locally without external servers |
| **Image Converter** | `/image-converter` | Canvas API | Convert between PNG, JPG, and WebP formats with quality control |
| **Image Compressor** | `/image-compressor` | Canvas API | Compress and resize image dimensions with side-by-side comparison |
| **EXIF & Metadata Stripper** | `/exif-stripper` | Canvas API | Strip GPS coordinates, device tags, and metadata from photos |
| **Favicon & Icon Generator** | `/favicon-generator` | Canvas API | Generate standard icon sizes (16, 32, 48, 180, 192, 512px) + HTML tags |

### 📝 Format & Code (11)
| Tool | Route | Engine | Description |
|---|---|---|---|
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

### ⚙️ Dev & Network (6)
| Tool | Route | Engine | Description |
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

---

## 📄 License

MIT License
