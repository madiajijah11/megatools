// Solidity Storage Layout & Gas Packing Optimizer Engine

export interface StorageVariable {
  id: string;
  name: string;
  type: string;
  byteSize: number;
  visibility?: string;
  isDynamic: boolean;
  comment?: string;
}

export interface PlacedByte {
  byteIndex: number; // 0 to 31
  varId?: string;
  varName?: string;
  varType?: string;
  isPadding: boolean;
  colorIndex?: number;
}

export interface StorageSlot {
  slotIndex: number;
  bytes: PlacedByte[];
  usedBytes: number;
  wastedBytes: number;
  variables: {
    id: string;
    name: string;
    type: string;
    byteSize: number;
    startByte: number;
    endByte: number;
    colorIndex: number;
  }[];
}

export interface StorageLayout {
  slots: StorageSlot[];
  totalSlots: number;
  totalBytesUsed: number;
  totalBytesAllocated: number;
  wastedBytes: number;
  wastedPercentage: number;
  efficiencyScore: number; // 0 to 100
  estimatedDeploymentGas: number; // approx gas cost for storage slots init
  estimatedColdSstoreCost: number; // 22,100 gas per new slot write
  estimatedWarmSloadCost: number; // 100 gas per slot read
}

export interface StorageOptimizationResult {
  originalLayout: StorageLayout;
  optimizedLayout: StorageLayout;
  optimizedVariables: StorageVariable[];
  slotsSaved: number;
  gasSavedDeployment: number;
  gasSavedFirstWrite: number;
  gasSavedWarmReads: number;
  reorderedCode: string;
  isAlreadyOptimal: boolean;
}

// -------------------------------------------------------------
// Type Sizing & Introspection
// -------------------------------------------------------------

export function getTypeByteSize(rawType: string): { byteSize: number; isDynamic: boolean; category: string } {
  const type = rawType.trim().replace(/\s+/g, " ");

  // Boolean
  if (type === "bool") return { byteSize: 1, isDynamic: false, category: "bool" };

  // Address
  if (type === "address" || type === "address payable") {
    return { byteSize: 20, isDynamic: false, category: "address" };
  }

  // Fixed bytes: bytes1 to bytes32
  const bytesMatch = /^bytes([1-9]|[12][0-9]|3[0-2])$/.exec(type);
  if (bytesMatch) {
    const size = parseInt(bytesMatch[1], 10);
    return { byteSize: size, isDynamic: false, category: "bytesN" };
  }

  // Unsigned integers: uint8 to uint256
  const uintMatch = /^uint([1-9]|[1-9][0-9]|[12][0-9]{2})?$/.exec(type);
  if (uintMatch) {
    const bits = uintMatch[1] ? parseInt(uintMatch[1], 10) : 256;
    const byteSize = Math.ceil(bits / 8);
    return { byteSize, isDynamic: false, category: "uint" };
  }

  // Signed integers: int8 to int256
  const intMatch = /^int([1-9]|[1-9][0-9]|[12][0-9]{2})?$/.exec(type);
  if (intMatch) {
    const bits = intMatch[1] ? parseInt(intMatch[1], 10) : 256;
    const byteSize = Math.ceil(bits / 8);
    return { byteSize, isDynamic: false, category: "int" };
  }

  // Dynamic types: occupies 1 full slot (32 bytes) in sequential layout for slot pointer
  if (type.startsWith("mapping(") || type === "string" || type === "bytes" || type.endsWith("[]")) {
    return { byteSize: 32, isDynamic: true, category: "dynamic" };
  }

  // Static arrays: e.g. uint8[4], address[2]
  const staticArrayMatch = /^(.*)\[(\d+)\]$/.exec(type);
  if (staticArrayMatch) {
    const elemType = staticArrayMatch[1];
    const length = parseInt(staticArrayMatch[2], 10);
    const elemInfo = getTypeByteSize(elemType);
    // In Solidity, static array elements do not share a slot with previous items, but can be packed together
    const totalBytes = elemInfo.byteSize * length;
    return { byteSize: totalBytes >= 32 ? Math.ceil(totalBytes / 32) * 32 : totalBytes, isDynamic: false, category: "array" };
  }

  // Contract instance or custom enum
  if (/^[A-Z][a-zA-Z0-9_]*$/.test(type)) {
    // Enum defaults to 1 byte in Solidity
    if (type.toLowerCase().includes("state") || type.toLowerCase().includes("status") || type.toLowerCase().includes("role")) {
      return { byteSize: 1, isDynamic: false, category: "enum" };
    }
    // Contract reference is address (20 bytes)
    return { byteSize: 20, isDynamic: false, category: "contract" };
  }

  // Fallback to 32 bytes
  return { byteSize: 32, isDynamic: false, category: "unknown" };
}

