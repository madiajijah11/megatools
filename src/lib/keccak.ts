// Zero-dependency pure TypeScript implementation of Keccak-256 (Ethereum standard)
// State representation: 5x5 array of 64-bit words (BigInt)

const ROUND_CONSTANTS: bigint[] = [
  BigInt("0x0000000000000001"), BigInt("0x0000000000008082"), BigInt("0x800000000000808a"), BigInt("0x8000000080008000"),
  BigInt("0x000000000000808b"), BigInt("0x0000000080000001"), BigInt("0x8000000080008081"), BigInt("0x8000000000008009"),
  BigInt("0x000000000000008a"), BigInt("0x0000000000000088"), BigInt("0x0000000080008009"), BigInt("0x000000008000000a"),
  BigInt("0x000000008000808b"), BigInt("0x800000000000008b"), BigInt("0x8000000000008089"), BigInt("0x8000000000008003"),
  BigInt("0x8000000000008002"), BigInt("0x8000000000000080"), BigInt("0x000000000000800a"), BigInt("0x800000008000000a"),
  BigInt("0x8000000080008081"), BigInt("0x8000000000008080"), BigInt("0x0000000080000001"), BigInt("0x8000000080008008"),
];

const ROTATION_OFFSETS = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

const MASK_64 = BigInt("0xffffffffffffffff");
const ZERO = BigInt(0);
const SIXTY_FOUR = BigInt(64);
const EIGHT = BigInt(8);
const FF = BigInt(0xff);

function rotl64(n: bigint, shift: number): bigint {
  const s = BigInt(shift % 64);
  return ((n << s) | (n >> (SIXTY_FOUR - s))) & MASK_64;
}

export function keccak256(input: Uint8Array | string): Uint8Array {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = input;
  }

  // Rate = 1088 bits = 136 bytes for Keccak-256 (Capacity = 512 bits)
  const rate = 136;
  const paddingLength = rate - (bytes.length % rate);
  const padded = new Uint8Array(bytes.length + paddingLength);
  padded.set(bytes);

  // Keccak padding: 0x01 ... 0x80 (Ethereum standard Keccak-256 uses 0x01)
  if (paddingLength === 1) {
    padded[bytes.length] = 0x81;
  } else {
    padded[bytes.length] = 0x01;
    padded[padded.length - 1] = 0x80;
  }

  // State: 5x5 matrix of 64-bit BigInt
  const state: bigint[][] = Array.from({ length: 5 }, () => Array(5).fill(ZERO));

  for (let blockStart = 0; blockStart < padded.length; blockStart += rate) {
    // XOR block into state (little endian 64-bit words)
    for (let i = 0; i < rate / 8; i++) {
      const x = i % 5;
      const y = Math.floor(i / 5);
      let word = ZERO;
      for (let b = 0; b < 8; b++) {
        word |= BigInt(padded[blockStart + i * 8 + b]) << BigInt(b * 8);
      }
      state[x][y] ^= word;
    }

    // 24 Rounds of Keccak-f[1600]
    for (let round = 0; round < 24; round++) {
      // Theta step
      const C: bigint[] = Array(5).fill(ZERO);
      for (let x = 0; x < 5; x++) {
        C[x] = state[x][0] ^ state[x][1] ^ state[x][2] ^ state[x][3] ^ state[x][4];
      }
      const D: bigint[] = Array(5).fill(ZERO);
      for (let x = 0; x < 5; x++) {
        D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
      }
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          state[x][y] ^= D[x];
        }
      }

      // Rho and Pi steps
      const B: bigint[][] = Array.from({ length: 5 }, () => Array(5).fill(ZERO));
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          B[y][(2 * x + 3 * y) % 5] = rotl64(state[x][y], ROTATION_OFFSETS[x][y]);
        }
      }

      // Chi step
      for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
          state[x][y] = (B[x][y] ^ ((~B[(x + 1) % 5][y]) & B[(x + 2) % 5][y])) & MASK_64;
        }
      }

      // Iota step
      state[0][0] ^= ROUND_CONSTANTS[round];
    }
  }

  // Squeeze output: 32 bytes (256 bits)
  const output = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    const x = i % 5;
    const y = Math.floor(i / 5);
    const word = state[x][y];
    for (let b = 0; b < 8; b++) {
      output[i * 8 + b] = Number((word >> BigInt(b * 8)) & FF);
    }
  }

  return output;
}

export function keccak256Hex(input: Uint8Array | string): string {
  const hash = keccak256(input);
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function toChecksumAddress(address: string): string {
  const addr = address.toLowerCase().replace(/^0x/, "");
  if (addr.length !== 40 || !/^[0-9a-f]{40}$/.test(addr)) {
    throw new Error("Invalid Ethereum address length or characters");
  }

  const hash = keccak256Hex(addr);
  let checksum = "0x";
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      checksum += addr[i].toUpperCase();
    } else {
      checksum += addr[i].toLowerCase();
    }
  }
  return checksum;
}
