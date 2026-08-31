"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

// Base58 Bitcoin alphabet
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(source: Uint8Array): string {
  if (source.length === 0) return "";
  const digits = [0];
  for (let i = 0; i < source.length; i++) {
    for (let j = 0; j < digits.length; j++) {
      digits[j] <<= 8;
    }
    digits[0] += source[i];
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
  for (let i = 0; i < source.length && source[i] === 0; i++) {
    digits.push(0);
  }
  return digits
    .reverse()
    .map((d) => BASE58_ALPHABET[d])
    .join("");
}

function base58Decode(str: string): Uint8Array {
  if (str.length === 0) return new Uint8Array(0);
  const bytes = [0];
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    const val = BASE58_ALPHABET.indexOf(c);
    if (val === -1) throw new Error(`Invalid Base58 character: "${c}"`);
    for (let j = 0; j < bytes.length; j++) {
      bytes[j] *= 58;
    }
    bytes[0] += val;
    let carry = 0;
    for (let j = 0; j < bytes.length; j++) {
      bytes[j] += carry;
      carry = bytes[j] >> 8;
      bytes[j] &= 0xff;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; i < str.length && str[i] === "1"; i++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

// Base32 RFC 4648
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Uint8Array): string {
  let res = "";
  let value = 0;
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      res += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    res += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  while (res.length % 8 !== 0) {
    res += "=";
  }
  return res;
}

function base32Decode(str: string): Uint8Array {
  const clean = str.toUpperCase().replace(/=+$/, "").replace(/[\s-]/g, "");
  const length = clean.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(((length * 5) / 8) | 0);

  for (let i = 0; i < length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) throw new Error(`Invalid Base32 character: "${clean.charAt(i)}"`);
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output;
}

// Z85 / Base85
const Z85_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#";

function z85Encode(bytes: Uint8Array): string {
  if (bytes.length % 4 !== 0) {
    // Pad to 4 bytes for clean Z85 block encoding
    const padded = new Uint8Array(Math.ceil(bytes.length / 4) * 4);
    padded.set(bytes);
    bytes = padded;
  }
  let res = "";
  for (let i = 0; i < bytes.length; i += 4) {
    const value =
      ((bytes[i] << 24) >>> 0) +
      ((bytes[i + 1] << 16) >>> 0) +
      ((bytes[i + 2] << 8) >>> 0) +
      (bytes[i + 3] >>> 0);
    let divisor = 85 * 85 * 85 * 85;
    while (divisor >= 1) {
      const idx = Math.floor(value / divisor) % 85;
      res += Z85_CHARS[idx];
      divisor = Math.floor(divisor / 85);
    }
  }
  return res;
}

function z85Decode(str: string): Uint8Array {
  const clean = str.replace(/\s+/g, "");
  if (clean.length % 5 !== 0) {
    throw new Error("Z85 input length must be a multiple of 5 characters.");
  }
  const out = new Uint8Array((clean.length * 4) / 5);
  let outIdx = 0;
  for (let i = 0; i < clean.length; i += 5) {
    let value = 0;
    for (let j = 0; j < 5; j++) {
      const idx = Z85_CHARS.indexOf(clean[i + j]);
      if (idx === -1) throw new Error(`Invalid Z85 character: "${clean[i + j]}"`);
      value = value * 85 + idx;
    }
    out[outIdx++] = (value >>> 24) & 0xff;
    out[outIdx++] = (value >>> 16) & 0xff;
    out[outIdx++] = (value >>> 8) & 0xff;
    out[outIdx++] = value & 0xff;
  }
  return out;
}

export default function Base58ConverterClient() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [encoding, setEncoding] = useState<"base58" | "base32" | "z85">("base58");
  const [inputText, setInputText] = useState("MegaTools 100% In-Browser Privacy Tools");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { outputText, error, byteLength } = useMemo(() => {
    if (!inputText) return { outputText: "", error: null, byteLength: 0 };
    try {
      if (mode === "encode") {
        const rawBytes = new TextEncoder().encode(inputText);
        let encoded = "";
        if (encoding === "base58") encoded = base58Encode(rawBytes);
        else if (encoding === "base32") encoded = base32Encode(rawBytes);
        else encoded = z85Encode(rawBytes);
        return { outputText: encoded, error: null, byteLength: rawBytes.length };
      } else {
        let decodedBytes: Uint8Array;
        if (encoding === "base58") decodedBytes = base58Decode(inputText.trim());
        else if (encoding === "base32") decodedBytes = base32Decode(inputText.trim());
        else decodedBytes = z85Decode(inputText.trim());

        const text = new TextDecoder().decode(decodedBytes);
        return { outputText: text, error: null, byteLength: decodedBytes.length };
      }
    } catch (err) {
      return { outputText: "", error: (err as Error).message, byteLength: 0 };
    }
  }, [inputText, mode, encoding]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Encoding</p>
        <p className="text-accent font-mono text-xs font-bold uppercase">{encoding}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Byte Size</p>
        <p className="text-text-primary font-mono text-xs">{byteLength} Bytes</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Base58, Base32 & Base85 Multi-Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Encode and decode Bitcoin Base58, IPFS multihashes, Base32 RFC 4648, and Z85 binary strings.
            </p>
          </div>

          {/* Mode & Encoding Toolbars */}
          <div className="mb-6 p-3 rounded-xl bg-bg-page border border-border-subtle flex flex-wrap items-center justify-between gap-3">
            {/* Direction */}
            <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-border-subtle">
              <button
                type="button"
                onClick={() => setMode("encode")}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                  mode === "encode" ? "bg-accent-soft text-accent font-bold" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Encode Text
              </button>
              <button
                type="button"
                onClick={() => setMode("decode")}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                  mode === "decode" ? "bg-accent-soft text-accent font-bold" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Decode String
              </button>
            </div>

            {/* Encoding Standard */}
            <div className="flex items-center gap-1 bg-bg-card p-1 rounded-lg border border-border-subtle">
              {(
                [
                  { id: "base58", label: "Base58 (BTC)" },
                  { id: "base32", label: "Base32 (RFC)" },
                  { id: "z85", label: "Z85 / Base85" },
                ] as const
              ).map((enc) => (
                <button
                  key={enc.id}
                  type="button"
                  onClick={() => setEncoding(enc.id)}
                  className={`px-2.5 py-1.5 text-xs font-mono rounded transition-colors ${
                    encoding === enc.id
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {enc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Input */}
            <div className="flex flex-col space-y-2">
              <div className="h-8 flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  {mode === "encode" ? "Plaintext Input:" : `${encoding.toUpperCase()} Input:`}
                </label>
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText("")}
                    className="text-xs font-mono text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle/60 hover:border-error/40 bg-bg-page/60"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={mode === "encode" ? "Enter plaintext text to encode..." : "Enter encoded string to decode..."}
                rows={12}
                className="w-full h-[280px] p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Right: Output */}
            <div className="flex flex-col space-y-2">
              <div className="h-8 flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  {mode === "encode" ? `${encoding.toUpperCase()} Output:` : "Decoded Plaintext:"}
                </label>
                {outputText && (
                  <CopyButton
                    text={outputText}
                    className="text-xs font-mono px-2 py-1 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 hover:bg-accent-soft transition-colors cursor-pointer"
                  />
                )}
              </div>

              {error ? (
                <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error font-mono text-xs h-[280px]">
                  ⚠ {error}
                </div>
              ) : (
                <div className="relative rounded-xl bg-bg-page border border-border-subtle p-3.5 font-mono text-xs text-accent break-all h-[280px] overflow-y-auto select-all">
                  <pre className="whitespace-pre-wrap">{outputText || "(Converted output will appear here)"}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="base58-converter" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="base58-converter" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