// -------------------------------------------------------------
// Solidity Parser
// -------------------------------------------------------------

export function parseSolidityCode(code: string): StorageVariable[] {
  const lines = code.split("\n");
  const variables: StorageVariable[] = [];
  let unnamedCount = 1;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("//") || line.startsWith("/*") || line.startsWith("*")) continue;

    // Strip trailing comments
    const commentIdx = line.indexOf("//");
    let comment = "";
    if (commentIdx !== -1) {
      comment = line.slice(commentIdx + 2).trim();
      line = line.slice(0, commentIdx).trim();
    }

    // Strip struct / contract braces
    if (line.startsWith("struct ") || line.startsWith("contract ") || line.startsWith("library ") || line === "{" || line === "}") {
      continue;
    }

    // Strip semicolon
    if (line.endsWith(";")) {
      line = line.slice(0, -1).trim();
    }

    if (!line) continue;

    // Remove initialization e.g. "= 100", "= true"
    const eqIdx = line.indexOf("=");
    if (eqIdx !== -1) {
      line = line.slice(0, eqIdx).trim();
    }

    // Parse tokens
    // e.g.: "uint128 public rewardRate" or "address owner" or "mapping(address => uint256) public balances"
    const tokens = line.split(/\s+/);
    if (tokens.length < 2) continue;

    let varName = tokens[tokens.length - 1];
    let typeTokens: string[] = [];
    let visibility = "internal";

    for (let i = 0; i < tokens.length - 1; i++) {
      const tok = tokens[i];
      if (["public", "private", "internal", "constant", "immutable"].includes(tok)) {
        visibility = tok;
      } else {
        typeTokens.push(tok);
      }
    }

    const typeStr = typeTokens.join(" ");
    if (!typeStr || !varName || ["constant", "immutable"].includes(visibility)) {
      // Constants & immutables do not take storage slots in EVM
      continue;
    }

    const { byteSize, isDynamic } = getTypeByteSize(typeStr);

    variables.push({
      id: `var-${Date.now()}-${unnamedCount++}`,
      name: varName,
      type: typeStr,
      byteSize,
      visibility,
      isDynamic,
      comment,
    });
  }

  return variables;
}

// -------------------------------------------------------------
// EVM Storage Packing Layout Calculator
// -------------------------------------------------------------

const COLOR_PALETTE = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];

