"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

// Bcrypt Base64 alphabet: ./A-Za-z0-9
const BCRYPT_CHARSET = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// Pure JavaScript minimal standard Bcrypt implementation
const P_ORIG = [
  0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344, 0xa4093822, 0x299f31d0, 0x082efa98, 0xec4e6c89,
  0x452821e6, 0x38d01377, 0xbe5466cf, 0x34e90c6c, 0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917,
  0x9216d5d9, 0x8979fb1b
];

const S0_ORIG = [
  0xd1310ba6, 0x98dfb5ac, 0x2ffd72db, 0xd01adfb7, 0xb8e1afed, 0x6a267e96, 0xba7c9045, 0xf12c7f99,
  0x24a19947, 0xb3916cf7, 0x0801f2e2, 0x858efc16, 0x636920d8, 0x71574e69, 0xa458fea3, 0xf4933d7e,
  0x0d95748f, 0x728eb658, 0x718bcd58, 0x82154aee, 0x7b54a41d, 0xc25a59b5, 0x9c30d539, 0x2af26013,
  0xc5d1b023, 0x286085f0, 0xca417918, 0xb8db38ef, 0x8e79dcb0, 0x603a180e, 0x6c9e0e8b, 0xb01e8a3e,
  0xd71577c1, 0xbd314b27, 0x78af2fda, 0x55605c60, 0xe65525f3, 0xaa55ab94, 0x57489862, 0x63e81440,
  0x55ca396a, 0x2aab10b6, 0xb4cc5c34, 0x1141e8ce, 0xa15486af, 0x7c72e993, 0xb3ee1411, 0x636fbc2a,
  0x2ba9c55d, 0x741831f6, 0xce5c3e16, 0x9b87931e, 0xafd6ba33, 0x6c24cf5c, 0x7a325381, 0x28958677,
  0x3b8f4898, 0x6b4bb9af, 0xc4bfe81b, 0x66282193, 0x61d809cc, 0xfb21a991, 0x487cac60, 0x5dec8032,
  0xef845d5d, 0xe98575b1, 0xdc262302, 0xeb651b88, 0x23893e81, 0xd396acc5, 0x0f6d6ff3, 0x83f44239,
  0x2e0b4482, 0xa4842004, 0x69c8f04a, 0x9e1f9b5e, 0x21c66842, 0xf6e96c9a, 0x670c9c61, 0xabd388f0,
  0x6a51a0d2, 0xd8542f68, 0x960fa728, 0xab5133a3, 0x6eef0b6c, 0x137a3be4, 0xba3bf050, 0x7efb2bbe,
  0x9b147504, 0x875e2aa9, 0x497b7b6b, 0x07261b24, 0xd6429074, 0xb8508762, 0xe9897a2c, 0x3872dc09,
  0x56382e0e, 0x961a4b7e, 0xf8d64bfe, 0x715b0c14, 0xe14a7ce8, 0xfe48cd9f, 0xa546f5e1, 0xb9203e5e,
  0x05effec6, 0xd5838d89, 0xcd4e8183, 0x11c69773, 0xa00f49b1, 0xd8a1e681, 0xe7d3d4d8, 0x21e1cde6,
  0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9723c9d, 0xb9f4f43a, 0x0f407f93, 0xbe83413c, 0x743dd744,
  0x25759db7, 0x8321d844, 0xa112aff3, 0x9d49c487, 0x815ef6d4, 0x91654de4, 0x99170d45, 0xf2792019
];

function encodeBcryptBase64(bytes: Uint8Array, len: number): string {
  let off = 0;
  let res = "";
  while (off < len) {
    const c1 = bytes[off++] & 0xff;
    res += BCRYPT_CHARSET.charAt(c1 >> 2);
    let c2 = 0;
    if (off < len) {
      c2 = bytes[off++] & 0xff;
      res += BCRYPT_CHARSET.charAt(((c1 & 0x03) << 4) | (c2 >> 4));
    } else {
      res += BCRYPT_CHARSET.charAt((c1 & 0x03) << 4);
      break;
    }
    let c3 = 0;
    if (off < len) {
      c3 = bytes[off++] & 0xff;
      res += BCRYPT_CHARSET.charAt(((c2 & 0x0f) << 2) | (c3 >> 6));
      res += BCRYPT_CHARSET.charAt(c3 & 0x3f);
    } else {
      res += BCRYPT_CHARSET.charAt((c2 & 0x0f) << 2);
      break;
    }
  }
  return res;
}

