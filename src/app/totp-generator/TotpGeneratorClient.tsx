"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useEffect, useCallback, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, "").replace(/[\s-]/g, "");
  const length = clean.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(((length * 5) / 8) | 0);

  for (let i = 0; i < length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return output;
}

function generateRandomSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let res = "";
  let value = 0;
  let bits = 0;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      res += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    res += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return res;
}

async function generateTotpToken(
  secretBase32: string,
  algorithm: "SHA-1" | "SHA-256" | "SHA-512" = "SHA-1",
  digits = 6,
  period = 30
): Promise<{ token: string; remainingSeconds: number; error: string | null }> {
  try {
    const keyBytes = base32Decode(secretBase32);
    if (keyBytes.length === 0) {
      return { token: "------", remainingSeconds: 0, error: "Invalid Base32 secret key" };
    }

    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / period);
    const remainingSeconds = period - (epoch % period);

    const counterBuffer = new ArrayBuffer(8);
    const counterView = new DataView(counterBuffer);
    counterView.setUint32(4, counter, false);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as unknown as ArrayBuffer,
      { name: "HMAC", hash: { name: algorithm } },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, counterBuffer);
    const hash = new Uint8Array(signature);

    const offset = hash[hash.length - 1] & 0xf;
    const binary =
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    const token = otp.toString().padStart(digits, "0");

    return { token, remainingSeconds, error: null };
  } catch (err) {
    return { token: "------", remainingSeconds: 0, error: (err as Error).message };
  }
}

export default function TotpGeneratorClient() {
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [issuer, setIssuer] = useState("MegaTools");
  const [account, setAccount] = useState("user@example.com");
  const [algorithm, setAlgorithm] = useState<"SHA-1" | "SHA-256" | "SHA-512">("SHA-1");
  const [digits, setDigits] = useState<number>(6);
  const [period, setPeriod] = useState<number>(30);

  const [token, setToken] = useState("------");
  const [remaining, setRemaining] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const updateOtp = useCallback(() => {
    generateTotpToken(secret, algorithm, digits, period).then((res) => {
      setToken(res.token);
      setRemaining(res.remainingSeconds);
      setError(res.error);
    });
  }, [secret, algorithm, digits, period]);

  useEffect(() => {
    updateOtp();
    const interval = setInterval(updateOtp, 1000);
    return () => clearInterval(interval);
  }, [updateOtp]);

  const handleUriInput = (val: string) => {
    if (val.startsWith("otpauth://")) {
      try {
        const url = new URL(val);
        const sec = url.searchParams.get("secret");
        if (sec) setSecret(sec);
        const iss = url.searchParams.get("issuer");
        if (iss) setIssuer(iss);
        const dig = url.searchParams.get("digits");
        if (dig) setDigits(Number(dig));
        const per = url.searchParams.get("period");
        if (per) setPeriod(Number(per));
        const algo = url.searchParams.get("algorithm");
        if (algo === "SHA256") setAlgorithm("SHA-256");
        if (algo === "SHA512") setAlgorithm("SHA-512");
        if (algo === "SHA1") setAlgorithm("SHA-1");
      } catch {
        // invalid URL
      }
    } else {
      setSecret(val);
    }
  };

  const otpauthUri = useMemo(() => {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=${algorithm.replace("-", "")}&digits=${digits}&period=${period}`;
  }, [issuer, account, secret, algorithm, digits, period]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Refresh Cycle</p>
        <p className="text-accent font-mono text-xs font-bold">{remaining}s remaining</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Algorithm</p>
        <p className="text-text-primary font-mono text-xs">{algorithm}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="totp-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Token Display Box */}
            <div className="flex flex-col space-y-4">
              <div className="p-6 rounded-xl bg-bg-page border border-border-subtle flex flex-col items-center justify-center space-y-4 min-h-[280px]">
                <div className="text-center">
                  <span className="text-xs font-mono text-text-muted uppercase tracking-wider block mb-1">
                    {issuer} · {account}
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono text-4xl sm:text-5xl font-extrabold tracking-widest text-accent">
                      {token.length === 6 ? `${token.slice(0, 3)} ${token.slice(3)}` : token}
                    </span>
                  </div>
                </div>

                {/* Countdown Progress Bar */}
                <div className="w-full max-w-xs space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono text-text-secondary">
                    <span>Next Token in:</span>
                    <span className={`font-bold ${remaining <= 5 ? "text-error" : "text-accent"}`}>{remaining}s</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-bg-card border border-border-subtle overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        remaining <= 5 ? "bg-error" : "bg-accent"
                      }`}
                      style={{ width: `${(remaining / period) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <CopyButton text={token} />
                  <button
                    type="button"
                    onClick={() => setSecret(generateRandomSecret())}
                    className="px-3 py-1.5 text-xs font-mono rounded bg-bg-card border border-border-subtle hover:border-accent text-text-secondary hover:text-text-primary transition-colors"
                  >
                    🎲 New Random Key
                  </button>
                </div>

                {error && <p className="text-xs font-mono text-error">⚠ {error}</p>}
              </div>

              {/* otpauth URI snippet */}
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                    otpauth:// URI:
                  </span>
                  <CopyButton text={otpauthUri} />
                </div>
                <p className="p-2.5 bg-bg-card border border-border-subtle rounded font-mono text-[11px] text-text-secondary break-all select-all">
                  {otpauthUri}
                </p>
              </div>
            </div>

            {/* Right: Secret & Parameters */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-3">
                <span className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider block">
                  Authenticator Parameters
                </span>

                <div>
                  <label className="text-xs font-mono text-text-secondary block mb-1">
                    Secret Key (Base32) or otpauth:// URI:
                  </label>
                  <input
                    type="text"
                    value={secret}
                    onChange={(e) => handleUriInput(e.target.value)}
                    placeholder="e.g. JBSWY3DPEHPK3PXP"
                    className="w-full p-2.5 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Issuer Name:</label>
                    <input
                      type="text"
                      value={issuer}
                      onChange={(e) => setIssuer(e.target.value)}
                      placeholder="Service / App Name"
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Account Label:</label>
                    <input
                      type="text"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Algorithm:</label>
                    <select
                      value={algorithm}
                      onChange={(e) => setAlgorithm(e.target.value as "SHA-1" | "SHA-256" | "SHA-512")}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value="SHA-1">SHA-1</option>
                      <option value="SHA-256">SHA-256</option>
                      <option value="SHA-512">SHA-512</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Digits:</label>
                    <select
                      value={digits}
                      onChange={(e) => setDigits(Number(e.target.value))}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value={6}>6 Digits</option>
                      <option value={8}>8 Digits</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-text-secondary block mb-1">Period (s):</label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(Number(e.target.value))}
                      className="w-full p-2 rounded bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                    >
                      <option value={30}>30s</option>
                      <option value={60}>60s</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}