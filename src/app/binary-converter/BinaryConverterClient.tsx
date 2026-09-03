"use client";

import { useState } from "react";
import CopyButton from "@/components/CopyButton";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";

const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export type FormatId = "text" | "binary" | "hex" | "base58" | "base32" | "decimal";

interface FormatConfig {
  id: FormatId;
  label: string;
  badge: string;
  rows: number;
  placeholder: string;
}

const FORMAT_CONFIGS: FormatConfig[] = [
  {
    id: "text",
    label: "Text (UTF-8)",
    badge: "UTF-8",
    rows: 2,
    placeholder: "Type plain text here...",
  },
  {
    id: "binary",
    label: "Binary",
    badge: "Base 2",
    rows: 2,
    placeholder: "01001101 01100101 01100111 01100001...",
  },
  {
    id: "hex",
    label: "Hexadecimal",
    badge: "Base 16",
    rows: 2,
    placeholder: "4d 65 67 61 54 6f 6f 6c 73...",
  },
  {
    id: "base58",
    label: "Base58",
    badge: "Bitcoin",
    rows: 2,
    placeholder: "VTJNj9eJw7YzFP3iQMj...",
  },
  {
    id: "base32",
    label: "Base32",
    badge: "RFC 4648",
    rows: 2,
    placeholder: "JVSWOYKUN5XWY4ZAGIYDENQ=...",
  },
  {
    id: "decimal",
    label: "Decimal Bytes",
    badge: "0–255",
    rows: 2,
    placeholder: "77, 101, 103, 97, 84, 111, 111...",
  },
];

// Encoders: Uint8Array -> string
function bytesToText(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return "";
  }
}

function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, "0"))
    .join(" ");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function bytesToBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const digits = [0];
  for (let i = 0; i < bytes.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      digits[j] <<= 8;
    }
    digits[0] += bytes[i];
    let carry = 0;
    for (let j = 0; j < digits.length; j++) {
      digits[j] += carry;
      carry = (digits[j] / 58) | 0;
      digits[j] %= 58;
    }
    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }
  return (
    "1".repeat(leadingZeros) +
    digits
      .reverse()
      .map((d) => B58_ALPHABET[d])
      .join("")
  );
}

function bytesToBase32(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  let output = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += B32_ALPHABET[(value << (5 - bits)) & 31];
  }
  while (output.length % 8 !== 0) {
    output += "=";
  }
  return output;
}

function bytesToDecimal(bytes: Uint8Array): string {
  return Array.from(bytes).join(", ");
}

// Decoders: string -> Uint8Array
function textToBytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

function binaryToBytes(input: string): Uint8Array {
  const clean = input.replace(/[\s,]+/g, "");
  if (!clean) return new Uint8Array(0);
  if (!/^[01]+$/.test(clean)) {
    throw new Error("Only '0' and '1' allowed");
  }
  if (clean.length % 8 !== 0) {
    throw new Error(`Incomplete byte (currently ${clean.length} bits, needs multiple of 8)`);
  }
  const bytes = new Uint8Array(clean.length / 8);
  for (let i = 0; i < clean.length; i += 8) {
    bytes[i / 8] = parseInt(clean.slice(i, i + 8), 2);
  }
  return bytes;
}

