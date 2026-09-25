"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import { toChecksumAddress, keccak256Hex } from "@/lib/keccak";

interface DecodedWord {
  index: number;
  offsetHex: string;
  hex: string;
  asBigInt: string;
  asAddress: string | null;
  asAscii: string | null;
  asBool: string | null;
}

interface DecodedParam {
  name: string;
  type: string;
  value: string;
  extra?: string;
}

const COMMON_SELECTORS: Record<string, string> = {
  "0xa9059cbb": "transfer(address to, uint256 amount)",
  "0x095ea7b3": "approve(address spender, uint256 amount)",
  "0x23b872dd": "transferFrom(address from, address to, uint256 amount)",
  "0x42842e0e": "safeTransferFrom(address from, address to, uint256 tokenId)",
  "0xb88d4fde": "safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  "0x70a08231": "balanceOf(address account)",
  "0x38ed1739": "swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)",
  "0x7ff36ab5": "swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline)",
  "0x18cbafe5": "swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)",
  "0xd0e30db0": "deposit()",
  "0x2e1a7d4d": "withdraw(uint256 wad)",
};

const PRESETS = [
  {
    name: "ERC-20 transfer",
    calldata:
      "0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000003635c9adc5dea00000",
    signature: "transfer(address to, uint256 amount)",
  },
  {
    name: "ERC-20 approve",
    calldata:
      "0x095ea7b300000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    signature: "approve(address spender, uint256 amount)",
  },
  {
    name: "ERC-721 safeTransferFrom",
    calldata:
      "0x42842e0e000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000005a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c0000000000000000000000000000000000000000000000000000000000001f40",
    signature: "safeTransferFrom(address from, address to, uint256 tokenId)",
  },
];

function cleanHex(raw: string): string {
  return raw.trim().replace(/^0x/i, "").toLowerCase();
}

// Convert "transfer(address to, uint256 amount)" -> "transfer(address,uint256)"
function toCanonicalSignature(sig: string): string {
  const trimmed = sig.trim();
  const match = trimmed.match(/^([a-zA-Z0-9_$]+)\s*\((.*)\)/);
  if (!match) return "";

  const fnName = match[1];
  const params = match[2]
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const parts = p.split(/\s+/);
      return parts[0];
    });

  return `${fnName}(${params.join(",")})`;
}

function parseSignatureParams(sig: string): Array<{ name: string; type: string }> {
  const match = sig.match(/\((.*)\)/);
  if (!match || !match[1]) return [];

  const rawParams = match[1].split(",").map((p) => p.trim()).filter(Boolean);
  return rawParams.map((p, idx) => {
    const parts = p.split(/\s+/);
    if (parts.length >= 2) {
      return { type: parts[0], name: parts[1] };
    }
    return { type: parts[0], name: `param_${idx + 1}` };
  });
}

