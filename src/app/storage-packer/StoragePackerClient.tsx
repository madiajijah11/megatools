"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import {
  StorageVariable,
  StorageLayout,
  StorageOptimizationResult,
  computeStorageLayout,
  optimizeStorageLayout,
  parseSolidityCode,
  generateSolidityStructOrContract,
  getTypeByteSize,
  PRESET_UNOPTIMIZED_STAKING,
  PRESET_DEFI_COLLATERAL,
  PRESET_NFT_GAMING,
  PRESET_OPTIMAL_PACKED,
} from "@/lib/storage-packer";

const COLOR_CLASSES = [
  "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  "bg-amber-500/20 text-amber-300 border-amber-500/40",
  "bg-rose-500/20 text-rose-300 border-rose-500/40",
  "bg-sky-500/20 text-sky-300 border-sky-500/40",
  "bg-purple-500/20 text-purple-300 border-purple-500/40",
  "bg-teal-500/20 text-teal-300 border-teal-500/40",
  "bg-orange-500/20 text-orange-300 border-orange-500/40",
  "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
];

const COMMON_TYPES = [
  "uint256",
  "address",
  "bool",
  "uint128",
  "uint64",
  "uint32",
  "uint16",
  "uint8",
  "bytes32",
  "bytes4",
  "string",
  "bytes",
  "mapping(address => uint256)",
];

