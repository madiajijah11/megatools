/**
 * EIP-712 Typed Data & Permit Phishing Signature Deconstructor
 *
 * Implements EIP-712 encoding and hashing, pure-TS secp256k1 ecrecover & signing,
 * anti-drainer security heuristics, and human-readable intent translation.
 */

import { keccak256, keccak256Hex, toChecksumAddress } from "./keccak";

// EIP-712 Types
export interface EIP712TypeProperty {
  name: string;
  type: string;
}

export type EIP712Types = Record<string, EIP712TypeProperty[]>;

export interface EIP712Domain {
  name?: string;
  version?: string;
  chainId?: number | string;
  verifyingContract?: string;
  salt?: string;
  [key: string]: unknown;
}

export interface EIP712Payload {
  types: EIP712Types;
  primaryType: string;
  domain: EIP712Domain;
  message: Record<string, unknown>;
}

// Security Assessment & Risk Flag
export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface SecurityRiskFlag {
  id: string;
  level: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
}

export interface HumanReadableSummary {
  protocolName: string;
  actionType: "token_permit" | "permit2_allowance" | "permit2_transfer" | "seaport_order" | "generic_typed_data";
  ownerOrSigner?: string;
  spenderOrRecipient?: string;
  assetDetails?: string;
  amountOrAllowance?: string;
  isUnlimited: boolean;
  deadlineDisplay?: string;
  isExpired: boolean;
  networkName: string;
  verifyingContract?: string;
}

export interface SignatureComponents {
  r: string;
  s: string;
  v: number;
  isLowerS: boolean;
  lengthBytes: number;
  isValidFormat: boolean;
  formatDescription: string;
}

export interface EIP712AnalysisResult {
  isValid: boolean;
  errorMessage?: string;
  payload?: EIP712Payload;
  primaryType: string;
  domainSeparatorHash: string;
  messageHash: string;
  eip712Digest: string;
  recoveredSigner?: string;
  signatureValid?: boolean;
  signatureError?: string;
  signatureComponents?: SignatureComponents;
  summary: HumanReadableSummary;
  overallRisk: RiskLevel;
  riskScore: number; // 0 (Safe) to 100 (Deadly Drainer)
  riskFlags: SecurityRiskFlag[];
  typeHash: string;
  encodedTypeString: string;
}

// EVM Chain Name Mapping
export const EVM_CHAINS: Record<string, string> = {
  "1": "Ethereum Mainnet",
  "10": "Optimism Mainnet",
  "56": "BNB Smart Chain",
  "137": "Polygon PoS",
  "8453": "Base",
  "42161": "Arbitrum One",
  "43114": "Avalanche C-Chain",
  "11155111": "Sepolia Testnet",
};

// Known Safe Protocol Contracts
export const KNOWN_ROUTERS: Record<string, string> = {
  "0x000000000022d473030f116ddee9f6b43ac78ba3": "Uniswap Permit2 Canonical Contract",
  "0x00000000000000adc04c56bf30ac9d3c0aaf14dc": "Seaport 1.5 Marketplace Contract",
  "0x00000000000001ad428e4906ae43d8f9852d0dd6": "Seaport 1.6 Marketplace Contract",
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Uniswap Universal Router",
  "0x111111125421ca6dc452d289314280a0f8842a65": "1inch Aggregation Router v6",
  "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Exchange Proxy",
  "0x9008d19f58aabd9ed0d60971565aa8510560ab41": "CoW Protocol GPv2Settlement",
};

// Max Uint Constants for unlimited allowance detection
const MAX_UINT256_HEX = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const MAX_UINT256_DEC = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
const MAX_UINT160_HEX = "0xffffffffffffffffffffffffffffffffffffffff";
const MAX_UINT128_HEX = "0xffffffffffffffffffffffffffffffff";
const MAX_UINT48_HEX = "0xffffffffffff";

// BigInt Helper to check for unlimited amount
export function isUnlimitedAmount(val: unknown): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).toLowerCase().trim();
  if (s === MAX_UINT256_HEX || s === MAX_UINT256_DEC) return true;
  if (s === MAX_UINT160_HEX || s === MAX_UINT128_HEX || s === MAX_UINT48_HEX) return true;
  if (s.startsWith("0xffffff") && s.length >= 20) return true;
  try {
    const bi = BigInt(s);
    const maxHalf = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    return bi >= maxHalf;
  } catch {
    return false;
  }
}

// BigInt SECP256K1 Implementation
export const SECP256K1_P = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F");
export const SECP256K1_N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
export const SECP256K1_GX = BigInt("0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798");
export const SECP256K1_GY = BigInt("0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8");

function mod(n: bigint, m: bigint = SECP256K1_P): bigint {
  const result = n % m;
  return result >= 0n ? result : result + m;
}

