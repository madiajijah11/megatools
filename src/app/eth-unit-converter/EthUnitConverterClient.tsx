"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

const UNITS = [
  { key: "wei", label: "Wei", power: 0, desc: "Smallest unit (10⁰)" },
  { key: "gwei", label: "Gwei (Shannon)", power: 9, desc: "Gas prices (10⁹)" },
  { key: "finney", label: "Finney (Milli)", power: 15, desc: "1,000 Finney = 1 ETH (10¹⁵)" },
  { key: "ether", label: "Ether (ETH)", power: 18, desc: "Standard unit (10¹⁸)" },
];

function formatDecimal(bigIntValue: bigint, decimals: number): string {
  const isNegative = bigIntValue < BigInt(0);
  const abs = isNegative ? -bigIntValue : bigIntValue;
  const str = abs.toString().padStart(decimals + 1, "0");
  const intPart = str.slice(0, str.length - decimals);
  let fracPart = str.slice(str.length - decimals);
  fracPart = fracPart.replace(/0+$/, "");
  const result = fracPart ? `${intPart}.${fracPart}` : intPart;
  return isNegative ? `-${result}` : result;
}

function parseToWei(valueStr: string, unitPower: number): bigint | null {
  const clean = valueStr.trim();
  if (!clean || !/^-?\d*(\.\d*)?$/.test(clean) || clean === "." || clean === "-") return null;

  const [intPart = "0", fracPart = ""] = clean.split(".");
  const paddedFrac = fracPart.padEnd(unitPower, "0").slice(0, unitPower);
  const fullStr = `${intPart.replace(/^0+/, "") || "0"}${paddedFrac}`;
  try {
    return BigInt(fullStr);
  } catch {
    return null;
  }
}

export default function EthUnitConverterClient() {
  const [activeUnit, setActiveUnit] = useState<string>("ether");
  const [inputValue, setInputValue] = useState<string>("1.5");

  // Gas fee calculator state
  const [gasLimit, setGasLimit] = useState<number>(21000);
  const [gasPriceGwei, setGasPriceGwei] = useState<number>(25);
  const [ethPriceUsd, setEthPriceUsd] = useState<number>(2700);
  // Compute all units based on input
  const values = useMemo(() => {
    const activeUnitObj = UNITS.find((u) => u.key === activeUnit) || UNITS[3];
    const weiVal = parseToWei(inputValue, activeUnitObj.power);

    if (weiVal === null) {
      return {
        wei: "",
        gwei: "",
        finney: "",
        ether: "",
        rawWei: BigInt(0),
      };
    }

    return {
      wei: weiVal.toString(),
      gwei: formatDecimal(weiVal, 9),
      finney: formatDecimal(weiVal, 15),
      ether: formatDecimal(weiVal, 18),
      rawWei: weiVal,
    };
  }, [inputValue, activeUnit]);

  // Gas calculations
  const gasTotalEth = useMemo(() => {
    const totalGwei = BigInt(gasLimit) * BigInt(Math.round(gasPriceGwei));
    const totalWei = totalGwei * BigInt(1000000000);
    return formatDecimal(totalWei, 18);
  }, [gasLimit, gasPriceGwei]);

  const gasTotalUsd = useMemo(() => {
    const eth = parseFloat(gasTotalEth) || 0;
    return (eth * ethPriceUsd).toFixed(4);
  }, [gasTotalEth, ethPriceUsd]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Active Base Unit</p>
        <p className="text-accent font-mono text-xs font-bold uppercase">{activeUnit}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Gas Total Cost</p>
        <p className="text-text-primary font-mono text-xs">${gasTotalUsd} USD</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="eth-unit-converter" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Unit Converter Section */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
              <span className="text-xs font-mono text-text-secondary font-bold uppercase">
                Input Unit & Amount:
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {UNITS.map((u) => (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => setActiveUnit(u.key)}
                    className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                      activeUnit === u.key
                        ? "border-accent bg-accent-soft text-accent font-bold"
                        : "border-border-subtle bg-bg-page/50 text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter value (e.g. 1.5)..."
                className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-base text-accent font-bold focus:border-accent focus:outline-none"
              />
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {UNITS.map((unit) => {
                const val = values[unit.key as keyof typeof values] as string;
                return (
                  <div
                    key={unit.key}
                    className="p-3.5 rounded-xl bg-bg-page border border-border-subtle/80 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-text-secondary font-bold">
                        {unit.label}
                      </span>
                      <CopyButton
                        text={val}
                        className="text-xs font-mono px-2 py-0.5 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 hover:bg-accent-soft transition-colors cursor-pointer"
                      />
                    </div>
                    <div className="font-mono text-sm text-text-primary break-all select-all font-medium py-1">
                      {val || "0"}
                    </div>
                    <span className="text-[10px] font-mono text-text-muted">{unit.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gas Fee Calculator Section */}
          <div className="border-t border-border-subtle pt-6">
            <h3 className="text-sm font-mono font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-accent">&gt;</span>
              <span>EIP-1559 Transaction Gas Estimator</span>
            </h3>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs font-mono text-text-muted">Presets:</span>
              <button
                type="button"
                onClick={() => setGasLimit(21000)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                  gasLimit === 21000
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border-subtle bg-bg-page/60 text-text-secondary hover:text-text-primary"
                }`}
              >
                ETH Transfer (21k)
              </button>
              <button
                type="button"
                onClick={() => setGasLimit(65000)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                  gasLimit === 65000
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border-subtle bg-bg-page/60 text-text-secondary hover:text-text-primary"
                }`}
              >
                ERC-20 Token (65k)
              </button>
              <button
                type="button"
                onClick={() => setGasLimit(160000)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                  gasLimit === 160000
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border-subtle bg-bg-page/60 text-text-secondary hover:text-text-primary"
                }`}
              >
                Uniswap DEX Swap (160k)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">
                  Gas Limit (Units):
                </label>
                <input
                  type="number"
                  value={gasLimit}
                  onChange={(e) => setGasLimit(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">
                  Gas Price (Gwei):
                </label>
                <input
                  type="number"
                  value={gasPriceGwei}
                  onChange={(e) => setGasPriceGwei(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-text-secondary block mb-1">
                  ETH Price ($ USD):
                </label>
                <input
                  type="number"
                  value={ethPriceUsd}
                  onChange={(e) => setEthPriceUsd(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            {/* Total Estimated Fee Card */}
            <div className="p-4 rounded-xl border border-accent/30 bg-accent-soft/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-text-secondary uppercase">
                  Total Estimated Tx Cost
                </span>
                <div className="font-mono text-xl sm:text-2xl font-bold text-accent">
                  {gasTotalEth} ETH
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-text-muted">Fiat Value</span>
                <div className="font-mono text-lg font-bold text-text-primary">
                  ≈ ${gasTotalUsd} USD
                </div>
              </div>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}