import Link from "next/link";

const tools = [
  {
    title: "QR Code Generator",
    desc: "Generate QR codes from text, URLs, or any data. Download as PNG instantly.",
    href: "/qrcode",
    emoji: "📱",
  },
  {
    title: "JSON Formatter",
    desc: "Format, validate, and beautify JSON data with syntax highlighting.",
    href: "/json-formatter",
    emoji: "📋",
  },
  {
    title: "Password Generator",
    desc: "Create strong, random passwords with custom length and character sets.",
    href: "/password-generator",
    emoji: "🔐",
  },
  {
    title: "UUID Generator",
    desc: "Generate UUID v4 identifiers instantly. One click to copy.",
    href: "/uuid-generator",
    emoji: "🆔",
  },
  {
    title: "Base64 Encode/Decode",
    desc: "Encode text to Base64 or decode Base64 back to readable text.",
    href: "/base64",
    emoji: "🔡",
  },
  {
    title: "Markdown Preview",
    desc: "Write Markdown and see the rendered HTML preview side by side.",
    href: "/markdown-preview",
    emoji: "📝",
  },
  {
    title: "Image Compressor",
    desc: "Compress images right in your browser. No uploads, no servers.",
    href: "/image-compressor",
    emoji: "🖼️",
  },
  {
    title: "Text Diff Checker",
    desc: "Compare two texts and see the differences highlighted line by line.",
    href: "/text-diff",
    emoji: "🔍",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {/* Hero */}
      <section className="mb-16 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          <span className="text-5xl">✦</span>{" "}
          <span className="gradient-text">Free Tools</span>
          {" "}for Everyone
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-mega-muted">
          Privacy-first tools that run entirely in your browser.
          No uploads, no servers, no tracking. Just fast, useful tools.
        </p>
      </section>

      {/* Tool Grid */}
      <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="glass group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="mb-3 text-3xl">{tool.emoji}</div>
            <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-mega-accent-light transition-colors">
              {tool.title}
            </h3>
            <p className="text-sm leading-relaxed text-mega-muted">
              {tool.desc}
            </p>
          </Link>
        ))}
      </section>

      {/* Features */}
      <section className="mt-20 grid gap-8 rounded-2xl border border-mega-border p-8 glass sm:grid-cols-3 text-center">
        <div>
          <div className="mb-2 text-2xl">🚀</div>
          <h4 className="font-semibold text-white">Blazing Fast</h4>
          <p className="mt-1 text-sm text-mega-muted">All tools run client-side. Instant results.</p>
        </div>
        <div>
          <div className="mb-2 text-2xl">🔒</div>
          <h4 className="font-semibold text-white">100% Private</h4>
          <p className="mt-1 text-sm text-mega-muted">Your data never leaves your device.</p>
        </div>
        <div>
          <div className="mb-2 text-2xl">💰</div>
          <h4 className="font-semibold text-white">Completely Free</h4>
          <p className="mt-1 text-sm text-mega-muted">
            No paywalls. No signups. Just tools that work.
          </p>
        </div>
      </section>
    </div>
  );
}