function modInverse(k: bigint, m: bigint = SECP256K1_P): bigint {
  if (k === 0n) throw new Error("Division by zero");
  let lm = 1n, hm = 0n;
  let low = mod(k, m), high = m;
  while (low > 1n) {
    const ratio = high / low;
    const nm = hm - lm * ratio;
    const newLow = high - low * ratio;
    hm = lm;
    lm = nm;
    high = low;
    low = newLow;
  }
  return mod(lm, m);
}

// Modular square root for secp256k1 where P % 4 === 3
function modSqrt(a: bigint, p: bigint = SECP256K1_P): bigint {
  return modExp(a, (p + 1n) / 4n, p);
}

function modExp(base: bigint, exp: bigint, p: bigint): bigint {
  let res = 1n;
  base = mod(base, p);
  while (exp > 0n) {
    if (exp % 2n === 1n) res = mod(res * base, p);
    base = mod(base * base, p);
    exp = exp / 2n;
  }
  return res;
}

type Point = [bigint, bigint] | null;

function pointAdd(P1: Point, P2: Point): Point {
  if (P1 === null) return P2;
  if (P2 === null) return P1;
  const [x1, y1] = P1;
  const [x2, y2] = P2;

  if (x1 === x2) {
    if (mod(y1 + y2) === 0n) return null;
    const lambda = mod(3n * x1 * x1 * modInverse(2n * y1));
    const x3 = mod(lambda * lambda - 2n * x1);
    const y3 = mod(lambda * (x1 - x3) - y1);
    return [x3, y3];
  } else {
    const lambda = mod((y2 - y1) * modInverse(x2 - x1));
    const x3 = mod(lambda * lambda - x1 - x2);
    const y3 = mod(lambda * (x1 - x3) - y1);
    return [x3, y3];
  }
}

function pointMultiply(k: bigint, pt: Point): Point {
  let curr = pt;
  let res: Point = null;
  let scalar = k;
  while (scalar > 0n) {
    if (scalar & 1n) {
      res = pointAdd(res, curr);
    }
    curr = pointAdd(curr, curr);
    scalar >>= 1n;
  }
  return res;
}

/**
 * Split and inspect 65-byte ECDSA signature into r, s, v with EIP-2 malleability verification.
 */
export function splitSignature(signatureHex: string): SignatureComponents | null {
  const clean = signatureHex.trim().replace(/^0x/, "");
  if (clean.length !== 130) {
    return null;
  }

  const rHex = clean.slice(0, 64);
  const sHex = clean.slice(64, 128);
  const vHex = clean.slice(128, 130);

  const vInt = parseInt(vHex, 16);
  const sBig = BigInt("0x" + sHex);
  const isLowerS = sBig <= SECP256K1_N / 2n;

  return {
    r: "0x" + rHex,
    s: "0x" + sHex,
    v: vInt,
    isLowerS,
    lengthBytes: 65,
    isValidFormat: true,
    formatDescription: isLowerS
      ? "Canonical 65-byte ECDSA (EIP-2 Malleability Protected)"
      : "Non-standard high-S signature (Vulnerable to transaction malleability)",
  };
}

/**
 * Derive Ethereum checksummed address from private key in pure TypeScript.
 */
export function deriveAddressFromPrivateKey(privKeyHex: string): string {
  const clean = privKeyHex.trim().replace(/^0x/, "");
  if (clean.length !== 64) {
    throw new Error("Private key must be exactly 32 bytes (64 hex characters)");
  }
  const privBig = BigInt("0x" + clean);
  if (privBig <= 0n || privBig >= SECP256K1_N) {
    throw new Error("Private key out of valid secp256k1 range");
  }

  const pub = pointMultiply(privBig, [SECP256K1_GX, SECP256K1_GY]);
  if (!pub) throw new Error("Failed to derive public key");

  const qxHex = pub[0].toString(16).padStart(64, "0");
  const qyHex = pub[1].toString(16).padStart(64, "0");
  const pubBytes = hexToBytes(qxHex + qyHex);

  const hash = keccak256(pubBytes);
  const addrBytes = hash.slice(12, 32);
  const addrHex = bytesToHex(addrBytes);
  return toChecksumAddress("0x" + addrHex);
}

/**
 * Deterministically sign a 32-byte digest with a private key (RFC-6979 inspired via Keccak).
 */