export default function StoragePackerClient() {
  const [variables, setVariables] = useState<StorageVariable[]>(PRESET_UNOPTIMIZED_STAKING);
  const [activeTab, setActiveTab] = useState<"slots" | "optimizer" | "variables" | "code">("slots");
  const [hoveredVarId, setHoveredVarId] = useState<string | null>(null);
  const [solidityInput, setSolidityInput] = useState<string>("");

  // Layout calculation
  const layout: StorageLayout = useMemo(() => {
    return computeStorageLayout(variables);
  }, [variables]);

  // Optimization calculation
  const optimization: StorageOptimizationResult = useMemo(() => {
    return optimizeStorageLayout(variables);
  }, [variables]);

  // Presets
  const loadPreset = (preset: StorageVariable[]) => {
    setVariables(JSON.parse(JSON.stringify(preset)));
  };

  // Reorder variables manually
  const moveVariable = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= variables.length) return;
    const newVars = [...variables];
    const temp = newVars[index];
    newVars[index] = newVars[targetIdx];
    newVars[targetIdx] = temp;
    setVariables(newVars);
  };

  // Remove variable
  const removeVariable = (id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id));
  };

  // Update variable type or name
  const updateVariable = (id: string, field: "name" | "type", val: string) => {
    setVariables((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        if (field === "type") {
          const { byteSize, isDynamic } = getTypeByteSize(val);
          return { ...v, type: val, byteSize, isDynamic };
        }
        return { ...v, [field]: val };
      })
    );
  };

  // Add new variable
  const addVariable = () => {
    const newId = `var-${Date.now()}`;
    const newVar: StorageVariable = {
      id: newId,
      name: `newVar${variables.length + 1}`,
      type: "uint256",
      byteSize: 32,
      visibility: "public",
      isDynamic: false,
    };
    setVariables((prev) => [...prev, newVar]);
  };

  // Import raw Solidity code
  const handleImportCode = () => {
    if (!solidityInput.trim()) return;
    const parsed = parseSolidityCode(solidityInput);
    if (parsed.length > 0) {
      setVariables(parsed);
      setActiveTab("slots");
    } else {
      alert("No valid Solidity state variables or struct fields recognized.");
    }
  };

  // Apply optimized reordering
  const applyOptimization = () => {
    setVariables(JSON.parse(JSON.stringify(optimization.optimizedVariables)));
    setActiveTab("slots");
  };

  // Quick formatted code representation of current variables
  const currentSolidityCode = useMemo(() => {
    return generateSolidityStructOrContract(variables);
  }, [variables]);

  // Sidebar stats element
  const stats = (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Storage Slots:</span>
        <span className="font-bold text-accent">{layout.totalSlots} slots ({layout.totalSlots * 32}B)</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Efficiency Score:</span>
        <span className={`font-bold ${layout.efficiencyScore >= 80 ? "text-emerald-400" : layout.efficiencyScore >= 60 ? "text-amber-400" : "text-rose-400"}`}>
          {layout.efficiencyScore}%
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Wasted Padding:</span>
        <span className="font-bold text-rose-400">{layout.wastedBytes} bytes ({layout.wastedPercentage}%)</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Opt. Savings:</span>
        <span className={`font-bold ${optimization.slotsSaved > 0 ? "text-emerald-400" : "text-text-muted"}`}>
          {optimization.slotsSaved > 0 ? `-${optimization.slotsSaved} slots (-${optimization.gasSavedFirstWrite.toLocaleString()} gas)` : "Already Optimal"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout
      toolId="storage-packer"
      stats={stats}
    >
      <div className="space-y-6">
        {/* Presets & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mr-1">
              ⚡ Load Preset:
            </span>
            <button
              onClick={() => loadPreset(PRESET_UNOPTIMIZED_STAKING)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-rose-400 hover:text-rose-300 transition-colors font-medium"
            >
              🚨 Unoptimized Staking
            </button>
            <button
              onClick={() => loadPreset(PRESET_DEFI_COLLATERAL)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-amber-400 hover:text-amber-300 transition-colors font-medium"
            >
              🏦 DeFi Collateral
            </button>
            <button
              onClick={() => loadPreset(PRESET_NFT_GAMING)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              🎮 NFT Game Profile
            </button>
            <button
              onClick={() => loadPreset(PRESET_OPTIMAL_PACKED)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              🛡️ Optimal Packed
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("code")}
              className="px-3 py-1.5 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
            >
              📥 Import Solidity
            </button>
            <button
              onClick={addVariable}
              className="px-3 py-1.5 text-xs rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              ➕ Add Variable
            </button>
          </div>
        </div>

        {/* Storage Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Storage Slots</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-2xl font-black text-accent">{layout.totalSlots}</span>
              <span className="text-xs text-text-muted">slots ({layout.totalSlots * 32} bytes)</span>
            </div>
            <span className="text-[10px] text-text-muted mt-1">{variables.length} state variables mapped</span>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Packing Efficiency</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className={`text-2xl font-black ${layout.efficiencyScore >= 80 ? "text-emerald-400" : layout.efficiencyScore >= 60 ? "text-amber-400" : "text-rose-400"}`}>
                {layout.efficiencyScore}%
              </span>
              <span className="text-xs text-text-muted">density</span>
            </div>
            <span className="text-[10px] text-text-muted mt-1">
              {layout.totalBytesUsed}B data / {layout.wastedBytes}B padding
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Wasted Space</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className={`text-2xl font-black ${layout.wastedBytes > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {layout.wastedBytes}
              </span>
              <span className="text-xs text-text-muted">bytes ({layout.wastedPercentage}%)</span>
            </div>
            <span className="text-[10px] text-rose-400/80 mt-1">Lost to unoptimized packing</span>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Potential Gas Savings</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className={`text-2xl font-black ${optimization.slotsSaved > 0 ? "text-emerald-400" : "text-text-muted"}`}>
                {optimization.slotsSaved > 0 ? `-${optimization.slotsSaved}` : "0"}
              </span>
              <span className="text-xs text-text-muted">slots saved</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-1">
              {optimization.slotsSaved > 0
                ? `~${optimization.gasSavedFirstWrite.toLocaleString()} gas on first SSTORE`
                : "Layout is already 100% optimal"}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border-subtle">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("slots")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "slots"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>📦</span> 32-Byte EVM Slot Grid
            </button>
            <button
              onClick={() => setActiveTab("optimizer")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "optimizer"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>⚡</span> 1-Click Optimizer
              {optimization.slotsSaved > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                  Save {optimization.slotsSaved} slots
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("variables")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "variables"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>📝</span> Variable Manager ({variables.length})
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "code"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>💻</span> Solidity Code View
            </button>
          </div>
        </div>

        {/* Tab 1: 32-Byte EVM Slot Grid */}
        {activeTab === "slots" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>📐</span> EVM Storage Memory Layout (32 Bytes per Slot)
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Solidity stores values starting at offset 0 up to 31. When a variable exceeds the remaining bytes in a slot, EVM spills it to byte 0 of the next slot.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <span className="w-3 h-3 rounded bg-bg-page border border-border-subtle"></span> Packed Variable
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-3 h-3 rounded bg-rose-500/10 border border-dashed border-rose-500/50"></span> Wasted Padding Space
                  </span>
                </div>
              </div>

              {/* Slot Cards List */}
              <div className="space-y-3">
                {layout.slots.map((slot) => {
                  return (
                    <div
                      key={slot.slotIndex}
                      className="p-3.5 rounded-xl bg-bg-page border border-border-subtle hover:border-border transition-all space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/50 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-bg-card border border-border-subtle font-mono text-xs font-bold text-text-primary">
                            Slot {slot.slotIndex}
                          </span>
                          <span className="text-xs text-text-muted">
                            {slot.usedBytes} / 32 bytes used
                          </span>
                          {slot.wastedBytes > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium">
                              {slot.wastedBytes}B padding wasted
                            </span>
                          )}
                        </div>

                        {/* Variables inside this slot */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {slot.variables.map((v) => {
                            const colorClass = COLOR_CLASSES[v.colorIndex % COLOR_CLASSES.length];
                            return (
                              <span
                                key={v.id}
                                onMouseEnter={() => setHoveredVarId(v.id)}
                                onMouseLeave={() => setHoveredVarId(null)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer ${colorClass} ${
                                  hoveredVarId === v.id ? "ring-2 ring-accent scale-105" : ""
                                }`}
                                title={`${v.name} (${v.type}): bytes ${v.startByte}..${v.endByte} (${v.byteSize}B)`}
                              >
                                {v.name} <span className="opacity-75">({v.byteSize}B)</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* 32 Byte Cells Bar with inline style for exact 32 equal columns */}
                      <div
                        className="grid gap-1 font-mono text-center"
                        style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}
                      >
                        {slot.bytes.map((b) => {
                          const isHovered = hoveredVarId && b.varId === hoveredVarId;
                          let cellClass = "bg-rose-500/10 border-rose-500/30 text-rose-400/50 border-dashed";
                          if (!b.isPadding && b.colorIndex !== undefined) {
                            cellClass = COLOR_CLASSES[b.colorIndex % COLOR_CLASSES.length];
                          }

                          return (
                            <div
                              key={b.byteIndex}
                              onMouseEnter={() => b.varId && setHoveredVarId(b.varId)}
                              onMouseLeave={() => setHoveredVarId(null)}
                              title={
                                b.isPadding
                                  ? `Byte ${b.byteIndex}: Wasted Padding Space (Unused EVM storage)`
                                  : `Byte ${b.byteIndex}: ${b.varName} (${b.varType})`
                              }
                              className={`h-9 rounded flex flex-col justify-center items-center text-[10px] border transition-all cursor-pointer ${cellClass} ${
                                isHovered ? "ring-2 ring-accent scale-110 z-10 font-bold" : ""
                              }`}
                            >
                              <span className="text-[8px] opacity-60 leading-none">{b.byteIndex}</span>
                              <span className="leading-none text-[9px] font-bold mt-0.5">
                                {b.isPadding ? "∅" : "●"}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-text-muted font-mono px-0.5">
                        <span>Byte 0 (LSB / Start)</span>
                        <span>Byte 31 (MSB / End)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 1-Click Optimizer */}
        {activeTab === "optimizer" && (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>⚡</span> Automated Bin-Packing Storage Optimizer
                  </h3>
                  <p className="text-xs text-text-muted mt-1 max-w-2xl">
                    Uses First-Fit Decreasing packing to group smaller datatypes (<code>bool</code>, <code>uint8..uint128</code>, <code>address</code>) into complete 32-byte slots, dramatically reducing wasted storage padding.
                  </p>
                </div>

                <button
                  onClick={applyOptimization}
                  disabled={optimization.isAlreadyOptimal}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-sm"
                >
                  <span>🚀</span> Apply Re-ordered Packing to Variables
                </button>
              </div>

              {/* Impact Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-bg-page border border-border-subtle flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">Storage Slots Footprint</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xl font-bold text-rose-400 line-through">
                      {optimization.originalLayout.totalSlots} slots
                    </span>
                    <span className="text-sm text-text-muted">➔</span>
                    <span className="text-xl font-black text-emerald-400">
                      {optimization.optimizedLayout.totalSlots} slots
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1">
                    {optimization.slotsSaved > 0
                      ? `-${optimization.slotsSaved} EVM slots saved (${Math.round((optimization.slotsSaved / optimization.originalLayout.totalSlots) * 100)}% reduction)`
                      : "Already optimal"}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-bg-page border border-border-subtle flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">First Write Gas Cost (SSTORE)</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xl font-bold text-rose-400 line-through">
                      {optimization.originalLayout.estimatedColdSstoreCost.toLocaleString()}
                    </span>
                    <span className="text-sm text-text-muted">➔</span>
                    <span className="text-xl font-black text-emerald-400">
                      {optimization.optimizedLayout.estimatedColdSstoreCost.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1">
                    Save ~{optimization.gasSavedFirstWrite.toLocaleString()} gas on contract initialization
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-bg-page border border-border-subtle flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">Storage Padding Elimination</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xl font-bold text-rose-400 line-through">
                      {optimization.originalLayout.wastedBytes}B
                    </span>
                    <span className="text-sm text-text-muted">➔</span>
                    <span className="text-xl font-black text-emerald-400">
                      {optimization.optimizedLayout.wastedBytes}B
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 mt-1">
                    Density improved from {optimization.originalLayout.efficiencyScore}% to {optimization.optimizedLayout.efficiencyScore}%
                  </span>
                </div>
              </div>

              {/* Upgradeability warning alert */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <strong className="font-bold">Upgradeability & Proxy Notice:</strong>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Re-ordering state variables changes their EVM storage slot offsets. Only reorder during greenfield development or inside memory structs. Never reorder variables on an already-deployed upgradeable proxy contract (UUPS/Transparent) as it causes storage collision.
                  </p>
                </div>
              </div>
            </div>

            {/* Optimized Code Output */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <span>📜</span> Optimized Solidity Code Preview
                </h4>
                <CopyButton text={optimization.reorderedCode} label="Copy Optimized Solidity" />
              </div>

              <pre className="p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-secondary overflow-x-auto leading-relaxed">
                {optimization.reorderedCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Variable Manager */}
        {activeTab === "variables" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-bg-card border border-border-subtle text-xs">
              <span className="text-text-muted font-medium">
                Showing {variables.length} Variables ({layout.totalSlots} Slots Allocated)
              </span>
              <button
                onClick={addVariable}
                className="px-2.5 py-1 text-xs rounded bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                ➕ Add Variable
              </button>
            </div>

            {/* Variables List */}
            <div className="space-y-2">
              {variables.map((v, idx) => (
                <div
                  key={v.id}
                  className="p-3 rounded-xl bg-bg-card border border-border-subtle hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Reorder controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        disabled={idx === 0}
                        onClick={() => moveVariable(idx, "up")}
                        className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        disabled={idx === variables.length - 1}
                        onClick={() => moveVariable(idx, "down")}
                        className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => updateVariable(v.id, "name", e.target.value)}
                          className="bg-transparent font-bold text-xs text-text-primary focus:outline-none focus:border-b border-accent w-full max-w-xs font-mono"
                          placeholder="variableName"
                        />
                      </div>
                      {v.comment && (
                        <p className="text-[11px] text-text-muted truncate">// {v.comment}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Type selection or custom input */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-text-muted">Type:</span>
                      <input
                        list={`types-${v.id}`}
                        type="text"
                        value={v.type}
                        onChange={(e) => updateVariable(v.id, "type", e.target.value)}
                        className="px-2.5 py-1 rounded bg-bg-page border border-border-subtle font-mono text-xs text-accent focus:outline-none focus:border-accent w-36"
                      />
                      <datalist id={`types-${v.id}`}>
                        {COMMON_TYPES.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-bg-page border border-border-subtle font-mono text-[11px] text-text-secondary">
                      {v.byteSize} Bytes
                    </span>

                    {/* Delete button */}
                    <button
                      onClick={() => removeVariable(v.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Variable"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Solidity Code View & Import */}
        {activeTab === "code" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>📥</span> Paste Solidity Struct or Contract State
              </h3>
              <p className="text-xs text-text-muted">
                Paste your existing Solidity declarations. Supports structs, public/private state variables, mappings, and primitives.
              </p>

              <textarea
                value={solidityInput}
                onChange={(e) => setSolidityInput(e.target.value)}
                placeholder={`struct UserStake {\n    address staker;\n    uint256 amount;\n    uint32 lockEnd;\n    bool isDelegated;\n    uint16 tier;\n}`}
                className="w-full h-40 p-3 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:outline-none focus:border-accent"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleImportCode}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-xs hover:opacity-90 transition-opacity"
                >
                  Parse & Visualize Storage Layout
                </button>
              </div>
            </div>

            {/* Current Solidity code */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text-primary">
                  Current Layout Solidity Code
                </h4>
                <CopyButton text={currentSolidityCode} label="Copy Solidity" />
              </div>
              <pre className="p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-secondary overflow-x-auto">
                {currentSolidityCode}
              </pre>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