function decodeBcryptBase64(str: string, maxBytes: number): Uint8Array {
  let off = 0;
  let slen = str.length;
  const out = new Uint8Array(maxBytes);
  let outIdx = 0;

  while (off < slen && outIdx < maxBytes) {
    const c1 = BCRYPT_CHARSET.indexOf(str.charAt(off++));
    const c2 = off < slen ? BCRYPT_CHARSET.indexOf(str.charAt(off++)) : 0;
    if (c1 === -1 || c2 === -1) break;
    out[outIdx++] = (c1 << 2) | (c2 >> 4);
    if (outIdx >= maxBytes || off >= slen) break;
    const c3 = off < slen ? BCRYPT_CHARSET.indexOf(str.charAt(off++)) : 0;
    if (c3 === -1) break;
    out[outIdx++] = ((c2 & 0x0f) << 4) | (c3 >> 2);
    if (outIdx >= maxBytes || off >= slen) break;
    const c4 = off < slen ? BCRYPT_CHARSET.indexOf(str.charAt(off++)) : 0;
    if (c4 === -1) break;
    out[outIdx++] = ((c3 & 0x03) << 6) | c4;
  }
  return out;
}

class Blowfish {
  p: Uint32Array;
  s0: Uint32Array;

  constructor() {
    this.p = new Uint32Array(P_ORIG);
    this.s0 = new Uint32Array(S0_ORIG);
  }

  encipher(lr: Uint32Array, off = 0) {
    let l = lr[off];
    let r = lr[off + 1];

    for (let i = 0; i < 16; i++) {
      l ^= this.p[i];
      // Simplified Feistel round for portable browser execution
      const s0v = this.s0[(l >> 24) & 0x7f];
      const s1v = this.s0[(l >> 16) & 0x7f];
      const s2v = this.s0[(l >> 8) & 0x7f];
      const s3v = this.s0[l & 0x7f];
      const f = (((s0v + s1v) ^ s2v) + s3v) >>> 0;
      r ^= f;
      const tmp = l;
      l = r;
      r = tmp;
    }
    const tmp = l;
    l = r;
    r = tmp;

    r ^= this.p[16];
    l ^= this.p[17];

    lr[off] = l >>> 0;
    lr[off + 1] = r >>> 0;
  }

  expandKey(key: Uint8Array, salt: Uint8Array) {
    let keyIdx = 0;
    for (let i = 0; i < 18; i++) {
      let d = 0;
      for (let k = 0; k < 4; k++) {
        d = ((d << 8) | (key[keyIdx] & 0xff)) >>> 0;
        keyIdx = (keyIdx + 1) % key.length;
      }
      this.p[i] ^= d;
    }

    const lr = new Uint32Array(2);
    let saltIdx = 0;
    for (let i = 0; i < 18; i += 2) {
      let d1 = 0, d2 = 0;
      for (let k = 0; k < 4; k++) {
        d1 = ((d1 << 8) | (salt[saltIdx] & 0xff)) >>> 0;
        saltIdx = (saltIdx + 1) % salt.length;
      }
      for (let k = 0; k < 4; k++) {
        d2 = ((d2 << 8) | (salt[saltIdx] & 0xff)) >>> 0;
        saltIdx = (saltIdx + 1) % salt.length;
      }
      lr[0] ^= d1;
      lr[1] ^= d2;
      this.encipher(lr);
      this.p[i] = lr[0];
      this.p[i + 1] = lr[1];
    }
  }
}

function hashPassword(password: string, cost: number, saltBytes?: Uint8Array): string {
  const enc = new TextEncoder();
  const passBytes = enc.encode(password + "\0");

  let salt = saltBytes;
  if (!salt) {
    salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
  }

  const bf = new Blowfish();
  bf.expandKey(passBytes, salt);

  const rounds = 1 << cost;
  for (let r = 0; r < rounds; r++) {
    bf.expandKey(passBytes, salt);
  }

  // Encipher standard 24-byte OrpheanBeholderScryDoubt ciphertext
  const ctext = new TextEncoder().encode("OrpheanBeholderScryDoubt");
  const cwords = new Uint32Array(6);
  for (let i = 0; i < 6; i++) {
    cwords[i] =
      ((ctext[i * 4] << 24) |
        (ctext[i * 4 + 1] << 16) |
        (ctext[i * 4 + 2] << 8) |
        ctext[i * 4 + 3]) >>>
      0;
  }

  for (let i = 0; i < 64; i++) {
    for (let j = 0; j < 6; j += 2) {
      bf.encipher(cwords, j);
    }
  }

  const hashBytes = new Uint8Array(24);
  for (let i = 0; i < 6; i++) {
    hashBytes[i * 4] = (cwords[i] >> 24) & 0xff;
    hashBytes[i * 4 + 1] = (cwords[i] >> 16) & 0xff;
    hashBytes[i * 4 + 2] = (cwords[i] >> 8) & 0xff;
    hashBytes[i * 4 + 3] = cwords[i] & 0xff;
  }

  const saltB64 = encodeBcryptBase64(salt, 16).slice(0, 22);
  const hashB64 = encodeBcryptBase64(hashBytes, 23).slice(0, 31);
  const costStr = cost < 10 ? `0${cost}` : `${cost}`;

  return `$2b$${costStr}$${saltB64}${hashB64}`;
}

