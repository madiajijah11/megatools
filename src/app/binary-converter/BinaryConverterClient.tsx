"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

// Base58 Bitcoin Alphabet
const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function bytesToBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return "";
  const digits: number[] = [0];

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
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let str = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str += "1";
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    str += B58_ALPHABET[digits[i]];
  }
  return str;
}

function bytesToBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";

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

function bytesToDec(bytes: Uint8Array): string {
  return Array.from(bytes).join(", ");
}

export default function BinaryConverterClient() {
  const [textInput, setTextInput] = useState("MegaTools 2026");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const converted = useMemo(() => {
    if (!textInput) {
      return {
        binary: "",
        hex: "",
        b58: "",
        b32: "",
        dec: "",
        byteLength: 0,
      };
    }
    const bytes = new TextEncoder().encode(textInput);
    return {
      binary: bytesToBinary(bytes),
      hex: bytesToHex(bytes),
      b58: bytesToBase58(bytes),
      b32: bytesToBase32(bytes),
      dec: bytesToDec(bytes),
      byteLength: bytes.length,
    };
  }, [textInput]);

  const { binary: binaryOutput, hex: hexOutput, b58: b58Output, b32: b32Output, dec: decOutput, byteLength } = converted;

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Byte Count</p>
        <p className="text-text-primary font-mono">{byteLength ? `${byteLength} B` : "—"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Bit Count</p>
        <p className="text-text-primary font-mono">{byteLength ? `${byteLength * 8} bits` : "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Binary &amp; Base Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Real-time multi-base encoding between Text, Binary, Hex, Base58 (Bitcoin/Solana), and Base32.
            </p>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary font-mono">
                UTF-8 Text Input
              </label>
              <button
                onClick={() => setTextInput("")}
                className="text-xs text-text-muted hover:text-text-primary font-mono"
              >
                clear
              </button>
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type or paste any text to convert..."
              className="input-field min-h-[90px] resize-y font-mono text-sm"
            />
          </div>

          {/* Converted Fields */}
          <div className="space-y-4">
            {/* Binary */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-accent font-mono">
                  BINARY (8-bit bytes)
                </label>
                <CopyButton text={binaryOutput} label="copy" />
              </div>
              <textarea
                readOnly
                value={binaryOutput}
                placeholder="Binary stream will appear here..."
                className="output-field min-h-[70px] resize-y font-mono text-xs text-text-primary"
              />
            </div>

            {/* Hexadecimal */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-accent font-mono">
                  HEXADECIMAL (Base16)
                </label>
                <CopyButton text={hexOutput.replace(/\s+/g, "")} label="copy" />
              </div>
              <textarea
                readOnly
                value={hexOutput}
                placeholder="Hexadecimal bytes will appear here..."
                className="output-field min-h-[60px] resize-y font-mono text-xs text-text-primary"
              />
            </div>

            {/* Base58 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-accent font-mono">
                  BASE58 (Bitcoin &amp; Solana format)
                </label>
                <CopyButton text={b58Output} label="copy" />
              </div>
              <input
                type="text"
                readOnly
                value={b58Output}
                placeholder="Base58 string..."
                className="output-field font-mono text-xs text-text-primary min-h-0 py-2"
              />
            </div>

            {/* Base32 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-accent font-mono">
                  BASE32 (RFC 4648)
                </label>
                <CopyButton text={b32Output} label="copy" />
              </div>
              <input
                type="text"
                readOnly
                value={b32Output}
                placeholder="Base32 string..."
                className="output-field font-mono text-xs text-text-primary min-h-0 py-2"
              />
            </div>

            {/* Decimal Bytes */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-text-muted font-mono">
                  DECIMAL BYTES (0-255)
                </label>
                <CopyButton text={decOutput} label="copy" />
              </div>
              <input
                type="text"
                readOnly
                value={decOutput}
                placeholder="Decimal byte array..."
                className="output-field font-mono text-xs text-text-muted min-h-0 py-2"
              />
            </div>
          </div>
        </div>

        {/* Right: Info Panel (desktop) */}
        <div className="hidden lg:block">
          <InfoPanel toolId="binary-converter" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
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
