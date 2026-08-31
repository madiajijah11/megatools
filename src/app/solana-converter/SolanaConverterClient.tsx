"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

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

const KNOWN_PROGRAMS: Record<string, string> = {
  "11111111111111111111111111111111": "Solana System Program (Native)",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "SPL Token Program",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb": "Token-2022 Program (Extensions)",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL": "Associated Token Account Program (ATA)",
  "ComputeBudget111111111111111111111111111111": "Compute Budget Program",
  "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo": "SPL Memo Program",
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s": "Metaplex Token Metadata Program",
};

export default function SolanaConverterClient() {
  // SOL <-> Lamport state
  const [solInput, setSolInput] = useState<string>("1.25");
  const [accountBytes, setAccountBytes] = useState<number>(165); // 165 bytes for SPL Token Account

  // Address validation state
  const [addressInput, setAddressInput] = useState<string>(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Conversion calculations
  const lamportsValue = useMemo(() => {
    const clean = solInput.trim();
    if (!clean || isNaN(Number(clean))) return "0";
    try {
      const [intPart = "0", fracPart = ""] = clean.split(".");
      const paddedFrac = fracPart.padEnd(9, "0").slice(0, 9);
      const combined = `${intPart}${paddedFrac}`;
      return BigInt(combined).toString();
    } catch {
      return "0";
    }
  }, [solInput]);

  // Rent exempt estimation: (128 + accountBytes) * 6960 lamports (approx on-chain constant for 2 years rent)
  const rentExemptLamports = useMemo(() => {
    const b = Math.max(0, accountBytes);
    const lamports = (128 + b) * 6960;
    const sol = (lamports / 1e9).toFixed(6);
    return { lamports: lamports.toLocaleString(), sol };
  }, [accountBytes]);

  // Address validation
  const addressInfo = useMemo(() => {
    const raw = addressInput.trim();
    if (!raw) {
      return { isValid: false, error: "Enter a Solana address", hex: "", program: null };
    }

    try {
      const decoded = base58Decode(raw);
      if (decoded.length !== 32) {
        return {
          isValid: false,
          error: `Decoded length is ${decoded.length} bytes (expected 32 bytes for Ed25519 public key)`,
          hex: "",
          program: null,
        };
      }

      const hex = Array.from(decoded)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      return {
        isValid: true,
        error: null,
        hex: "0x" + hex,
        program: KNOWN_PROGRAMS[raw] || null,
      };
    } catch (e) {
      return {
        isValid: false,
        error: (e as Error).message,
        hex: "",
        program: null,
      };
    }
  }, [addressInput]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Decoded Length</p>
        <p className="text-accent font-mono text-xs font-bold">32 Bytes (256-bit)</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Rent Exemption</p>
        <p className="text-text-primary font-mono text-xs">{rentExemptLamports.sol} SOL</p>
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
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Solana SOL / Lamports Converter & Inspector</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Convert between SOL and Lamports ($10^9$), calculate rent fees, and decode Ed25519 Base58 addresses.
            </p>
          </div>

          {/* SOL <-> Lamport Converter */}
          <div className="mb-8 space-y-4">
            <h3 className="text-xs font-mono font-bold text-text-secondary uppercase tracking-wider">
              [1] SOL ↔ Lamports Unit Conversion
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-text-muted block mb-1">
                  SOL Amount:
                </label>
                <input
                  type="text"
                  value={solInput}
                  onChange={(e) => setSolInput(e.target.value)}
                  placeholder="Enter SOL..."
                  className="w-full p-3 rounded-xl bg-bg-page border border-border-subtle font-mono text-base font-bold text-accent focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-text-muted">
                    Lamports ($10^9$):
                  </label>
                  <CopyButton
                    text={lamportsValue}
                    className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
                  />
                </div>
                <div className="w-full p-3 rounded-xl bg-bg-page border border-border-subtle font-mono text-base font-bold text-text-primary overflow-x-auto select-all">
                  {lamportsValue}
                </div>
              </div>
            </div>

            {/* Rent Exemption Helper */}
            <div className="p-4 rounded-xl border border-border-subtle bg-bg-page/60 mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono text-text-secondary font-bold">
                  Account Rent Exemption Calculator
                </span>
                <div className="flex gap-1 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setAccountBytes(0)}
                    className="px-2 py-0.5 rounded border border-border-subtle hover:border-accent/40 text-text-muted hover:text-text-primary"
                  >
                    Empty (0 B)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountBytes(82)}
                    className="px-2 py-0.5 rounded border border-border-subtle hover:border-accent/40 text-text-muted hover:text-text-primary"
                  >
                    Mint (82 B)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountBytes(165)}
                    className="px-2 py-0.5 rounded border border-border-subtle hover:border-accent/40 text-text-muted hover:text-text-primary"
                  >
                    Token Acc (165 B)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={accountBytes}
                  onChange={(e) => setAccountBytes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-28 p-2 rounded-lg bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
                <span className="text-xs font-mono text-text-muted">Data Bytes</span>
                <span className="text-xs font-mono text-text-muted">→</span>
                <span className="font-mono text-xs text-accent font-bold">
                  {rentExemptLamports.sol} SOL ({rentExemptLamports.lamports} Lamports)
                </span>
              </div>
            </div>
          </div>

          {/* Address Inspector */}
          <div className="border-t border-border-subtle pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-text-secondary uppercase tracking-wider">
                [2] Ed25519 Public Key & Program Inspector
              </h3>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Paste Base58 Solana address..."
                className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs sm:text-sm text-text-primary focus:border-accent focus:outline-none"
                spellCheck={false}
              />
            </div>

            {addressInfo.error ? (
              <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error font-mono text-xs">
                ⚠ {addressInfo.error}
              </div>
            ) : (
              <div className="space-y-3">
                {addressInfo.program && (
                  <div className="p-3 rounded-lg border border-accent/40 bg-accent-soft/30 font-mono text-xs">
                    <span className="text-text-muted">Recognized Program: </span>
                    <span className="text-accent font-bold">{addressInfo.program}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-text-secondary font-bold">
                      Raw Hexadecimal (32-Byte Public Key)
                    </span>
                    <CopyButton
                      text={addressInfo.hex}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="font-mono text-xs text-text-muted break-all select-all">
                    {addressInfo.hex}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="solana-converter" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="solana-converter" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