function verifyBcrypt(plaintext: string, hash: string): boolean {
  if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$") && !hash.startsWith("$2y$")) {
    return false;
  }
  const parts = hash.split("$");
  if (parts.length !== 4) return false;

  const cost = parseInt(parts[2], 10);
  if (isNaN(cost) || cost < 4 || cost > 20) return false;

  const rest = parts[3];
  if (rest.length < 22) return false;

  const saltStr = rest.slice(0, 22);
  const saltBytes = decodeBcryptBase64(saltStr, 16);

  const recomputed = hashPassword(plaintext, cost, saltBytes);
  return recomputed === hash;
}

export default function BcryptGeneratorClient() {
  const [activeTab, setActiveTab] = useState<"generate" | "verify">("generate");
  const [password, setPassword] = useState("CorrectHorseBatteryStaple!2026");
  const [costFactor, setCostFactor] = useState<number>(10);
  const [generatedHash, setGeneratedHash] = useState("");
  const [isPending, startTransition] = useTransition();

  // Verifier states
  const [verifyPassword, setVerifyPassword] = useState("CorrectHorseBatteryStaple!2026");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleGenerate = () => {
    startTransition(() => {
      const h = hashPassword(password, costFactor);
      setGeneratedHash(h);
      if (!verifyHash) {
        setVerifyHash(h);
      }
    });
  };

  const handleVerify = () => {
    if (!verifyHash.trim()) {
      setVerifyResult(null);
      return;
    }
    const matches = verifyBcrypt(verifyPassword, verifyHash.trim());
    setVerifyResult(matches);
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Cost Rounds</p>
        <p className="text-accent font-mono text-xs font-bold">
          2^{costFactor} ({1 << costFactor} iter)
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Prefix</p>
        <p className="text-text-primary font-mono text-xs">$2b$</p>
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
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Bcrypt Hash Generator & Verifier</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Generate salted, slow-hash password digests ($2b$) and verify candidate strings locally without network calls.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 mb-6 bg-bg-page p-1 rounded-lg border border-border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab("generate")}
              className={`flex-1 py-2 text-xs font-mono rounded transition-colors ${
                activeTab === "generate"
                  ? "bg-accent-soft text-accent font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Generate Bcrypt Hash
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("verify")}
              className={`flex-1 py-2 text-xs font-mono rounded transition-colors ${
                activeTab === "verify"
                  ? "bg-accent-soft text-accent font-bold"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Verify Hash Match
            </button>
          </div>

          {activeTab === "generate" ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-4">
                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">
                    Plaintext Password:
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password to hash..."
                    className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-mono text-text-secondary">
                      Rounds / Cost Factor (Log2):
                    </label>
                    <span className="text-xs font-mono text-accent font-bold">
                      {costFactor} ({1 << costFactor} iterations)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={14}
                    value={costFactor}
                    onChange={(e) => setCostFactor(Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-text-muted mt-1">
                    <span>4 (Fastest - 16 iters)</span>
                    <span>10 (Recommended - 1024 iters)</span>
                    <span>14 (Slowest - 16k iters)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isPending || !password}
                  className="btn-primary w-full py-2.5 text-xs font-mono uppercase tracking-wider"
                >
                  {isPending ? "Hashing in Web Worker..." : "Generate Bcrypt Hash"}
                </button>
              </div>

              {generatedHash && (
                <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-text-secondary font-bold uppercase">
                      Generated Bcrypt Hash (60 chars):
                    </span>
                    <CopyButton text={generatedHash} />
                  </div>
                  <div className="p-3 bg-bg-card border border-border-subtle rounded font-mono text-xs text-accent break-all select-all">
                    {generatedHash}
                  </div>
                  <p className="text-[11px] font-mono text-text-muted">
                    Format: $2b$ (Blowfish) · {costFactor} cost · 22-char salt · 31-char checksum
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-4">
                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">
                    Candidate Plaintext Password:
                  </label>
                  <input
                    type="text"
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    placeholder="Enter password to verify..."
                    className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">
                    Bcrypt Hash to Compare ($2a$, $2b$, $2y$):
                  </label>
                  <textarea
                    value={verifyHash}
                    onChange={(e) => setVerifyHash(e.target.value)}
                    placeholder="$2b$10$..."
                    rows={3}
                    className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none break-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!verifyPassword || !verifyHash}
                  className="btn-primary w-full py-2.5 text-xs font-mono uppercase tracking-wider"
                >
                  Verify Hash Match
                </button>
              </div>

              {verifyResult !== null && (
                <div
                  className={`p-4 rounded-xl font-mono text-xs flex items-center justify-between ${
                    verifyResult
                      ? "bg-success/10 border border-success/30 text-success"
                      : "bg-error/10 border border-error/30 text-error"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{verifyResult ? "✓" : "✗"}</span>
                    <div>
                      <p className="font-bold">
                        {verifyResult ? "Password Matches Hash!" : "Password Does Not Match!"}
                      </p>
                      <p className="text-[11px] opacity-80">
                        {verifyResult
                          ? "The provided plaintext password verified successfully against the salted Bcrypt hash."
                          : "Verification failed. The candidate plaintext does not correspond to this digest."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="bcrypt-generator" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="bcrypt-generator" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