export function computeStorageLayout(variables: StorageVariable[]): StorageLayout {
  if (variables.length === 0) {
    return {
      slots: [],
      totalSlots: 0,
      totalBytesUsed: 0,
      totalBytesAllocated: 0,
      wastedBytes: 0,
      wastedPercentage: 0,
      efficiencyScore: 100,
      estimatedDeploymentGas: 0,
      estimatedColdSstoreCost: 0,
      estimatedWarmSloadCost: 0,
    };
  }

  const slots: StorageSlot[] = [];
  let currentSlotIndex = 0;
  let currentSlotBytesUsed = 0;

  // Initialize first slot
  let currentSlot: StorageSlot = {
    slotIndex: currentSlotIndex,
    bytes: Array.from({ length: 32 }, (_, idx) => ({
      byteIndex: idx,
      isPadding: true,
    })),
    usedBytes: 0,
    wastedBytes: 32,
    variables: [],
  };

  let totalBytesUsed = 0;

  for (let i = 0; i < variables.length; i++) {
    const v = variables[i];
    const colorIndex = COLOR_PALETTE[i % COLOR_PALETTE.length];
    const size = Math.min(32, v.byteSize);

    // Solidity rule:
    // If the item does not fit into the remaining part of the current slot,
    // it is moved to the next slot (byte 0)
    if (currentSlotBytesUsed + size > 32) {
      // Finalize current slot
      currentSlot.usedBytes = currentSlotBytesUsed;
      currentSlot.wastedBytes = 32 - currentSlotBytesUsed;
      slots.push(currentSlot);

      // Start new slot
      currentSlotIndex++;
      currentSlotBytesUsed = 0;
      currentSlot = {
        slotIndex: currentSlotIndex,
        bytes: Array.from({ length: 32 }, (_, idx) => ({
          byteIndex: idx,
          isPadding: true,
        })),
        usedBytes: 0,
        wastedBytes: 32,
        variables: [],
      };
    }

    // Place variable in current slot
    const startByte = currentSlotBytesUsed;
    const endByte = startByte + size;

    for (let b = startByte; b < endByte; b++) {
      currentSlot.bytes[b] = {
        byteIndex: b,
        varId: v.id,
        varName: v.name,
        varType: v.type,
        isPadding: false,
        colorIndex,
      };
    }

    currentSlot.variables.push({
      id: v.id,
      name: v.name,
      type: v.type,
      byteSize: size,
      startByte,
      endByte: endByte - 1,
      colorIndex,
    });

    currentSlotBytesUsed += size;
    totalBytesUsed += size;

    // Handle large static multi-slot types (e.g. types > 32 bytes)
    if (v.byteSize > 32) {
      const extraBytes = v.byteSize - 32;
      const extraSlots = Math.ceil(extraBytes / 32);

      currentSlot.usedBytes = 32;
      currentSlot.wastedBytes = 0;
      slots.push(currentSlot);

      for (let s = 0; s < extraSlots; s++) {
        currentSlotIndex++;
        const sBytes = Math.min(32, extraBytes - s * 32);
        const extraSlot: StorageSlot = {
          slotIndex: currentSlotIndex,
          bytes: Array.from({ length: 32 }, (_, idx) => ({
            byteIndex: idx,
            varId: v.id,
            varName: `${v.name}[slot_${s + 1}]`,
            varType: v.type,
            isPadding: idx >= sBytes,
            colorIndex,
          })),
          usedBytes: sBytes,
          wastedBytes: 32 - sBytes,
          variables: [
            {
              id: v.id,
              name: `${v.name}[part_${s + 1}]`,
              type: v.type,
              byteSize: sBytes,
              startByte: 0,
              endByte: sBytes - 1,
              colorIndex,
            },
          ],
        };
        if (s === extraSlots - 1 && sBytes < 32) {
          currentSlot = extraSlot;
          currentSlotBytesUsed = sBytes;
        } else {
          slots.push(extraSlot);
          currentSlotBytesUsed = 0;
        }
      }
    }
  }

  // Push final slot if not already added
  if (!slots.some((s) => s.slotIndex === currentSlot.slotIndex)) {
    currentSlot.usedBytes = currentSlotBytesUsed;
    currentSlot.wastedBytes = 32 - currentSlotBytesUsed;
    slots.push(currentSlot);
  }

  const totalSlots = slots.length;
  const totalBytesAllocated = totalSlots * 32;
  const wastedBytes = totalBytesAllocated - totalBytesUsed;
  const wastedPercentage = totalBytesAllocated > 0 ? Math.round((wastedBytes / totalBytesAllocated) * 100) : 0;
  const efficiencyScore = Math.max(0, 100 - wastedPercentage);

  // Gas heuristics in EVM:
  // - SSTORE cold slot set: 22,100 gas (20,000 + 2,100 cold access)
  // - SLOAD cold slot read: 2,100 gas
  // - SLOAD warm slot read: 100 gas
  // - Deployment storage allocation & bytecode size factor: ~20,000 gas per slot initialized
  const estimatedDeploymentGas = totalSlots * 20000;
  const estimatedColdSstoreCost = totalSlots * 22100;
  const estimatedWarmSloadCost = totalSlots * 100;

  return {
    slots,
    totalSlots,
    totalBytesUsed,
    totalBytesAllocated,
    wastedBytes,
    wastedPercentage,
    efficiencyScore,
    estimatedDeploymentGas,
    estimatedColdSstoreCost,
    estimatedWarmSloadCost,
  };
}

// -------------------------------------------------------------
// 1-Click Storage Re-ordering Optimizer
// -------------------------------------------------------------

