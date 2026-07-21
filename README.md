# MegaTools ✦

**8 free, client-side developer tools** — right in your browser. No uploads, no servers, no tracking.

👉 [megatools.vercel.app](https://megatools.vercel.app)

## Tools

| Tool | Description |
|---|---|
| 📱 QR Code Generator | Generate QR codes from text/URLs, download as PNG |
| 📋 JSON Formatter | Format, minify, and validate JSON |
| 🔐 Password Generator | Create strong, random passwords with custom options |
| 🆔 UUID Generator | Generate UUID v4 identifiers (single or bulk) |
| 🔡 Base64 Encode/Decode | Encode text to Base64 or decode it back |
| 📝 Markdown Preview | Write Markdown with live rendered preview (supports .md and .mdx) |
| 🖼️ Image Compressor | Compress images via canvas — drag & drop, adjust quality |
| 🔍 Text Diff Checker | Compare two texts with line-by-line diff highlighting |

## Tech Stack

- **Next.js 16** (App Router) + React 19
- **TypeScript** — all client components
- **Tailwind CSS v4** — `@theme inline` tokens, no config file
- **Vercel** — deployment

All processing happens client-side using native browser APIs (Canvas, Crypto, TextEncoder, clipboard). The only npm dependency beyond Next/React is `qrcode` for QR generation.

## Development

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # Production build with type-checking
```

## Project Structure

```
src/
  app/
    globals.css              # Tailwind + design tokens + utilities
    layout.tsx               # Root layout, header, footer, JSON-LD
    page.tsx                 # Homepage with search and tool grid
    sitemap.ts / robots.ts   # SEO
    <tool-name>/
      page.tsx               # Server component (metadata)
      <Tool>Client.tsx       # Interactive client component
  components/
    InfoPanel.tsx             # Tips, stats, examples sidebar
    MobileInfoDrawer.tsx      # Mobile slide-in drawer
    CopyButton.tsx            # Clipboard copy with feedback
    TechBadge.tsx             # Tech label pill
    QuickSwitchBar.tsx        # Top navigation bar
  lib/
    tool-data.ts              # Tool definitions and metadata
```

## License

MIT
