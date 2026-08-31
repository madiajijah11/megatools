"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";
import { toChecksumAddress, keccak256Hex } from "@/lib/keccak";

const SAMPLE_ADDRESSES = [
  "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
  "0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359",
  "0xdbf03b407c01e7cd3cbea99509d93f8dddc8c6fb",
  "0xd1220a0cf47c7b9be7a2e6ba89f429762e7b9adb",
];

export default function Eip55ChecksumClient() {
  const [addressInput, setAddressInput] = useState<string>(SAMPLE_ADDRESSES[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const analysis = useMemo(() => {
    const raw = addressInput.trim();
    if (!raw) {
      return {
        isValid: false,
        error: "Enter an Ethereum / EVM address",
        checksummed: "",
        lowercase: "",
        uppercase: "",
        keccakHash: "",
        status: "EMPTY",
      };
    }

    const clean = raw.startsWith("0x") ? raw.slice(2) : raw;
    if (clean.length !== 40 || !/^[0-9a-fA-F]{40}$/.test(clean)) {
      return {
        isValid: false,
        error: `Invalid address length (${clean.length}/40 hex chars) or contains invalid characters`,
        checksummed: "",
        lowercase: "",
        uppercase: "",
        keccakHash: "",
        status: "INVALID",
      };
    }

    try {
      const checksummed = toChecksumAddress(raw);
      const lower = "0x" + clean.toLowerCase();
      const upper = "0x" + clean.toUpperCase();
      const hash = keccak256Hex(clean.toLowerCase());

      let status = "CHECKSUMMED_VALID";
      if (raw === lower) {
        status = "ALL_LOWERCASE";
      } else if (raw === upper) {
        status = "ALL_UPPERCASE";
      } else if (raw !== checksummed) {
        status = "CHECKSUM_CORRUPTED";
      }

      return {
        isValid: status !== "CHECKSUM_CORRUPTED",
        error:
          status === "CHECKSUM_CORRUPTED"
            ? "WARNING: Address has mixed case but does NOT match EIP-55 checksum! Possible typo or corruption."
            : null,
        checksummed,
        lowercase: lower,
        uppercase: upper,
        keccakHash: "0x" + hash,
        status,
      };
    } catch (e) {
      return {
        isValid: false,
        error: (e as Error).message,
        checksummed: "",
        lowercase: "",
        uppercase: "",
        keccakHash: "",
        status: "INVALID",
      };
    }
  }, [addressInput]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Validation Status</p>
        <p
          className={`font-mono text-xs font-bold uppercase ${
            analysis.status === "CHECKSUMMED_VALID"
              ? "text-success"
              : analysis.status === "CHECKSUM_CORRUPTED" || analysis.status === "INVALID"
              ? "text-error"
              : "text-warning"
          }`}
        >
          {analysis.status}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Standard</p>
        <p className="text-accent font-mono text-xs">EIP-55 (Keccak-256)</p>
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
              <span className="gradient-text">EIP-55 Address Checksum & Validator</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Verify EVM wallet addresses and convert lowercase strings to official EIP-55 checksum format.
            </p>
          </div>

          {/* Sample Presets */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-mono text-text-muted">Sample Wallets:</span>
            {SAMPLE_ADDRESSES.map((addr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setAddressInput(addr)}
                className="px-2.5 py-1 text-xs font-mono rounded border border-border-subtle bg-bg-page/60 text-text-secondary hover:text-accent hover:border-accent/40 transition-colors"
              >
                Sample #{idx + 1}
              </button>
            ))}
          </div>

          {/* Input Address */}
          <div className="mb-6 space-y-2">
            <div className="h-8 flex items-center justify-between">
              <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                Input EVM Address (0x...):
              </label>
              {addressInput && (
                <button
                  type="button"
                  onClick={() => setAddressInput("")}
                  className="text-xs font-mono text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle/60 bg-bg-page/60"
                >
                  Clear
                </button>
              )}
            </div>
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="0x..."
              className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-sm sm:text-base text-text-primary focus:border-accent focus:outline-none"
              spellCheck={false}
            />
          </div>

          {/* Status Alert */}
          {analysis.error && (
            <div className="p-3.5 mb-6 rounded-xl bg-error/10 border border-error/30 text-error font-mono text-xs">
              ⚠ {analysis.error}
            </div>
          )}

          {analysis.status === "CHECKSUMMED_VALID" && (
            <div className="p-3.5 mb-6 rounded-xl bg-success/10 border border-success/30 text-success font-mono text-xs flex items-center gap-2">
              <span>✔ Address is 100% valid with authentic EIP-55 mixed-case checksum.</span>
            </div>
          )}

          {analysis.status === "ALL_LOWERCASE" && (
            <div className="p-3.5 mb-6 rounded-xl bg-warning/10 border border-warning/30 text-warning font-mono text-xs flex items-center gap-2">
              <span>ℹ Address format is valid all-lowercase. Checksummed version is generated below.</span>
            </div>
          )}

          {/* Output Cards */}
          {analysis.checksummed && (
            <div className="space-y-4 border-t border-border-subtle pt-6">
              {/* EIP-55 Checksum Result */}
              <div className="p-4 rounded-xl border border-accent/40 bg-accent-soft/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-accent font-bold uppercase">
                    EIP-55 Checksummed Address (Recommended)
                  </span>
                  <CopyButton
                    text={analysis.checksummed}
                    className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 hover:bg-accent-soft transition-colors cursor-pointer"
                  />
                </div>
                <div className="font-mono text-base sm:text-lg font-bold text-accent break-all select-all py-1">
                  {analysis.checksummed}
                </div>
                <p className="text-[11px] font-mono text-text-muted mt-1">
                  Safe for transfers on Ethereum, Arbitrum, Optimism, Polygon, and BSC.
                </p>
              </div>

              {/* Lowercase & Uppercase grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-text-secondary font-bold">
                      Normalized Lowercase
                    </span>
                    <CopyButton
                      text={analysis.lowercase}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="font-mono text-xs text-text-primary break-all select-all">
                    {analysis.lowercase}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-bg-page border border-border-subtle">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-text-secondary font-bold">
                      Keccak-256 Pre-image Hash
                    </span>
                    <CopyButton
                      text={analysis.keccakHash}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="font-mono text-xs text-text-muted break-all select-all">
                    {analysis.keccakHash}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="eip55-checksum" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="eip55-checksum" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
