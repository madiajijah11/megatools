# Implementation Plan: Batch 2 Multimedia, PDF & Developer Tools (10 New Tools)

## Overview
Add 10 new high-utility, 100% browser-side tools to MegaTools following the existing terminal/cybersecurity dark aesthetic (`#0a0f0d`, `#4ade80`, monospace font, standard two-column layout + InfoPanel).

Dependencies required:
- `pdf-lib` (installed) — for PDF manipulation in browser
- `js-yaml` & `@types/js-yaml` (installed) — for YAML <-> JSON

---

## Tool Specifications

| Slug | Title | Key Tech | Description |
|---|---|---|---|
| `pdf-merge` | Merge PDF | `pdf-lib` | Combine multiple PDF files into one with reordering |
| `pdf-split` | Split PDF | `pdf-lib` | Extract specific pages or split by page ranges |
| `image-to-pdf` | Image to PDF | `pdf-lib` + Canvas | Convert multiple images (PNG/JPG/WebP) into a clean PDF |
| `image-converter` | Image Converter | Canvas API | Convert between PNG, JPG, WebP, BMP with quality slider |
| `exif-stripper` | EXIF & Metadata Stripper | Canvas API | Strip GPS, camera tags, and metadata for privacy |
| `steganography` | Image Steganography | Canvas LSB | Hide & extract encrypted secret text in image pixels |
| `csv-json` | CSV ↔ JSON Converter | Native String/Regex | Bidirectional CSV/JSON parser with delimiter detection |
| `yaml-json` | YAML ↔ JSON Converter | `js-yaml` | Convert YAML to JSON and JSON to YAML with line errors |
| `favicon-generator` | Favicon & App Icon Generator | Canvas API | Generate 16x16, 32x32, 180x180, 192x192, 512x512 + HTML tags |
| `file-checksum` | Large File Hasher | Web Crypto (Chunked) | Compute SHA-256/512/384/SHA-1 for large files with chunking |

---

## Phase 1: Tool Registry & Metadata Updates
- Edit `src/lib/tool-data.ts` to add the 10 tool entries (steps, tips, tech, examples).
- Verify `src/app/sitemap.ts` auto-includes the 10 new routes from `TOOLS`.

## Phase 2: PDF Tool Implementations
- **Task 2.1: PDF Merge (`/pdf-merge`)**
  - `src/app/pdf-merge/page.tsx`
  - `src/app/pdf-merge/PdfMergeClient.tsx`
  - Drag & drop multiple PDFs, list with up/down/delete controls, merge button, progress status, download `merged.pdf`.
- **Task 2.2: PDF Split (`/pdf-split`)**
  - `src/app/pdf-split/page.tsx`
  - `src/app/pdf-split/PdfSplitClient.tsx`
  - Single PDF upload, page count display, range input (`1-3, 5, 8`), extract selected pages or individual page downloads.
- **Task 2.3: Image to PDF (`/image-to-pdf`)**
  - `src/app/image-to-pdf/page.tsx`
  - `src/app/image-to-pdf/ImageToPdfClient.tsx`
  - Multi-image upload, thumbnail grid with reordering, orientation (auto/portrait/landscape), margin controls, convert & download `document.pdf`.

## Phase 3: Image & Privacy Tools
- **Task 3.1: Image Converter (`/image-converter`)**
  - `src/app/image-converter/page.tsx`
  - `src/app/image-converter/ImageConverterClient.tsx`
  - Dropzone, target format selector (PNG, JPEG, WebP), quality slider for lossy formats, instant preview & download.
- **Task 3.2: EXIF Stripper (`/exif-stripper`)**
  - `src/app/exif-stripper/page.tsx`
  - `src/app/exif-stripper/ExifStripperClient.tsx`
  - Upload image -> render to offscreen canvas -> export pure image data -> compare original vs cleaned size, download sanitized image.
- **Task 3.3: Image Steganography (`/steganography`)**
  - `src/app/steganography/page.tsx`
  - `src/app/steganography/SteganographyClient.tsx`
  - Encode tab: Upload cover image + secret message -> LSB embed (32-bit length header + 8-bit chars) -> export lossless PNG.
  - Decode tab: Upload encoded PNG -> extract LSB bits -> display decoded secret text + CopyButton.

## Phase 4: Data & Format Converters
- **Task 4.1: CSV ↔ JSON (`/csv-json`)**
  - `src/app/csv-json/page.tsx`
  - `src/app/csv-json/CsvJsonClient.tsx`
  - Mode toggle, automatic delimiter detection (`,`, `;`, `\t`), format options (array of objects vs array of arrays, indent 2/4/minified), download file buttons.
- **Task 4.2: YAML ↔ JSON (`/yaml-json`)**
  - `src/app/yaml-json/page.tsx`
  - `src/app/yaml-json/YamlJsonClient.tsx`
  - Mode toggle, `js-yaml.load` & `js-yaml.dump`, syntax error highlighting with line/column numbers, indent options.

## Phase 5: Icons & File Security Tools
- **Task 5.1: Favicon Generator (`/favicon-generator`)**
  - `src/app/favicon-generator/page.tsx`
  - `src/app/favicon-generator/FaviconGeneratorClient.tsx`
  - Upload master image -> generate standard sizes (16, 32, 48, 180, 192, 512), preview grid, individual PNG download, ready-to-paste `<link>` HTML tags.
- **Task 5.2: Large File Hasher / Checksum (`/file-checksum`)**
  - `src/app/file-checksum/page.tsx`
  - `src/app/file-checksum/FileChecksumClient.tsx`
  - Chunked `FileReader` (2MB chunks) with progress bar, computes SHA-256, SHA-512, SHA-384, SHA-1, checksum verification input (compare hash -> match/mismatch badge).

## Phase 6: Quality Assurance & Verification
- Run `npm run lint` (0 errors).
- Run `npm run build` (34/34 static pages generated).
- Start background server & verify all 31 total routes return HTTP 200.
