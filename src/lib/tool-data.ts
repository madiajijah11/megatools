export interface ToolInfo {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  emoji: string;
  href: string;
  tech: string;
  steps: string[];
  tips: string[];
  example?: { input: string; output: string };
}

export const TOOLS: ToolInfo[] = [
  {
    id: "qrcode",
    title: "QR Code Generator",
    shortTitle: "QR",
    description: "Generate QR codes from text, URLs, or any data. Download as PNG instantly.",
    emoji: "📱",
    href: "/qrcode",
    tech: "Canvas API",
    steps: ["Enter text or URL in the input field", "QR code generates automatically", "Click Download PNG to save"],
    tips: ["Use short URLs for cleaner QR codes", "Test with your phone camera before printing", "High contrast black-and-white scans best"],
    example: { input: "https://example.com", output: "[QR Code Image]" },
  },
  {
    id: "json-formatter",
    title: "JSON Formatter",
    shortTitle: "JSON",
    description: "Format, validate, and beautify JSON data with syntax highlighting.",
    emoji: "📋",
    href: "/json-formatter",
    tech: "Native JSON API",
    steps: ["Paste your JSON into the editor", "Click Format to prettify or Minify to compact", "Use Validate to check for errors"],
    tips: ["Minify before sending to APIs to reduce payload size", "Always validate JSON before parsing in production", "Use pretty-print for debugging, minify for deployment"],
    example: { input: '{"name":"John","age":30}', output: '{\n  "name": "John",\n  "age": 30\n}' },
  },
  {
    id: "password-generator",
    title: "Password Generator",
    shortTitle: "Password",
    description: "Create strong, random passwords with custom length and character sets.",
    emoji: "🔐",
    href: "/password-generator",
    tech: "Crypto API",
    steps: ["Set password length using the slider", "Choose character types (uppercase, lowercase, numbers, symbols)", "Click Generate Password"],
    tips: ["Use at least 16 characters for maximum security", "Include symbols for better entropy", "Never reuse passwords across different sites"],
    example: { input: "Length: 16, All types", output: "Tq8#kL2$pW9&mN4!" },
  },
  {
    id: "uuid-generator",
    title: "UUID Generator",
    shortTitle: "UUID",
    description: "Generate UUID v4 identifiers instantly. One click to copy.",
    emoji: "🆔",
    href: "/uuid-generator",
    tech: "Crypto API",
    steps: ["Click Generate to create a new UUID v4", "Click Copy to copy to clipboard", "Generate as many as you need"],
    tips: ["UUID v4 uses crypto.randomUUID() for true randomness", "128-bit unique — practically impossible to collide", "Use for database keys, session IDs, or file names"],
    example: { input: "Generate", output: "550e8400-e29b-41d4-a716-446655440000" },
  },
  {
    id: "base64",
    title: "Base64 Encode/Decode",
    shortTitle: "Base64",
    description: "Encode text to Base64 or decode Base64 back to readable text.",
    emoji: "🔡",
    href: "/base64",
    tech: "Native Text API",
    steps: ["Select Encode or Decode mode", "Enter your text or Base64 string", "Click Convert and copy the result"],
    tips: ["Great for embedding small images in HTML/CSS", "Base64 is NOT encryption — anyone can decode it", "Use URL-safe Base64 for web parameters"],
    example: { input: "Hello World", output: "SGVsbG8gV29ybGQ=" },
  },
  {
    id: "markdown-preview",
    title: "Markdown Preview",
    shortTitle: "Markdown",
    description: "Write Markdown and see the rendered HTML preview side by side.",
    emoji: "📝",
    href: "/markdown-preview",
    tech: "Native Parser",
    steps: ["Write Markdown in the left editor", "See live preview update on the right", "Copy the preview or source as needed"],
    tips: ["Use code blocks (```) for syntax highlighting", "Headers (# ## ###) create document structure", "Links open in new tab for safety"],
    example: { input: "# Hello\n\n**Bold** text", output: "[Rendered HTML with H1 and bold]" },
  },
  {
    id: "image-compressor",
    title: "Image Compressor",
    shortTitle: "Image",
    description: "Compress images right in your browser. No uploads, no servers.",
    emoji: "🖼️",
    href: "/image-compressor",
    tech: "Canvas API",
    steps: ["Drag & drop or click to upload an image", "Adjust quality with the slider", "Download the compressed image"],
    tips: ["80% quality is the sweet spot for most photos", "Use JPG for photos, PNG for graphics with transparency", "Large images are auto-resized to max 1920px"],
  },
  {
    id: "text-diff",
    title: "Text Diff Checker",
    shortTitle: "Diff",
    description: "Compare two texts and see the differences highlighted line by line.",
    emoji: "🔍",
    href: "/text-diff",
    tech: "LCS Algorithm",
    steps: ["Paste the original text on the left", "Paste the modified text on the right", "Click Compare to see the diff"],
    tips: ["Great for code reviews and document comparison", "Watch out for whitespace-only changes", "Use Copy to get the diff output"],
    example: { input: "hello", output: "hello world (+added)" },
  },
];

export const TOOLS_INFO: Record<string, ToolInfo> = Object.fromEntries(
  TOOLS.map((t) => [t.id, t])
);

export function getToolInfo(toolId: string): ToolInfo | undefined {
  return TOOLS_INFO[toolId];
}