function hexToBytes(input: string): Uint8Array {
  const clean = input.replace(/0x/gi, "").replace(/[\s,:]+/g, "");
  if (!clean) return new Uint8Array(0);
  if (!/^[0-9a-fA-F]+$/.test(clean)) {
    throw new Error("Contains non-hexadecimal characters");
  }
  if (clean.length % 2 !== 0) {
    throw new Error(`Odd number of characters (${clean.length})`);
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function base58ToBytes(input: string): Uint8Array {
  const str = input.trim();
  if (!str) return new Uint8Array(0);
  let leadingZeros = 0;
  while (leadingZeros < str.length && str[leadingZeros] === "1") {
    leadingZeros++;
  }
  const bytes = [0];
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const val = B58_ALPHABET.indexOf(char);
    if (val === -1) {
      throw new Error(`Invalid Base58 char: '${char}'`);
    }
    let carry = val;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  while (bytes.length > 1 && bytes[bytes.length - 1] === 0) {
    bytes.pop();
  }
  if (str === "1".repeat(leadingZeros)) {
    return new Uint8Array(leadingZeros);
  }
  const result: number[] = [];
  for (let i = 0; i < leadingZeros; i++) {
    result.push(0);
  }
  bytes.reverse();
  result.push(...bytes);
  return new Uint8Array(result);
}

function base32ToBytes(input: string): Uint8Array {
  const str = input.trim().replace(/=+$/, "").toUpperCase().replace(/\s+/g, "");
  if (!str) return new Uint8Array(0);

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const val = B32_ALPHABET.indexOf(char);
    if (val === -1) {
      throw new Error(`Invalid Base32 char: '${char}'`);
    }
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

function decimalToBytes(input: string): Uint8Array {
  const parts = input.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return new Uint8Array(0);
  const bytes: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      throw new Error(`Invalid decimal: '${part}'`);
    }
    const num = Number(part);
    if (num < 0 || num > 255) {
      throw new Error(`Value '${part}' outside 0–255`);
    }
    bytes.push(num);
  }
  return new Uint8Array(bytes);
}

function parseInputToBytes(input: string, mode: FormatId): Uint8Array {
  switch (mode) {
    case "text":
      return textToBytes(input);
    case "binary":
      return binaryToBytes(input);
    case "hex":
      return hexToBytes(input);
    case "base58":
      return base58ToBytes(input);
    case "base32":
      return base32ToBytes(input);
    case "decimal":
      return decimalToBytes(input);
  }
}

function encodeAll(bytes: Uint8Array): Record<FormatId, string> {
  return {
    text: bytesToText(bytes),
    binary: bytesToBinary(bytes),
    hex: bytesToHex(bytes),
    base58: bytesToBase58(bytes),
    base32: bytesToBase32(bytes),
    decimal: bytesToDecimal(bytes),
  };
}

const DEFAULT_TEXT = "MegaTools 2026";
const DEFAULT_BYTES = textToBytes(DEFAULT_TEXT);
const DEFAULT_VALUES = encodeAll(DEFAULT_BYTES);

export default function BinaryConverterClient() {
  const [values, setValues] = useState<Record<FormatId, string>>(DEFAULT_VALUES);
  const [error, setError] = useState<{ field: FormatId; message: string } | null>(null);
  const [lastEditedField, setLastEditedField] = useState<FormatId>("text");
  const [byteLength, setByteLength] = useState<number>(DEFAULT_BYTES.length);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleChange = (field: FormatId, newText: string) => {
    setLastEditedField(field);

    if (!newText.trim()) {
      setValues({
        text: "",
        binary: "",
        hex: "",
        base58: "",
        base32: "",
        decimal: "",
        [field]: newText,
      });
      setError(null);
      setByteLength(0);
      return;
    }

    try {
      const bytes = parseInputToBytes(newText, field);
      const encoded = encodeAll(bytes);
      // Keep exact user input in the field being edited
      encoded[field] = newText;
      setValues(encoded);
      setError(null);
      setByteLength(bytes.length);
    } catch (err) {
      setValues((prev) => ({ ...prev, [field]: newText }));
      setError({
        field,
        message: err instanceof Error ? err.message : "Invalid format",
      });
    }
  };

  const handleClearAll = () => {
    setValues({
      text: "",
      binary: "",
      hex: "",
      base58: "",
      base32: "",
      decimal: "",
    });
    setError(null);
    setByteLength(0);
  };

  const handleResetSample = () => {
    setValues(DEFAULT_VALUES);
    setError(null);
    setLastEditedField("text");
    setByteLength(DEFAULT_BYTES.length);
  };

  const stats = (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Last Edited</p>
        <p className="text-text-primary font-mono text-xs uppercase">{lastEditedField}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Byte Count</p>
        <p className="text-text-primary font-mono">{byteLength ? `${byteLength} bytes` : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Bit Count</p>
        <p className="text-text-primary font-mono">{byteLength ? `${byteLength * 8} bits` : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Sync State</p>
        <p className="text-text-primary font-mono text-xs">
          {error ? (
            <span className="text-error">Syntax Error</span>
          ) : (
            <span className="text-success">6 Formats Synced</span>
          )}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Main Tool Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Binary &amp; Base Converter</span>
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Real-time multi-base converter. Edit any field below to update all representations simultaneously.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleResetSample}
              className="px-3 py-1.5 text-xs font-mono bg-bg-card border border-border-subtle rounded-lg text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors cursor-pointer"
            >
              Reset Sample
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-xs font-mono bg-bg-card border border-border-subtle rounded-lg text-text-muted hover:text-error hover:border-error/40 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="bg-bg-card border border-border-subtle rounded-xl p-5 shadow-lg space-y-4">
          {FORMAT_CONFIGS.map((config) => {
            const hasError = error?.field === config.id;
            const value = values[config.id];

            return (
              <div key={config.id}>
                <div className="h-8 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                      {config.label}
                    </label>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-page border border-border-subtle text-text-secondary">
                      {config.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {value ? <CopyButton text={value} /> : null}
                  </div>
                </div>

                <textarea
                  value={value}
                  onChange={(e) => handleChange(config.id, e.target.value)}
                  placeholder={config.placeholder}
                  rows={config.rows}
                  className={`w-full bg-bg-page border rounded-lg p-3 font-mono text-sm text-text-primary placeholder-text-muted focus:outline-none resize-none transition-colors ${
                    hasError
                      ? "border-error focus:border-error"
                      : "border-border-subtle focus:border-accent"
                  }`}
                />

                {hasError && (
                  <div className="mt-1.5 px-2.5 py-1.5 rounded-md border border-error/30 bg-error/10 text-xs font-mono text-error flex items-center gap-1.5">
                    <span>⚠</span>
                    <span>{error.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 shrink-0">
        <InfoPanel toolId="binary-converter" stats={stats} />
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors cursor-pointer"
        aria-label="View Info"
      >
        ?
      </button>

      {/* Mobile Drawer */}
      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="binary-converter" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