export function signDigest(digestHex: string, privKeyHex: string): string {
  const cleanDigest = digestHex.trim().replace(/^0x/, "");
  const cleanPriv = privKeyHex.trim().replace(/^0x/, "");

  if (cleanDigest.length !== 64) {
    throw new Error("Digest must be exactly 32 bytes (64 hex characters)");
  }
  if (cleanPriv.length !== 64) {
    throw new Error("Private key must be exactly 32 bytes (64 hex characters)");
  }

  const z = BigInt("0x" + cleanDigest);
  const d = BigInt("0x" + cleanPriv);

  // Deterministic nonce k derivation
  const combined = hexToBytes(cleanDigest + cleanPriv);
  const kBytes = keccak256(combined);
  let k = mod(BigInt("0x" + bytesToHex(kBytes)), SECP256K1_N);
  if (k === 0n) k = 1n;

  const R = pointMultiply(k, [SECP256K1_GX, SECP256K1_GY]);
  if (!R) throw new Error("Signing failed (point at infinity)");

  const r = mod(R[0], SECP256K1_N);
  const kInv = modInverse(k, SECP256K1_N);
  let s = mod(kInv * (z + r * d), SECP256K1_N);
  let v = Number(R[1] % 2n);

  // EIP-2: enforce lower S
  if (s > SECP256K1_N / 2n) {
    s = SECP256K1_N - s;
    v = v ^ 1;
  }

  const vHex = (v + 27).toString(16).padStart(2, "0");
  const rHex = r.toString(16).padStart(64, "0");
  const sHex = s.toString(16).padStart(64, "0");
  return "0x" + rHex + sHex + vHex;
}

/**
 * Recover Ethereum address from message digest and raw signature (r, s, v).
 */
export function recoverSignerAddress(digestHex: string, signatureHex: string): string {
  const cleanSig = signatureHex.trim().replace(/^0x/, "");
  if (cleanSig.length !== 130) {
    throw new Error(`Invalid signature length: expected 130 hex characters (65 bytes), got ${cleanSig.length}`);
  }

  const rHex = cleanSig.slice(0, 64);
  const sHex = cleanSig.slice(64, 128);
  const vHex = cleanSig.slice(128, 130);

  const r = BigInt("0x" + rHex);
  const s = BigInt("0x" + sHex);
  let v = parseInt(vHex, 16);

  if (v >= 27) v -= 27; // normalize v to 0 or 1
  if (v !== 0 && v !== 1) {
    throw new Error(`Invalid signature recovery id v=${v} (expected 0, 1, 27, or 28)`);
  }

  if (r <= 0n || r >= SECP256K1_N || s <= 0n || s >= SECP256K1_N) {
    throw new Error("Invalid signature r or s parameters out of curve range");
  }

  const cleanDigest = digestHex.trim().replace(/^0x/, "");
  if (cleanDigest.length !== 64) {
    throw new Error(`Invalid digest length: expected 64 hex characters (32 bytes), got ${cleanDigest.length}`);
  }
  const z = BigInt("0x" + cleanDigest);

  // Calculate curve point R = (x, y) where x = r
  const x = r;
  const alpha = mod(x * x * x + 7n);
  let y = modSqrt(alpha);

  if (mod(y * y) !== alpha) {
    throw new Error("Invalid signature: point R is not on curve secp256k1");
  }

  if (Number(y % 2n) !== v) {
    y = SECP256K1_P - y;
  }

  const R: Point = [x, y];
  const G: Point = [SECP256K1_GX, SECP256K1_GY];

  // Q = r^-1 * (s*R - z*G)
  const rInv = modInverse(r, SECP256K1_N);
  const sR = pointMultiply(s, R);
  const zG = pointMultiply(z, G);
  const negZG: Point = zG ? [zG[0], SECP256K1_P - zG[1]] : null;
  const sRMinusZG = pointAdd(sR, negZG);
  const Q = pointMultiply(rInv, sRMinusZG);

  if (!Q) {
    throw new Error("Failed to recover public key (point at infinity)");
  }

  // Format uncompressed public key (64 bytes: Qx || Qy)
  const qxHex = Q[0].toString(16).padStart(64, "0");
  const qyHex = Q[1].toString(16).padStart(64, "0");
  const pubKeyBytes = hexToBytes(qxHex + qyHex);

  // Address is the last 20 bytes of Keccak-256 of the 64-byte public key
  const pubHash = keccak256(pubKeyBytes);
  const addressBytes = pubHash.slice(12, 32);
  const addressHex = Array.from(addressBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return toChecksumAddress("0x" + addressHex);
}

// Hex & Byte Utilities
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  const len = clean.length;
  const bytes = new Uint8Array(Math.floor(len / 2));
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function padLeftWord(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes;
  const out = new Uint8Array(32);
  out.set(bytes, 32 - bytes.length);
  return out;
}

function padRightWord(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes;
  const out = new Uint8Array(32);
  out.set(bytes, 0);
  return out;
}

function bigIntToWord(val: bigint): Uint8Array {
  let hex = val.toString(16);
  if (hex.length % 2 !== 0) hex = "0" + hex;
  const bytes = hexToBytes(hex);
  return padLeftWord(bytes);
}

// EIP-712 Canonical Encoding Engine
export function encodeType(primaryType: string, types: EIP712Types): string {
  const findReferencedTypes = (type: string, visited: Set<string>) => {
    if (visited.has(type) || !types[type]) return;
    visited.add(type);
    for (const prop of types[type]) {
      const cleanType = prop.type.replace(/\[\d*\]$/, "");
      if (types[cleanType]) {
        findReferencedTypes(cleanType, visited);
      }
    }
  };

  const visited = new Set<string>();
  findReferencedTypes(primaryType, visited);
  visited.delete(primaryType);

  const subTypes = Array.from(visited).sort();
  const allTypes = [primaryType, ...subTypes];

  return allTypes
    .map((t) => {
      const props = types[t] || [];
      const propStr = props.map((p) => `${p.type} ${p.name}`).join(",");
      return `${t}(${propStr})`;
    })
    .join("");
}

export function typeHash(primaryType: string, types: EIP712Types): Uint8Array {
  const enc = encodeType(primaryType, types);
  return keccak256(enc);
}

function encodeField(type: string, value: unknown, types: EIP712Types): Uint8Array {
  // Array types: type[]
  if (type.endsWith("[]")) {
    const baseType = type.slice(0, -2);
    if (!Array.isArray(value)) {
      return keccak256(new Uint8Array(0));
    }
    const chunks: Uint8Array[] = value.map((item) => encodeField(baseType, item, types));
    const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
    const combined = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      combined.set(c, offset);
      offset += c.length;
    }
    return keccak256(combined);
  }

  // Struct types
  if (types[type]) {
    return hashStruct(type, (value as Record<string, unknown>) || {}, types);
  }

  // String
  if (type === "string") {
    const s = String(value || "");
    return keccak256(s);
  }

  // Dynamic bytes
  if (type === "bytes") {
    if (typeof value === "string") {
      const raw = value.startsWith("0x") ? hexToBytes(value) : new TextEncoder().encode(value);
      return keccak256(raw);
    }
    return keccak256(new Uint8Array(0));
  }

  // Fixed bytes: bytes1 .. bytes32
  if (type.startsWith("bytes")) {
    const size = parseInt(type.slice(5), 10);
    if (!isNaN(size) && size >= 1 && size <= 32) {
      const hex = String(value || "").replace(/^0x/, "");
      const bytes = hexToBytes(hex.padEnd(size * 2, "0"));
      return padRightWord(bytes);
    }
  }

  // Boolean
  if (type === "bool") {
    const b = Boolean(value);
    const word = new Uint8Array(32);
    if (b) word[31] = 1;
    return word;
  }

  // Address
  if (type === "address") {
    const clean = String(value || "").toLowerCase().replace(/^0x/, "").padStart(40, "0");
    const addrBytes = hexToBytes(clean);
    return padLeftWord(addrBytes);
  }

  // Unsigned & signed integers: uint8..uint256, int8..int256
  if (type.startsWith("uint") || type.startsWith("int")) {
    try {
      const valBig = BigInt(String(value || "0"));
      return bigIntToWord(valBig >= 0n ? valBig : SECP256K1_P + valBig);
    } catch {
      return new Uint8Array(32);
    }
  }

  return new Uint8Array(32);
}