function formatBigIntWithCommas(str: string): string {
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function weiToEther(weiStr: string): string {
  try {
    const bn = BigInt(weiStr);
    const whole = bn / BigInt(1e18);
    const fraction = (bn % BigInt(1e18)).toString().padStart(18, "0").slice(0, 6);
    return `${formatBigIntWithCommas(whole.toString())}.${fraction}`;
  } catch {
    return "";
  }
}

export default function EvmCalldataDecoderClient() {
  const [calldataInput, setCalldataInput] = useState(PRESETS[0].calldata);
  const [customSig, setCustomSig] = useState(PRESETS[0].signature);

  const cleaned = useMemo(() => cleanHex(calldataInput), [calldataInput]);

  const selector = useMemo(() => {
    if (cleaned.length < 8) return "";
    return "0x" + cleaned.slice(0, 8);
  }, [cleaned]);

  const detectedSig = useMemo(() => {
    return COMMON_SELECTORS[selector] || "";
  }, [selector]);

  const activeSig = customSig.trim() || detectedSig;

  // Words breakdown (32-byte chunks after selector)
  const words: DecodedWord[] = useMemo(() => {
    if (cleaned.length < 8) return [];
    const paramsHex = cleaned.slice(8);
    const result: DecodedWord[] = [];

    const numWords = Math.ceil(paramsHex.length / 64);
    for (let i = 0; i < numWords; i++) {
      const chunk = paramsHex.slice(i * 64, (i + 1) * 64).padEnd(64, "0");
      const offset = (i * 32).toString(16).padStart(2, "0");

      let asBigInt = "0";
      let asBool: string | null = null;
      try {
        const bi = BigInt("0x" + chunk);
        asBigInt = bi.toString(10);
        if (bi === BigInt(0)) asBool = "false (0)";
        else if (bi === BigInt(1)) asBool = "true (1)";
      } catch {
        // ignore
      }

      // Check if word could be an Ethereum address (padded with 12 zero bytes)
      let asAddress: string | null = null;
      if (chunk.slice(0, 24) === "000000000000000000000000") {
        const addrHex = chunk.slice(24);
        if (addrHex !== "0000000000000000000000000000000000000000") {
          try {
            asAddress = toChecksumAddress(addrHex);
          } catch {
            asAddress = null;
          }
        }
      }

      // Printable ascii representation
      let asAscii = "";
      let hasPrintable = false;
      for (let b = 0; b < 64; b += 2) {
        const byteVal = parseInt(chunk.slice(b, b + 2), 16);
        if (byteVal >= 32 && byteVal <= 126) {
          asAscii += String.fromCharCode(byteVal);
          hasPrintable = true;
        } else if (byteVal === 0) {
          // ignore padding nulls
        } else {
          asAscii += ".";
        }
      }

      result.push({
        index: i,
        offsetHex: `0x${offset}`,
        hex: chunk,
        asBigInt,
        asAddress,
        asAscii: hasPrintable ? asAscii.trim() : null,
        asBool,
      });
    }

    return result;
  }, [cleaned]);

  // Decoded typed parameters when signature is available
  const decodedParams: DecodedParam[] = useMemo(() => {
    if (!activeSig || words.length === 0) return [];
    const parsed = parseSignatureParams(activeSig);

    return parsed.map((param, idx) => {
      const word = words[idx];
      if (!word) {
        return { name: param.name, type: param.type, value: "N/A (Missing word)" };
      }

      const lowerType = param.type.toLowerCase();

      if (lowerType === "address") {
        const addr = word.asAddress || ("0x" + word.hex.slice(24));
        return {
          name: param.name,
          type: param.type,
          value: addr,
          extra: "EIP-55 Checksummed Address",
        };
      }

      if (lowerType.startsWith("uint") || lowerType.startsWith("int")) {
        const ethVal = weiToEther(word.asBigInt);
        const formattedInt = formatBigIntWithCommas(word.asBigInt);
        return {
          name: param.name,
          type: param.type,
          value: formattedInt,
          extra: ethVal ? `≈ ${ethVal} ETH / Token Units` : undefined,
        };
      }

      if (lowerType === "bool") {
        return {
          name: param.name,
          type: param.type,
          value: word.asBool || "false",
        };
      }

      return {
        name: param.name,
        type: param.type,
        value: "0x" + word.hex,
      };
    });
  }, [activeSig, words]);

  const { canonicalSig, computedSigHash, isSigMatch } = useMemo(() => {
    if (!customSig.trim()) return { canonicalSig: "", computedSigHash: "", isSigMatch: false };
    try {
      const canonical = toCanonicalSignature(customSig);
      if (!canonical) return { canonicalSig: "", computedSigHash: "", isSigMatch: false };
      const hash = "0x" + keccak256Hex(canonical).slice(0, 8);
      return {
        canonicalSig: canonical,
        computedSigHash: hash,
        isSigMatch: hash.toLowerCase() === selector.toLowerCase(),
      };
    } catch {
      return { canonicalSig: "", computedSigHash: "", isSigMatch: false };
    }
  }, [customSig, selector]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">4-Byte Selector:</span>
        <span className="text-accent font-bold">{selector || "None"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Calldata Size:</span>
        <span className="text-text-primary font-bold">{cleaned.length / 2} bytes ({words.length} words)</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Signature Match:</span>
        <span className={isSigMatch ? "text-success font-bold" : "text-warning font-bold"}>
          {isSigMatch ? "100% Verified" : activeSig ? "Custom / Unknown" : "None"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Execution:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="evm-calldata-decoder" stats={stats}>
      <div className="space-y-6">
        {/* Preset Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-text-muted">Sample Payloads:</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setCalldataInput(p.calldata);
                setCustomSig(p.signature);
              }}
              className="text-xs font-mono px-2.5 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent hover:text-accent transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Input & Signature Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Calldata Input Area */}
          <div className="lg:col-span-7 rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 font-mono">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">EVM Transaction Calldata Hex</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCalldataInput("")}
                  className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
                >
                  [Clear]
                </button>
                <CopyButton text={calldataInput} label="Copy" />
              </div>
            </div>

            <textarea
              value={calldataInput}
              onChange={(e) => setCalldataInput(e.target.value)}
              placeholder="0xa9059cbb000000000000000000000000..."
              rows={5}
              className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted/50 focus:border-accent focus:outline-none resize-none leading-relaxed break-all"
            />

            {/* Signature Input */}
            <div className="pt-2 border-t border-border-subtle/50 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="text-text-muted">Function Signature / ABI Declaration:</label>
                {detectedSig && !customSig && (
                  <span className="text-[11px] text-accent font-bold">Auto-detected from 4-byte selector</span>
                )}
              </div>
              <input
                type="text"
                value={customSig}
                onChange={(e) => setCustomSig(e.target.value)}
                placeholder="e.g. transfer(address to, uint256 amount)"
                className="w-full rounded border border-border-subtle bg-bg-page px-3 py-2 text-xs text-text-primary font-mono focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* 4-Byte Selector Inspector */}
          <div className="lg:col-span-5 rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 font-mono flex flex-col justify-between">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-accent">Function Selector (4-Byte)</span>
              <span className="text-[11px] text-text-muted">Offset [0x00..0x04]</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg border border-border-subtle bg-bg-page">
                <div className="text-text-muted text-[11px]">Calldata Selector:</div>
                <div className="text-accent font-bold text-lg tracking-wider">{selector || "0x--------"}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                  <span className="text-text-muted">Standard Match:</span>
                  <span className="text-text-primary font-bold truncate max-w-[180px]">
                    {detectedSig ? detectedSig.split("(")[0] : "Custom / Unknown"}
                  </span>
                </div>

                {computedSigHash && (
                  <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted">Sig Keccak-256:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        isSigMatch
                          ? "bg-success/10 text-success border border-success/30"
                          : "bg-warning/10 text-warning border border-warning/30"
                      }`}
                    >
                      {computedSigHash} {isSigMatch ? "✓ MATCH" : "≠ MISMATCH"}
                    </span>
                  </div>
                )}

                {canonicalSig && (
                  <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                    <span className="text-text-muted">Canonical ABI:</span>
                    <span className="text-text-secondary font-mono text-[11px] truncate max-w-[200px]" title={canonicalSig}>
                      {canonicalSig}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-text-muted">Total Words:</span>
                  <span className="text-text-primary font-bold">{words.length} (32 bytes each)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Typed Decoded Parameters Table */}
        {decodedParams.length > 0 && (
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 font-mono">
            <div className="h-8 flex items-center justify-between text-xs border-b border-border-subtle/50 pb-2">
              <span className="font-semibold text-accent">ABI Decoded Method Arguments</span>
              <span className="text-text-muted text-[11px]">{decodedParams.length} parameters</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border-subtle/50">
                    <th className="py-2.5 px-3 w-10">#</th>
                    <th className="py-2.5 px-3 w-28">Name</th>
                    <th className="py-2.5 px-3 w-28">Type</th>
                    <th className="py-2.5 px-3">Decoded Value</th>
                    <th className="py-2.5 px-3 w-56">Formatted / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle/30 font-mono">
                  {decodedParams.map((p, idx) => (
                    <tr key={idx} className="hover:bg-bg-page/50 transition-colors">
                      <td className="py-3 px-3 text-text-muted">{idx + 1}</td>
                      <td className="py-3 px-3 text-text-primary font-semibold">{p.name}</td>
                      <td className="py-3 px-3 text-accent">{p.type}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-text-primary break-all">{p.value}</span>
                          <CopyButton text={p.value} label="Copy" />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-text-secondary text-[11px]">{p.extra || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Raw 32-Byte Words Grid */}
        {words.length > 0 && (
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 font-mono">
            <div className="h-8 flex items-center justify-between text-xs border-b border-border-subtle/50 pb-2">
              <span className="font-semibold text-text-primary">Raw 32-Byte Word Slices (EVM Memory Chunks)</span>
              <span className="text-text-muted text-[11px]">{words.length} words</span>
            </div>

            <div className="space-y-4">
              {words.map((w) => (
                <div
                  key={w.index}
                  className="p-4 rounded-lg border border-border-subtle bg-bg-page space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-text-muted border-b border-border-subtle/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                        Offset [{w.offsetHex}]
                      </span>
                      <span className="font-semibold text-text-primary">Word #{w.index}</span>
                    </div>
                    <CopyButton text={"0x" + w.hex} label="Copy Word" />
                  </div>

                  {/* 64-char Hex */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-text-muted">Hex Representation (32 Bytes):</span>
                    <div className="text-text-primary text-xs font-mono break-all tracking-wider bg-bg-card p-2.5 rounded border border-border-subtle">
                      0x{w.hex}
                    </div>
                  </div>

                  {/* Interpretations List */}
                  <div className="space-y-2 pt-1">
                    {/* Uint256 */}
                    <div className="p-2 rounded bg-bg-card/60 border border-border-subtle/50 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-text-muted text-[11px] min-w-[90px]">Uint256:</span>
                      <span className="text-text-primary font-bold break-all flex-1 text-right">
                        {formatBigIntWithCommas(w.asBigInt)}
                      </span>
                    </div>

                    {/* Address (only if padded 20-byte address candidate) */}
                    {w.asAddress && (
                      <div className="p-2 rounded bg-bg-card/60 border border-border-subtle/50 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-text-muted text-[11px] min-w-[90px]">EIP-55 Address:</span>
                        <div className="flex items-center gap-2 flex-1 justify-end">
                          <span className="text-accent font-bold break-all">{w.asAddress}</span>
                          <CopyButton text={w.asAddress} label="Copy" />
                        </div>
                      </div>
                    )}

                    {/* ASCII String (if printable) */}
                    {w.asAscii && (
                      <div className="p-2 rounded bg-bg-card/60 border border-border-subtle/50 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-text-muted text-[11px] min-w-[90px]">ASCII:</span>
                        <span className="text-success break-all flex-1 text-right">&quot;{w.asAscii}&quot;</span>
                      </div>
                    )}

                    {/* Boolean */}
                    {w.asBool && (
                      <div className="p-2 rounded bg-bg-card/60 border border-border-subtle/50 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-text-muted text-[11px] min-w-[90px]">Boolean:</span>
                        <span className="text-text-secondary font-bold flex-1 text-right">{w.asBool}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