export function optimizeStorageLayout(variables: StorageVariable[]): StorageOptimizationResult {
  const originalLayout = computeStorageLayout(variables);

  // Bin-Packing / First-Fit Decreasing algorithm for 32-byte EVM bins:
  // 1. Separate full 32-byte types (uint256, bytes32, mappings, dynamic arrays) which ALWAYS consume 1 full slot.
  // 2. Sort smaller packable types (bool, uint8..uint128, address) descending by size.
  // 3. Greedily fit packable variables into the best slot that has capacity.

  const full32Vars: StorageVariable[] = [];
  const packableVars: StorageVariable[] = [];

  for (const v of variables) {
    if (v.byteSize >= 32) {
      full32Vars.push(v);
    } else {
      packableVars.push(v);
    }
  }

  // Sort packable descending by size (First-Fit Decreasing)
  packableVars.sort((a, b) => b.byteSize - a.byteSize);

  interface Bin {
    vars: StorageVariable[];
    remaining: number;
  }

  const bins: Bin[] = [];

  for (const v of packableVars) {
    // Find first bin with enough space
    let placed = false;
    for (const b of bins) {
      if (b.remaining >= v.byteSize) {
        b.vars.push(v);
        b.remaining -= v.byteSize;
        placed = true;
        break;
      }
    }
    // If no bin fits, open a new 32-byte bin
    if (!placed) {
      bins.push({
        vars: [v],
        remaining: 32 - v.byteSize,
      });
    }
  }

  // Assemble optimized order: packable grouped by bin, followed by full 32-byte items
  const optimizedVariables: StorageVariable[] = [];

  for (const b of bins) {
    for (const v of b.vars) {
      optimizedVariables.push(v);
    }
  }
  for (const v of full32Vars) {
    optimizedVariables.push(v);
  }

  const optimizedLayout = computeStorageLayout(optimizedVariables);
  const slotsSaved = Math.max(0, originalLayout.totalSlots - optimizedLayout.totalSlots);
  const gasSavedDeployment = slotsSaved * 20000;
  const gasSavedFirstWrite = slotsSaved * 22100;
  const gasSavedWarmReads = slotsSaved * 100;
  const isAlreadyOptimal = slotsSaved === 0 && originalLayout.wastedBytes === optimizedLayout.wastedBytes;

  // Generate clean Solidity code
  const reorderedCode = generateSolidityStructOrContract(optimizedVariables);

  return {
    originalLayout,
    optimizedLayout,
    optimizedVariables,
    slotsSaved,
    gasSavedDeployment,
    gasSavedFirstWrite,
    gasSavedWarmReads,
    reorderedCode,
    isAlreadyOptimal,
  };
}

export function generateSolidityStructOrContract(variables: StorageVariable[]): string {
  const lines = [
    "// Optimized Storage Layout generated by MegaTools Storage Packer",
    "// Packed tightly into 32-byte EVM slots",
    "struct OptimizedContractState {",
  ];

  let currentSlotBytes = 0;
  let slotNum = 0;

  for (const v of variables) {
    const size = Math.min(32, v.byteSize);
    if (currentSlotBytes + size > 32) {
      lines.push(`    // --- Slot ${slotNum} End (Free: ${32 - currentSlotBytes} bytes) ---`);
      slotNum++;
      currentSlotBytes = 0;
    }

    const comment = v.comment ? ` // ${v.comment}` : "";
    const slotOffsetNote = ` // Slot ${slotNum} [Offset: ${currentSlotBytes}..${currentSlotBytes + size - 1}] (${v.byteSize}B)`;
    lines.push(`    ${v.type} ${v.name};${comment || slotOffsetNote}`);

    currentSlotBytes += size;
    if (v.byteSize >= 32) {
      currentSlotBytes = 0;
      slotNum++;
    }
  }

  lines.push("}");
  return lines.join("\n");
}

// -------------------------------------------------------------
// Real-World Solidity Presets
// -------------------------------------------------------------

