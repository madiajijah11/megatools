"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";
import { keccak256Hex, keccak256 } from "@/lib/keccak";

const COMMON_SIGNATURES = [
  { label: "transfer(address,uint256)", desc: "ERC-20 standard transfer" },
  { label: "transferFrom(address,address,uint256)", desc: "ERC-20 delegated transfer" },
  { label: "approve(address,uint256)", desc: "ERC-20 token allowance" },
  { label: "balanceOf(address)", desc: "ERC-20 balance check" },
  { label: "Transfer(address,address,uint256)", desc: "ERC-20 transfer event topic" },
  { label: "Approval(address,address,uint256)", desc: "ERC-20 approval event topic" },
];

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "").replace(/\s+/g, "");
  if (clean.length % 2 !== 0) throw new Error("Hex string must have an even number of characters");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    const b = parseInt(clean.slice(i, i + 2), 16);
    if (isNaN(b)) throw new Error(`Invalid hex byte at index ${i}`);
    bytes[i / 2] = b;
  }
  return bytes;
}

export default function KeccakCalculatorClient() {
  const [mode, setMode] = useState<"text" | "hex" | "solidity">("solidity");
  const [inputVal, setInputVal] = useState<string>("transfer(address,uint256)");
  const result = useMemo(() => {
    const raw = inputVal.trim();
    if (!raw) {
      return { hash: "", selector: "", bytesLength: 0, error: null };
    }

    try {
      let hashHex = "";
      if (mode === "hex") {
        const bytes = hexToBytes(raw);
        hashHex = Array.from(keccak256(bytes))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } else {
        // Strip spaces for Solidity canonical signatures (e.g. transfer(address, uint256) -> transfer(address,uint256))
        const canonical = mode === "solidity" ? raw.replace(/\s+/g, "") : inputVal;
        hashHex = keccak256Hex(canonical);
      }

      return {
        hash: "0x" + hashHex,
        selector: "0x" + hashHex.slice(0, 8),
        bytesLength: 32,
        error: null,
      };
    } catch (err) {
      return {
        hash: "",
        selector: "",
        bytesLength: 0,
        error: (err as Error).message,
      };
    }
  }, [inputVal, mode]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Hash Output</p>
        <p className="text-accent font-mono text-xs font-bold">256 bits (32 B)</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Function Selector</p>
        <p className="text-text-primary font-mono text-xs">4 Bytes (8 Hex)</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="keccak-calculator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Mode Selector */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
            <div className="flex items-center gap-1 bg-bg-page p-1 rounded-lg border border-border-subtle font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("solidity");
                  setInputVal("transfer(address,uint256)");
                }}
                className={`px-3 py-1.5 rounded transition-colors ${
                  mode === "solidity"
                    ? "bg-accent-soft text-accent font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Solidity Signature
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("text");
                  setInputVal("Hello Ethereum");
                }}
                className={`px-3 py-1.5 rounded transition-colors ${
                  mode === "text"
                    ? "bg-accent-soft text-accent font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                UTF-8 Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("hex");
                  setInputVal("0x123456789abcdef0");
                }}
                className={`px-3 py-1.5 rounded transition-colors ${
                  mode === "hex"
                    ? "bg-accent-soft text-accent font-bold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                Hex Bytes
              </button>
            </div>

            {mode === "solidity" && (
              <span className="text-[11px] font-mono text-text-muted">
                Spaces auto-trimmed to canonical format
              </span>
            )}
          </div>

          {/* Preset Buttons for Solidity */}
          {mode === "solidity" && (
            <div className="mb-4">
              <span className="text-xs font-mono text-text-muted block mb-2">
                Common ERC Signatures:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SIGNATURES.map((sig, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputVal(sig.label)}
                    title={sig.desc}
                    className="px-2 py-1 text-xs font-mono rounded border border-border-subtle bg-bg-page/60 text-text-secondary hover:border-accent/40 hover:text-accent transition-colors"
                  >
                    {sig.label.split("(")[0]}(...)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="mb-6 space-y-2">
            <div className="h-8 flex items-center justify-between">
              <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                {mode === "solidity"
                  ? "Function / Event Signature:"
                  : mode === "hex"
                  ? "Raw Hex Input (0x...):"
                  : "UTF-8 Text Input:"}
              </label>
              {inputVal && (
                <button
                  type="button"
                  onClick={() => setInputVal("")}
                  className="text-xs font-mono text-text-muted hover:text-error transition-colors px-2 py-1 rounded border border-border-subtle/60 bg-bg-page/60"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                mode === "solidity"
                  ? "e.g. transfer(address,uint256) or Transfer(address,address,uint256)"
                  : mode === "hex"
                  ? "e.g. 0xdeadbeef..."
                  : "Type text to hash..."
              }
              rows={4}
              className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-sm text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>

          {result.error && (
            <div className="p-3.5 mb-6 rounded-xl bg-error/10 border border-error/30 text-error font-mono text-xs">
              ⚠ {result.error}
            </div>
          )}

          {/* Output Cards */}
          {result.hash && (
            <div className="space-y-4 border-t border-border-subtle pt-6">
              {/* 4-Byte Selector */}
              <div className="p-4 rounded-xl border border-accent/40 bg-accent-soft/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-accent font-bold uppercase">
                    4-Byte Function Selector (Method ID)
                  </span>
                  <CopyButton
                    text={result.selector}
                    className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 hover:bg-accent-soft transition-colors cursor-pointer"
                  />
                </div>
                <div className="font-mono text-xl sm:text-2xl font-bold text-accent break-all select-all py-1">
                  {result.selector}
                </div>
                <p className="text-[11px] font-mono text-text-muted mt-1">
                  First 4 bytes (8 hex characters) of Keccak-256 hash used in transaction calldata dispatch.
                </p>
              </div>

              {/* Full 32-Byte Hash / Topic 0 */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono text-text-secondary font-bold uppercase">
                    Full Keccak-256 Hash / Event Topic 0
                  </span>
                  <CopyButton
                    text={result.hash}
                    className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 transition-colors cursor-pointer"
                  />
                </div>
                <div className="font-mono text-xs sm:text-sm text-text-primary break-all select-all py-1">
                  {result.hash}
                </div>
              </div>
            </div>
          )}
      </div>
    </ToolLayout>
  );
}