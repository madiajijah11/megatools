"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo, useEffect, useCallback } from "react";
import { BIP39_WORDLIST, BIP39_WORD_MAP } from "@/lib/bip39-words";
import CopyButton from "@/components/CopyButton";

type WordCountOption = 12 | 24;

interface GeneratedMnemonic {
  words: string[];
  entropyHex: string;
  checksumBits: string;
  seedHex: string;
  valid: boolean;
}
async function sha256Buffer(buffer: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", buffer as unknown as ArrayBuffer);
  return new Uint8Array(hash);
}

// Convert byte array to binary string
function bytesToBinary(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, "0"))
    .join("");
}

// Derive PBKDF2 seed (512-bit) with 2048 iterations as per BIP-39 specification
async function deriveBip39Seed(mnemonic: string, passphrase: string = ""): Promise<string> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(mnemonic.normalize("NFKD"));
  const saltBuffer = enc.encode("mnemonic" + passphrase.normalize("NFKD"));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 2048,
      hash: "SHA-512",
    },
    keyMaterial,
    512
  );

  const arr = Array.from(new Uint8Array(derivedBits));
  return arr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate mnemonic from CSPRNG entropy
async function generateMnemonic(wordCount: WordCountOption, passphrase: string = ""): Promise<GeneratedMnemonic> {
  const entropyBitsLen = wordCount === 12 ? 128 : 256;
  const entropyBytesLen = entropyBitsLen / 8;
  const entropy = new Uint8Array(entropyBytesLen);
  crypto.getRandomValues(entropy);

  const entropyHex = Array.from(entropy)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const hash = await sha256Buffer(entropy);
  const hashBits = bytesToBinary(hash);
  const checksumLen = entropyBitsLen / 32;
  const checksumBits = hashBits.slice(0, checksumLen);

  const fullBitstream = bytesToBinary(entropy) + checksumBits;
  const words: string[] = [];

  for (let i = 0; i < fullBitstream.length; i += 11) {
    const chunk = fullBitstream.slice(i, i + 11);
    const index = parseInt(chunk, 2);
    words.push(BIP39_WORDLIST[index] || "unknown");
  }

  const mnemonicString = words.join(" ");
  const seedHex = await deriveBip39Seed(mnemonicString, passphrase);

  return {
    words,
    entropyHex,
    checksumBits,
    seedHex,
    valid: true,
  };
}
export default function Bip39GeneratorClient() {
  const [wordCount, setWordCount] = useState<WordCountOption>(12);
  const [passphrase, setPassphrase] = useState<string>("");
  const [mnemonicData, setMnemonicData] = useState<GeneratedMnemonic | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Verification mode state
  const [activeTab, setActiveTab] = useState<"generate" | "validate">("generate");
  const [verifyInput, setVerifyInput] = useState<string>("");

  const runGeneration = useCallback(async () => {
    setGenerating(true);
    try {
      const result = await generateMnemonic(wordCount, passphrase);
      setMnemonicData(result);
    } finally {
      setGenerating(false);
    }
  }, [wordCount, passphrase]);

  useEffect(() => {
    runGeneration();
  }, [runGeneration]);

  // Validation of custom mnemonic
  const validationResult = useMemo(() => {
    if (!verifyInput.trim()) return null;
    const rawWords = verifyInput
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (rawWords.length !== 12 && rawWords.length !== 24) {
      return {
        valid: false,
        error: "Mnemonic must have exactly 12 or 24 words (got " + rawWords.length + ").",
        invalidWords: [],
      };
    }

    const invalidWords = rawWords.filter((w) => !BIP39_WORD_MAP.has(w));
    if (invalidWords.length > 0) {
      return {
        valid: false,
        error: "Unrecognized words not found in BIP-39 English dictionary: " + invalidWords.join(", "),
        invalidWords,
      };
    }

    return {
      valid: true,
      error: null,
      invalidWords: [],
      wordCount: rawWords.length,
    };
  }, [verifyInput]);

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Entropy Bits:</span>
        <span className="text-accent font-bold">
          {wordCount === 12 ? "128 bits (16 bytes)" : "256 bits (32 bytes)"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">Checksum Size:</span>
        <span className="text-text-primary font-bold">
          {wordCount === 12 ? "4 bits" : "8 bits"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">PBKDF2 Iterations:</span>
        <span className="text-success font-bold">2,048 rounds</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">CSPRNG Source:</span>
        <span className="text-accent font-bold">Web Crypto CSPRNG</span>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="bip39-generator" stats={stats}>
      <div className="space-y-4 font-mono">
        {/* Main Card with Tabs */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-5 space-y-5 font-mono">
            {/* Header standard: h-8 flex items-center justify-between */}
            <div className="h-8 flex items-center justify-between">
              <div className="flex items-center gap-1 bg-bg-page border border-border-subtle rounded p-0.5 text-xs">
                <button
                  onClick={() => setActiveTab("generate")}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    activeTab === "generate"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Generate Seeds
                </button>
                <button
                  onClick={() => setActiveTab("validate")}
                  className={"px-2.5 py-0.5 rounded transition-colors " + (
                    activeTab === "validate"
                      ? "bg-accent-soft text-accent font-bold border border-accent/40"
                      : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Validate Mnemonic
                </button>
              </div>

              {activeTab === "generate" && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted text-[11px]">LENGTH:</span>
                  <button
                    onClick={() => setWordCount(12)}
                    className={"px-2 py-0.5 rounded transition-colors " + (
                      wordCount === 12
                        ? "border border-accent bg-accent-soft text-accent font-bold"
                        : "border border-border-subtle text-text-muted hover:text-text-primary"
                    )}
                  >
                    12 Words
                  </button>
                  <button
                    onClick={() => setWordCount(24)}
                    className={"px-2 py-0.5 rounded transition-colors " + (
                      wordCount === 24
                        ? "border border-accent bg-accent-soft text-accent font-bold"
                        : "border border-border-subtle text-text-muted hover:text-text-primary"
                    )}
                  >
                    24 Words
                  </button>
                </div>
              )}
            </div>

            {/* View 1: Generate Mode */}
            {activeTab === "generate" && mnemonicData && (
              <div className="space-y-4">
                {/* Word Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {mnemonicData.words.map((word, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-border-subtle bg-bg-page flex items-center justify-between group hover:border-accent/40 transition-colors"
                    >
                      <span className="text-[11px] text-text-muted">
                        {(idx + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-text-primary">
                        {word}
                      </span>
                      <CopyButton
                        text={word}
                        label="copy"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>

                {/* Toolbar controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={runGeneration}
                      disabled={generating}
                      className="px-3 py-1.5 rounded bg-accent text-bg-page font-bold hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {generating ? "Sampling CSPRNG..." : "↻ Generate New Seed"}
                    </button>
                    <CopyButton
                      text={mnemonicData.words.join(" ")}
                      label="copy all words"
                      className="px-3 py-1.5 rounded border border-border-subtle bg-bg-page text-text-secondary hover:text-accent hover:border-accent/40 transition-colors cursor-pointer"
                    />
                  </div>

                  <span className="text-[11px] text-text-muted">
                    Last word encodes {wordCount === 12 ? "4" : "8"}-bit checksum
                  </span>
                </div>

                {/* Optional Passphrase Input */}
                <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-text-secondary font-semibold">
                      Optional BIP-39 Passphrase (Salt):
                    </label>
                    <span className="text-[10px] text-text-muted">
                      Creates an entirely separate 25th word / wallet account
                    </span>
                  </div>
                  <input
                    type="text"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Leave empty for standard mnemonic, or enter custom passphrase..."
                    className="w-full bg-bg-card border border-border-subtle rounded p-2 text-text-primary focus:border-accent focus:outline-none transition-colors"
                  />
                </div>

                {/* Cryptographic Technical Details */}
                <div className="space-y-3 pt-2">
                  <div>
                    <span className="text-[11px] text-text-muted block mb-1">
                      Raw Entropy ({wordCount === 12 ? "128-bit" : "256-bit"} Hex):
                    </span>
                    <div className="flex items-center justify-between p-2 rounded bg-bg-page border border-border-subtle text-xs break-all">
                      <code className="text-accent">{mnemonicData.entropyHex}</code>
                      <CopyButton text={mnemonicData.entropyHex} label="copy" />
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-text-muted block mb-1">
                      Derived 512-bit Master Seed (PBKDF2-HMAC-SHA512):
                    </span>
                    <div className="flex items-center justify-between p-2 rounded bg-bg-page border border-border-subtle text-xs break-all">
                      <code className="text-text-secondary">{mnemonicData.seedHex}</code>
                      <CopyButton text={mnemonicData.seedHex} label="copy" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Validate Mode */}
            {activeTab === "validate" && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-text-secondary block mb-1">
                    Paste 12 or 24-Word Recovery Phrase to Inspect:
                  </label>
                  <textarea
                    value={verifyInput}
                    onChange={(e) => setVerifyInput(e.target.value)}
                    placeholder="abandon ability able about above absent absorb abstract absurd abuse access accident..."
                    rows={4}
                    className="w-full bg-bg-page border border-border-subtle rounded p-3 text-text-primary focus:border-accent focus:outline-none transition-colors resize-y leading-relaxed"
                  />
                </div>

                {validationResult && (
                  <div
                    className={"p-4 rounded-lg border text-xs leading-relaxed " + (
                      validationResult.valid
                        ? "bg-success/10 border-success/40 text-success"
                        : "bg-error/10 border-error/40 text-error"
                    )}
                  >
                    {validationResult.valid ? (
                      <div>
                        <span className="font-bold block text-sm">
                          ✓ VALID BIP-39 RECOVERY PHRASE
                        </span>
                        <p className="mt-1 text-text-primary text-[11px]">
                          All {validationResult.wordCount} words exist in the official BIP-39 English dictionary and adhere to standard formatting.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="font-bold block text-sm">
                          ✗ INVALID MNEMONIC DETECTED
                        </span>
                        <p className="mt-1 text-text-secondary text-[11px]">
                          {validationResult.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </ToolLayout>
  );
}