export const PRESET_UNOPTIMIZED_STAKING: StorageVariable[] = [
  { id: "st-1", name: "owner", type: "address", byteSize: 20, visibility: "public", isDynamic: false, comment: "Contract admin" },
  { id: "st-2", name: "totalStaked", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false, comment: "Global pool TVL" },
  { id: "st-3", name: "isPaused", type: "bool", byteSize: 1, visibility: "public", isDynamic: false, comment: "Emergency pause toggle" },
  { id: "st-4", name: "rewardRate", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false, comment: "Tokens distributed per second" },
  { id: "st-5", name: "lockPeriod", type: "uint32", byteSize: 4, visibility: "public", isDynamic: false, comment: "Minimum stake duration" },
  { id: "st-6", name: "maxStakers", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false, comment: "Max pool capacity" },
  { id: "st-7", name: "feeCollector", type: "address", byteSize: 20, visibility: "public", isDynamic: false, comment: "Treasury wallet" },
  { id: "st-8", name: "earlyWithdrawalFeeBps", type: "uint16", byteSize: 2, visibility: "public", isDynamic: false, comment: "Basis points fee" },
  { id: "st-9", name: "allowEmergencyUnstake", type: "bool", byteSize: 1, visibility: "public", isDynamic: false, comment: "Safety exit toggle" },
];

export const PRESET_DEFI_COLLATERAL: StorageVariable[] = [
  { id: "df-1", name: "borrower", type: "address", byteSize: 20, visibility: "public", isDynamic: false },
  { id: "df-2", name: "principalAmount", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false },
  { id: "df-3", name: "interestRateBps", type: "uint16", byteSize: 2, visibility: "public", isDynamic: false },
  { id: "df-4", name: "collateralAmount", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false },
  { id: "df-5", name: "isLiquidated", type: "bool", byteSize: 1, visibility: "public", isDynamic: false },
  { id: "df-6", name: "lastAccrualTimestamp", type: "uint40", byteSize: 5, visibility: "public", isDynamic: false },
  { id: "df-7", name: "liquidationThresholdBps", type: "uint16", byteSize: 2, visibility: "public", isDynamic: false },
  { id: "df-8", name: "oraclePrice", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false },
  { id: "df-9", name: "gracePeriodSeconds", type: "uint32", byteSize: 4, visibility: "public", isDynamic: false },
];

export const PRESET_NFT_GAMING: StorageVariable[] = [
  { id: "nft-1", name: "characterLevel", type: "uint8", byteSize: 1, visibility: "public", isDynamic: false },
  { id: "nft-2", name: "experiencePoints", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false },
  { id: "nft-3", name: "stamina", type: "uint8", byteSize: 1, visibility: "public", isDynamic: false },
  { id: "nft-4", name: "avatarMetadataUri", type: "string", byteSize: 32, visibility: "public", isDynamic: true },
  { id: "nft-5", name: "guildId", type: "uint16", byteSize: 2, visibility: "public", isDynamic: false },
  { id: "nft-6", name: "lastLoginTimestamp", type: "uint32", byteSize: 4, visibility: "public", isDynamic: false },
  { id: "nft-7", name: "characterOwner", type: "address", byteSize: 20, visibility: "public", isDynamic: false },
  { id: "nft-8", name: "isBanned", type: "bool", byteSize: 1, visibility: "public", isDynamic: false },
];

export const PRESET_OPTIMAL_PACKED: StorageVariable[] = [
  // Slot 0 (20 + 4 + 4 + 2 + 1 + 1 = 32 bytes)
  { id: "opt-1", name: "owner", type: "address", byteSize: 20, visibility: "public", isDynamic: false },
  { id: "opt-2", name: "lastUpdate", type: "uint32", byteSize: 4, visibility: "public", isDynamic: false },
  { id: "opt-3", name: "lockPeriod", type: "uint32", byteSize: 4, visibility: "public", isDynamic: false },
  { id: "opt-4", name: "feeBps", type: "uint16", byteSize: 2, visibility: "public", isDynamic: false },
  { id: "opt-5", name: "isPaused", type: "bool", byteSize: 1, visibility: "public", isDynamic: false },
  { id: "opt-6", name: "isEmergency", type: "bool", byteSize: 1, visibility: "public", isDynamic: false },
  // Slot 1 (32 bytes)
  { id: "opt-7", name: "totalStaked", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false },
  // Slot 2 (32 bytes)
  { id: "opt-8", name: "rewardRate", type: "uint256", byteSize: 32, visibility: "public", isDynamic: false },
];