export function encodeData(primaryType: string, data: Record<string, unknown>, types: EIP712Types): Uint8Array {
  const props = types[primaryType] || [];
  const encodedParts: Uint8Array[] = [];

  for (const prop of props) {
    const val = data ? data[prop.name] : undefined;
    encodedParts.push(encodeField(prop.type, val, types));
  }

  const totalLen = encodedParts.reduce((acc, c) => acc + c.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of encodedParts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function hashStruct(primaryType: string, data: Record<string, unknown>, types: EIP712Types): Uint8Array {
  const tHash = typeHash(primaryType, types);
  const encData = encodeData(primaryType, data, types);
  const combined = new Uint8Array(tHash.length + encData.length);
  combined.set(tHash, 0);
  combined.set(encData, tHash.length);
  return keccak256(combined);
}

export function computeDomainSeparator(domain: EIP712Domain, customTypes?: EIP712Types): Uint8Array {
  const domainTypes: EIP712TypeProperty[] = [];
  if (domain.name !== undefined) domainTypes.push({ name: "name", type: "string" });
  if (domain.version !== undefined) domainTypes.push({ name: "version", type: "string" });
  if (domain.chainId !== undefined) domainTypes.push({ name: "chainId", type: "uint256" });
  if (domain.verifyingContract !== undefined) domainTypes.push({ name: "verifyingContract", type: "address" });
  if (domain.salt !== undefined) domainTypes.push({ name: "salt", type: "bytes32" });

  const typesToUse: EIP712Types = customTypes?.EIP712Domain
    ? customTypes
    : { ...customTypes, EIP712Domain: domainTypes };

  return hashStruct("EIP712Domain", domain as Record<string, unknown>, typesToUse);
}

export function computeEIP712Digest(domainSeparator: Uint8Array, structHash: Uint8Array): Uint8Array {
  // \x19\x01 || domainSeparator || structHash
  const combined = new Uint8Array(2 + 32 + 32);
  combined[0] = 0x19;
  combined[1] = 0x01;
  combined.set(domainSeparator, 2);
  combined.set(structHash, 34);
  return keccak256(combined);
}

// Phishing Heuristics & Analysis Engine
export function analyzeEIP712Payload(
  rawInput: string,
  signatureHex?: string
): EIP712AnalysisResult {
  const flags: SecurityRiskFlag[] = [];
  let parsedPayload: EIP712Payload | undefined;

  try {
    const raw = JSON.parse(rawInput);

    // Auto-detect & normalize if user supplied standard EIP-712 schema or short format
    if (raw.types && (raw.domain || raw.message)) {
      parsedPayload = {
        types: raw.types,
        primaryType: raw.primaryType || Object.keys(raw.types).find((k) => k !== "EIP712Domain") || "Permit",
        domain: raw.domain || {},
        message: raw.message || {},
      };
    } else if (raw.owner && raw.spender && (raw.value !== undefined || raw.amount !== undefined)) {
      // Auto-wrap bare ERC-2612 Permit
      parsedPayload = {
        types: {
          EIP712Domain: [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          Permit: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
            { name: "value", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        },
        primaryType: "Permit",
        domain: {
          name: "Token",
          version: "1",
          chainId: 1,
          verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
        message: raw,
      };
    } else {
      throw new Error("Invalid EIP-712 payload. Missing 'types', 'domain', or 'message' fields.");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid JSON format";
    return {
      isValid: false,
      errorMessage: message,
      primaryType: "",
      domainSeparatorHash: "",
      messageHash: "",
      eip712Digest: "",
      summary: {
        protocolName: "Unknown",
        actionType: "generic_typed_data",
        isUnlimited: false,
        isExpired: false,
        networkName: "Unknown",
      },
      overallRisk: "critical",
      riskScore: 100,
      riskFlags: [
        {
          id: "parse_error",
          level: "critical",
          title: "Malformed EIP-712 JSON Structure",
          description: message,
          recommendation: "Ensure your payload contains valid JSON with 'types', 'domain', and 'message' keys.",
        },
      ],
      typeHash: "",
      encodedTypeString: "",
    };
  }

  const { types, primaryType, domain, message } = parsedPayload;

  // Hashing calculations
  const encType = encodeType(primaryType, types);
  const tHash = typeHash(primaryType, types);
  const domSep = computeDomainSeparator(domain, types);
  const sHash = hashStruct(primaryType, message, types);
  const digest = computeEIP712Digest(domSep, sHash);

  const digestHex = "0x" + bytesToHex(digest);
  const domSepHex = "0x" + bytesToHex(domSep);
  const sHashHex = "0x" + bytesToHex(sHash);
  const tHashHex = "0x" + bytesToHex(tHash);

  // Signer recovery & signature decomposition if signature provided
  let recoveredSigner: string | undefined;
  let signatureValid: boolean | undefined;
  let signatureError: string | undefined;
  let signatureComponents: SignatureComponents | undefined;

  if (signatureHex && signatureHex.trim().length > 0) {
    signatureComponents = splitSignature(signatureHex) ?? undefined;
    try {
      recoveredSigner = recoverSignerAddress(digestHex, signatureHex);
      signatureValid = true;
    } catch (e: unknown) {
      signatureValid = false;
      signatureError = e instanceof Error ? e.message : "Failed to recover signer";
    }
  }

  // Protocol & Action Detection
  const chainIdStr = String(domain.chainId || "");
  const networkName = EVM_CHAINS[chainIdStr] || (chainIdStr ? `Chain ID ${chainIdStr}` : "Unspecified Network");
  const protocolName = domain.name || "Custom Contract";
  const verifyingContract = domain.verifyingContract ? toChecksumAddress(domain.verifyingContract) : undefined;

  let actionType: HumanReadableSummary["actionType"] = "generic_typed_data";
  let ownerOrSigner: string | undefined;
  let spenderOrRecipient: string | undefined;
  let assetDetails: string | undefined;
  let amountOrAllowance: string | undefined;
  let isUnlimited = false;
  let isExpired = false;
  let deadlineDisplay: string | undefined;

  const nowSeconds = Math.floor(Date.now() / 1000);

  // 1. ERC-2612 Standard Permit Detection
  if (primaryType.toLowerCase() === "permit") {
    actionType = "token_permit";
    ownerOrSigner = message.owner ? String(message.owner) : undefined;
    spenderOrRecipient = message.spender ? String(message.spender) : undefined;
    const rawVal = message.value !== undefined ? message.value : message.amount;
    isUnlimited = isUnlimitedAmount(rawVal);
    amountOrAllowance = isUnlimited ? "Infinite (Unlimited MaxUint256)" : String(rawVal);

    if (message.deadline !== undefined) {
      const dl = Number(message.deadline);
      if (isUnlimitedAmount(message.deadline) || dl > 2500000000) {
        deadlineDisplay = "Infinite (Never Expires / Year 2099+)";
      } else {
        const d = new Date(dl * 1000);
        deadlineDisplay = d.toUTCString();
        isExpired = dl < nowSeconds;
      }
    }
  }
  // 2. Uniswap Permit2 Allowance Detection
  else if (primaryType === "PermitSingle" || primaryType === "PermitBatch") {
    actionType = "permit2_allowance";
    spenderOrRecipient = message.spender ? String(message.spender) : undefined;
    if (message.details && typeof message.details === "object") {
      const det = message.details as Record<string, unknown>;
      assetDetails = det.token ? String(det.token) : undefined;
      isUnlimited = isUnlimitedAmount(det.amount);
      amountOrAllowance = isUnlimited ? "Infinite (MaxUint160)" : String(det.amount);
      if (det.expiration !== undefined) {
        const exp = Number(det.expiration);
        if (isUnlimitedAmount(det.expiration) || exp > 2500000000) {
          deadlineDisplay = "Infinite / Never Expires";
        } else {
          deadlineDisplay = new Date(exp * 1000).toUTCString();
          isExpired = exp < nowSeconds;
        }
      }
    }
  }
  // 3. Seaport / Blur NFT Marketplace Order
  else if (primaryType === "OrderComponents" || primaryType === "Order") {
    actionType = "seaport_order";
    ownerOrSigner = message.offerer ? String(message.offerer) : undefined;
    assetDetails = `Seaport Order with ${Array.isArray(message.offer) ? message.offer.length : 0} offered item(s)`;
    if (message.endTime !== undefined) {
      const end = Number(message.endTime);
      deadlineDisplay = new Date(end * 1000).toUTCString();
      isExpired = end < nowSeconds;
    }
  }

  // --- SECURITY RISK EVALUATION ENGINE ---

  // Check 1: Unlimited Token Allowance (Drainer Prime Target)
  if (isUnlimited) {
    flags.push({
      id: "unlimited_allowance",
      level: "critical",
      title: "🚨 Infinite / Unlimited Token Approval (MaxUint256)",
      description:
        "This signature grants the spender permanent, unrestricted permission to transfer ALL of your tokens from this contract, including any future tokens deposited.",
      recommendation:
        "Only approve infinite allowance to battle-tested routers (Uniswap, 1inch). For third-party or unfamiliar dApps, approve only the exact transaction amount.",
    });
  }

  // Check 2: Infinite or Perpetual Deadline
  if (deadlineDisplay && deadlineDisplay.includes("Infinite")) {
    flags.push({
      id: "infinite_deadline",
      level: "high",
      title: "⏳ Perpetual Signature (Never Expires)",
      description:
        "The signature has no expiration date (or expires decades in the future). The spender can hold this offline signature and drain your wallet at any time later.",
      recommendation: "Ensure deadlines are tightly bound (typically 10-30 minutes from transaction creation).",
    });
  }

  // Check 3: Expired Deadline
  if (isExpired) {
    flags.push({
      id: "expired_signature",
      level: "medium",
      title: "⚠️ Signature Has Already Expired",
      description: `The deadline timestamp was ${deadlineDisplay}, which is in the past. This signature will revert on-chain if broadcast.`,
      recommendation: "Request a fresh signature if you still intend to execute this transaction.",
    });
  }

  // Check 4: Seaport Zero-Consideration Drainer Pattern
  if (actionType === "seaport_order") {
    const offer = Array.isArray(message.offer) ? message.offer : [];
    const consideration = Array.isArray(message.consideration) ? message.consideration : [];

    if (offer.length > 0 && consideration.length === 0) {
      flags.push({
        id: "seaport_zero_consideration",
        level: "critical",
        title: "💀 Monkey/Inferno Drainer Signature Pattern (0 Consideration)",
        description:
          "This Seaport order transfers valuable NFTs or ERC-20 tokens from your wallet while demanding 0 return payment (empty consideration array). This is the hallmark signature used by phishing drainers.",
        recommendation: "DO NOT SIGN! Reject this signature immediately and revoke all approvals on revoke.cash.",
      });
    }
  }

  // Check 5: Spender Address Reputation
  if (spenderOrRecipient) {
    const cleanSpender = spenderOrRecipient.toLowerCase();
    const knownRouter = KNOWN_ROUTERS[cleanSpender];
    if (knownRouter) {
      flags.push({
        id: "known_spender",
        level: "safe",
        title: "🛡️ Verified Protocol Spender Contract",
        description: `Spender address matches ${knownRouter}.`,
        recommendation: "Safe contract address detected, but always verify you are on the legitimate domain.",
      });
    } else if (cleanSpender === "0x0000000000000000000000000000000000000000") {
      flags.push({
        id: "zero_address_spender",
        level: "high",
        title: "⚠️ Null Address Spender (0x0)",
        description: "The designated spender is the zero address. Tokens will be unspendable or burned.",
        recommendation: "Verify intended recipient.",
      });
    } else {
      flags.push({
        id: "unverified_spender",
        level: "medium",
        title: "🔍 Unverified Third-Party Spender Address",
        description: `The spender (${toChecksumAddress(spenderOrRecipient)}) is an unindexed contract or EOA wallet.`,
        recommendation: "Inspect the spender on Etherscan or block explorer before signing.",
      });
    }
  }

  // Check 6: Verifying Contract Check
  if (verifyingContract) {
    const knownContract = KNOWN_ROUTERS[verifyingContract.toLowerCase()];
    if (knownContract) {
      flags.push({
        id: "known_verifying_contract",
        level: "safe",
        title: "🛡️ Canonical Verifying Contract",
        description: `Domain contract verified as ${knownContract}.`,
        recommendation: "Legitimate protocol contract address verified.",
      });
    }
  } else {
    flags.push({
      id: "missing_verifying_contract",
      level: "medium",
      title: "⚠️ Missing verifyingContract in EIP712Domain",
      description: "Without verifyingContract, this signature may be vulnerable to cross-contract replay attacks.",
      recommendation: "Legitimate dApps should always specify verifyingContract in the domain separator.",
    });
  }

  // Check 7: Signer Mismatch
  if (recoveredSigner && ownerOrSigner) {
    if (recoveredSigner.toLowerCase() !== ownerOrSigner.toLowerCase()) {
      flags.push({
        id: "signer_mismatch",
        level: "critical",
        title: "❌ Recovered Signer Mismatches Declared Owner",
        description: `The recovered secp256k1 public key address (${recoveredSigner}) does NOT match the 'owner' field in the message (${toChecksumAddress(ownerOrSigner)}).`,
        recommendation: "This signature is invalid on-chain and will fail or was produced by an unrelated private key.",
      });
    } else {
      flags.push({
        id: "signer_verified",
        level: "safe",
        title: "✅ Secp256k1 Signer Successfully Verified",
        description: `Recovered signer address matches declared owner: ${recoveredSigner}.`,
        recommendation: "Cryptographic signature matches the EIP-712 digest.",
      });
    }
  }

  // Compute Overall Risk & Score
  let score = 10; // baseline
  let hasCritical = false;
  let hasHigh = false;
  let hasMedium = false;

  for (const f of flags) {
    if (f.level === "critical") {
      score += 45;
      hasCritical = true;
    } else if (f.level === "high") {
      score += 25;
      hasHigh = true;
    } else if (f.level === "medium") {
      score += 10;
      hasMedium = true;
    }
  }

  score = Math.min(100, Math.max(0, score));

  let overallRisk: RiskLevel = "safe";
  if (hasCritical || score >= 75) {
    overallRisk = "critical";
  } else if (hasHigh || score >= 50) {
    overallRisk = "high";
  } else if (hasMedium || score >= 25) {
    overallRisk = "medium";
  } else {
    overallRisk = "safe";
  }

  return {
    isValid: true,
    payload: parsedPayload,
    primaryType,
    domainSeparatorHash: domSepHex,
    messageHash: sHashHex,
    eip712Digest: digestHex,
    recoveredSigner,
    signatureValid,
    signatureError,
    signatureComponents,
    summary: {
      protocolName,
      actionType,
      ownerOrSigner: ownerOrSigner ? toChecksumAddress(ownerOrSigner) : undefined,
      spenderOrRecipient: spenderOrRecipient ? toChecksumAddress(spenderOrRecipient) : undefined,
      assetDetails,
      amountOrAllowance,
      isUnlimited,
      deadlineDisplay,
      isExpired,
      networkName,
      verifyingContract,
    },
    overallRisk,
    riskScore: score,
    riskFlags: flags,
    typeHash: tHashHex,
    encodedTypeString: encType,
  };
}

// Default standard Foundry / Hardhat test account #0
export const DEFAULT_TEST_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const DEFAULT_TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Curated Test Presets
export const PRESET_ERC2612_DRAINER_SCAM = JSON.stringify(
  {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit",
    domain: {
      name: "USD Coin",
      version: "2",
      chainId: 1,
      verifyingContract: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    message: {
      owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Victim Account
      spender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // Attacker drainer address
      value: "115792089237316195423570985008687907853269984665640564039457584007913129639935", // MaxUint256
      nonce: 0,
      deadline: "115792089237316195423570985008687907853269984665640564039457584007913129639935", // Never expires
    },
  },
  null,
  2
);

// Pre-computed valid signature for PRESET_ERC2612_DRAINER_SCAM signed by owner 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
export const PRESET_ERC2612_SAMPLE_SIG = "0x0e93cd74dab8c84de2f93f2e86dc5d1123c0e44c38e36fd7fd40e8ee118a68f9268766f7c49fbd919df5ca29b07b7aef984a5002a0a99f0df45827c8077554491c";

export const PRESET_UNISWAP_PERMIT2 = JSON.stringify(
  {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      PermitSingle: [
        { name: "details", type: "PermitDetails" },
        { name: "spender", type: "address" },
        { name: "sigDeadline", type: "uint256" },
      ],
      PermitDetails: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint160" },
        { name: "expiration", type: "uint48" },
        { name: "nonce", type: "uint48" },
      ],
    },
    primaryType: "PermitSingle",
    domain: {
      name: "Permit2",
      chainId: 1,
      verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    },
    message: {
      details: {
        token: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        amount: "1000000000000000000", // 1.0 WETH
        expiration: 1893456000,
        nonce: 1,
      },
      spender: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD", // Uniswap Universal Router
      sigDeadline: 1893456000,
    },
  },
  null,
  2
);

export const PRESET_UNISWAP_SAMPLE_SIG = "0x2d78c4df0c732d155b3f1b46c623e73391ccf0be7ac190db938ed6b5dd6c1181727001d129516ca8f5b686e31ae48028e624c21f37ba6c101fc85ebdddf99a541b";

export const PRESET_SEAPORT_DRAINER = JSON.stringify(
  {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      OrderComponents: [
        { name: "offerer", type: "address" },
        { name: "zone", type: "address" },
        { name: "offer", type: "OfferItem[]" },
        { name: "consideration", type: "ConsiderationItem[]" },
        { name: "orderType", type: "uint8" },
        { name: "startTime", type: "uint256" },
        { name: "endTime", type: "uint256" },
        { name: "zoneHash", type: "bytes32" },
        { name: "salt", type: "uint256" },
        { name: "conduitKey", type: "bytes32" },
        { name: "counter", type: "uint256" },
      ],
      OfferItem: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifierOrCriteria", type: "uint256" },
        { name: "startAmount", type: "uint256" },
        { name: "endAmount", type: "uint256" },
      ],
      ConsiderationItem: [
        { name: "itemType", type: "uint8" },
        { name: "token", type: "address" },
        { name: "identifierOrCriteria", type: "uint256" },
        { name: "startAmount", type: "uint256" },
        { name: "endAmount", type: "uint256" },
        { name: "recipient", type: "address" },
      ],
    },
    primaryType: "OrderComponents",
    domain: {
      name: "Seaport",
      version: "1.5",
      chainId: 1,
      verifyingContract: "0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC",
    },
    message: {
      offerer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      zone: "0x0000000000000000000000000000000000000000",
      offer: [
        {
          itemType: 2, // ERC721
          token: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D", // BAYC Bored Ape
          identifierOrCriteria: "1337",
          startAmount: 1,
          endAmount: 1,
        },
      ],
      consideration: [], // EMPTY CONSIDERATION: 0 PAYMENT TO VICTIM!
      orderType: 0,
      startTime: 1672531199,
      endTime: 1735689599,
      zoneHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      salt: 987654321,
      conduitKey: "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
      counter: 0,
    },
  },
  null,
  2
);

export const PRESET_SEAPORT_SAMPLE_SIG = "0xafc35f6697bc1aff5964b210815e3af7f71f44f5c7c2b61745ee525a74cdc651511c5eb4304eb023b0e939f05bca9044389878bda00b2c42a9bf5e3299879a441c";

export const PRESET_SAFE_MULTISIG = JSON.stringify(
  {
    types: {
      EIP712Domain: [
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      SafeTx: [
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "data", type: "bytes" },
        { name: "operation", type: "uint8" },
        { name: "safeTxGas", type: "uint256" },
        { name: "baseGas", type: "uint256" },
        { name: "gasPrice", type: "uint256" },
        { name: "gasToken", type: "address" },
        { name: "refundReceiver", type: "address" },
        { name: "nonce", type: "uint256" },
      ],
    },
    primaryType: "SafeTx",
    domain: {
      chainId: 1,
      verifyingContract: "0x1234567890123456789012345678901234567890",
    },
    message: {
      to: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
      value: "500000000000000000", // 0.5 ETH
      data: "0x",
      operation: 0,
      safeTxGas: 150000,
      baseGas: 0,
      gasPrice: 0,
      gasToken: "0x0000000000000000000000000000000000000000",
      refundReceiver: "0x0000000000000000000000000000000000000000",
      nonce: 42,
    },
  },
  null,
  2
);

export const PRESET_SAFE_SAMPLE_SIG = "0x5b26365b28448beef3b1a85d3053876fdbcecaf27bd0518704e807d81b0821ca0eaf85f282933ee5105b7abeb2d4175153cf819f0ac2a15e5400f4ce233e14091b";
