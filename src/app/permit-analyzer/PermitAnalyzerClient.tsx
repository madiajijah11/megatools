"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import {
  analyzeEIP712Payload,
  EIP712AnalysisResult,
  signDigest,
  deriveAddressFromPrivateKey,
  DEFAULT_TEST_PRIVATE_KEY,
  PRESET_ERC2612_DRAINER_SCAM,
  PRESET_ERC2612_SAMPLE_SIG,
  PRESET_UNISWAP_PERMIT2,
  PRESET_UNISWAP_SAMPLE_SIG,
  PRESET_SEAPORT_DRAINER,
  PRESET_SEAPORT_SAMPLE_SIG,
  PRESET_SAFE_MULTISIG,
  PRESET_SAFE_SAMPLE_SIG,
} from "@/lib/permit-analyzer";

// Secondary test key (Hardhat / Foundry Account #1) for simulating mismatch/attackers
const ATTACKER_TEST_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

export default function PermitAnalyzerClient() {
  const [jsonInput, setJsonInput] = useState<string>(PRESET_ERC2612_DRAINER_SCAM);
  const [signatureInput, setSignatureInput] = useState<string>(PRESET_ERC2612_SAMPLE_SIG);
  const [activeTab, setActiveTab] = useState<"security" | "summary" | "signature" | "hashes">("security");
  const [simPrivateKey, setSimPrivateKey] = useState<string>(DEFAULT_TEST_PRIVATE_KEY);

  // Analysis result
  const analysis: EIP712AnalysisResult = useMemo(() => {
    return analyzeEIP712Payload(jsonInput, signatureInput);
  }, [jsonInput, signatureInput]);

  const loadPreset = (preset: string, sampleSig?: string) => {
    setJsonInput(preset);
    if (sampleSig) {
      setSignatureInput(sampleSig);
    }
  };

  // 1-Click Signing Helpers
  const handleAutoSign = (privKey: string) => {
    if (!analysis.isValid || !analysis.eip712Digest) return;
    try {
      const cleanKey = privKey.trim();
      const sig = signDigest(analysis.eip712Digest, cleanKey);
      setSignatureInput(sig);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Signing failed");
    }
  };

  // Badge styles based on risk level
  const getRiskBadge = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "low":
      case "safe":
      default:
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    }
  };

  // Stats sidebar node
  const stats = (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Primary Type:</span>
        <span className="font-bold text-accent">{analysis.primaryType || "Unknown"}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Security Risk:</span>
        <span
          className={`font-bold uppercase ${
            analysis.overallRisk === "critical"
              ? "text-rose-400"
              : analysis.overallRisk === "high"
              ? "text-orange-400"
              : analysis.overallRisk === "medium"
              ? "text-amber-400"
              : "text-emerald-400"
          }`}
        >
          {analysis.overallRisk} ({analysis.riskScore}/100)
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Signer Status:</span>
        <span
          className={`font-bold ${
            analysis.recoveredSigner
              ? analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
                ? "text-emerald-400"
                : "text-rose-400"
              : "text-text-muted"
          }`}
        >
          {analysis.recoveredSigner
            ? analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
              ? "Owner Match"
              : "Signer Mismatch"
            : "No Signature"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Network:</span>
        <span className="font-bold text-text-primary truncate max-w-[120px]">
          {analysis.summary.networkName}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="permit-analyzer" stats={stats}>
      <div className="space-y-6">
        {/* Presets Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-bg-card border border-border-subtle">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mr-1">
              ⚡ Load Preset:
            </span>
            <button
              onClick={() => loadPreset(PRESET_ERC2612_DRAINER_SCAM, PRESET_ERC2612_SAMPLE_SIG)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-rose-400 hover:text-rose-300 transition-colors font-medium"
            >
              🚨 ERC-2612 Drainer Scam
            </button>
            <button
              onClick={() => loadPreset(PRESET_SEAPORT_DRAINER, PRESET_SEAPORT_SAMPLE_SIG)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              💀 Seaport 0-ETH NFT Drainer
            </button>
            <button
              onClick={() => loadPreset(PRESET_UNISWAP_PERMIT2, PRESET_UNISWAP_SAMPLE_SIG)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              🦄 Uniswap Permit2
            </button>
            <button
              onClick={() => loadPreset(PRESET_SAFE_MULTISIG, PRESET_SAFE_SAMPLE_SIG)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              🛡️ Safe Multi-Sig Tx
            </button>
          </div>

          <button
            onClick={() => {
              setJsonInput("");
              setSignatureInput("");
            }}
            className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-muted hover:text-text-primary transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Top Input Area (JSON & Signature) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-text-secondary flex items-center gap-1.5">
                <span>📝</span> EIP-712 Typed Data JSON (Domain + Message + Types)
              </label>
              <CopyButton text={jsonInput} label="Copy JSON" />
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste EIP-712 JSON or eth_signTypedData_v4 payload..."
              rows={11}
              className="w-full p-3 rounded-xl bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:outline-none focus:border-accent leading-relaxed resize-y"
            />
          </div>

          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-text-secondary flex items-center gap-1">
                  <span>🔏</span> 65-Byte Signature (r,s,v)
                </label>
                {signatureInput && (
                  <button
                    onClick={() => setSignatureInput("")}
                    className="text-[11px] text-text-muted hover:text-rose-400"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                value={signatureInput}
                onChange={(e) => setSignatureInput(e.target.value)}
                placeholder="0x... (65-byte raw signature r,s,v to recover and verify signer)"
                rows={4}
                className="w-full p-2.5 rounded-xl bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span>
                  {signatureInput.trim() ? (
                    <span className="text-emerald-400 font-mono">
                      ✓ Length: {Math.floor(signatureInput.trim().replace(/^0x/, "").length / 2)} bytes
                    </span>
                  ) : (
                    "Leave empty or load preset"
                  )}
                </span>
                {analysis.recoveredSigner && (
                  <span className="font-mono text-accent truncate max-w-[140px]">
                    {analysis.recoveredSigner.slice(0, 6)}...{analysis.recoveredSigner.slice(-4)}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Risk Alert Banner */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                analysis.overallRisk === "critical"
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : analysis.overallRisk === "high"
                  ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                  : analysis.overallRisk === "medium"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider">Security Verdict</span>
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-black/20">
                  Risk Score: {analysis.riskScore}/100
                </span>
              </div>
              <p className="text-sm font-black mt-2">
                {analysis.overallRisk === "critical" && "🚨 HIGH-RISK DRAINER PATTERN DETECTED"}
                {analysis.overallRisk === "high" && "⚠️ DANGEROUS PERMISSION REQUEST"}
                {analysis.overallRisk === "medium" && "⚡ MODERATE CAUTION ADVISED"}
                {analysis.overallRisk === "safe" && "🛡️ LOW RISK PROTOCOL SIGNATURE"}
              </p>
              <span className="text-[11px] opacity-90 mt-1 block">
                {analysis.riskFlags.length > 0
                  ? `${analysis.riskFlags.length} security alert(s) requiring attention.`
                  : "No malicious drainer patterns identified."}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border-subtle">
          <div className="flex items-center gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab("security")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "security"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>🛡️</span> Security & Drainer Audit
              {analysis.riskFlags.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                  {analysis.riskFlags.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "summary"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>📋</span> Human-Readable Intent Card
            </button>
            <button
              onClick={() => setActiveTab("signature")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "signature"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>🔏</span> Signer & Recovery Inspector
              {analysis.recoveredSigner && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
                    ? "✓ Verified"
                    : "Mismatch"}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("hashes")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "hashes"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>🔬</span> EIP-712 Hashes & Digests
            </button>
          </div>
        </div>

        {/* TAB 1: SECURITY & DRAINER AUDIT */}
        {activeTab === "security" && (
          <div className="space-y-4">
            {!analysis.isValid ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <strong>Payload Parsing Error:</strong> {analysis.errorMessage}
              </div>
            ) : (
              <div className="space-y-3">
                {analysis.riskFlags.map((flag) => {
                  const badgeClass = getRiskBadge(flag.level);
                  return (
                    <div
                      key={flag.id}
                      className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-2 hover:border-border transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                          {flag.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${badgeClass}`}>
                          {flag.level}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {flag.description}
                      </p>
                      <div className="pt-2 border-t border-border-subtle/50 flex items-start gap-2 text-xs text-accent">
                        <span className="font-bold">Recommendation:</span>
                        <span className="text-text-muted">{flag.recommendation}</span>
                      </div>
                    </div>
                  );
                })}

                {analysis.riskFlags.length === 0 && (
                  <div className="p-8 text-center rounded-xl bg-bg-card border border-border-subtle space-y-2">
                    <span className="text-3xl">🛡️</span>
                    <h4 className="text-sm font-bold text-text-primary">No Suspicious Patterns Detected</h4>
                    <p className="text-xs text-text-muted max-w-md mx-auto">
                      Allowance amounts and deadline timestamps appear standard. Always confirm you are interacting with the genuine website domain.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HUMAN READABLE INTENT CARD */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <div className="border-b border-border-subtle/50 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>📋</span> Plain-English Transaction Deconstruction
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    What this signature actually authorizes on your behalf
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-bg-page border border-border-subtle text-xs font-mono text-accent">
                  {analysis.summary.networkName}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="text-text-muted font-medium">Protocol / Contract Name:</span>
                  <div className="font-mono font-bold text-text-primary text-sm">
                    {analysis.summary.protocolName}
                  </div>
                  {analysis.summary.verifyingContract && (
                    <div className="font-mono text-[11px] text-text-muted break-all">
                      Contract: {analysis.summary.verifyingContract}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="text-text-muted font-medium">Operation Scope:</span>
                  <div className="font-mono font-bold text-accent uppercase text-sm">
                    {analysis.summary.actionType.replace("_", " ")}
                  </div>
                  <div className="text-[11px] text-text-muted">
                    Primary Type: <code>{analysis.primaryType}</code>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="text-text-muted font-medium">Authorizing Owner / Signer:</span>
                  <div className="font-mono font-bold text-text-primary break-all">
                    {analysis.summary.ownerOrSigner || "Not explicitly specified in message"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="text-text-muted font-medium">Authorized Spender / Recipient:</span>
                  <div className="font-mono font-bold text-text-primary break-all">
                    {analysis.summary.spenderOrRecipient || "None / Protocol Default"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="text-text-muted font-medium">Approved Amount / Allowance:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold ${
                        analysis.summary.isUnlimited ? "text-rose-400 text-sm" : "text-text-primary"
                      }`}
                    >
                      {analysis.summary.amountOrAllowance || "N/A"}
                    </span>
                    {analysis.summary.isUnlimited && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        UNLIMITED
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="text-text-muted font-medium">Deadline / Expiration:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold ${
                        analysis.summary.isExpired ? "text-rose-400" : "text-text-primary"
                      }`}
                    >
                      {analysis.summary.deadlineDisplay || "No deadline enforced"}
                    </span>
                    {analysis.summary.isExpired && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                        EXPIRED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SIGNER & RECOVERY INSPECTOR (ENHANCED) */}
        {activeTab === "signature" && (
          <div className="space-y-6">
            {/* Action Bar inside Signer Tab */}
            <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>🔏</span> Secp256k1 Elliptic Curve Signer Recovery
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Deconstructs ECDSA signature components and computes public key address from curve coordinates.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleAutoSign(DEFAULT_TEST_PRIVATE_KEY)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors font-medium flex items-center gap-1.5"
                  >
                    <span>✨</span> Auto-Sign with Owner Key (Match)
                  </button>
                  <button
                    onClick={() => handleAutoSign(ATTACKER_TEST_PRIVATE_KEY)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors font-medium flex items-center gap-1.5"
                  >
                    <span>🚨</span> Simulate Attacker Signature (Mismatch)
                  </button>
                </div>
              </div>

              {/* In-tab Signature Input */}
              <div className="space-y-1.5 pt-2 border-t border-border-subtle/50">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>Raw Signature Hex (65-byte / 130 hex characters):</span>
                  {signatureInput && <CopyButton text={signatureInput} label="Copy Signature" />}
                </div>
                <input
                  type="text"
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-2.5 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Signature Verification Verdict Card */}
            {analysis.recoveredSigner ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recovered Signer Address */}
                <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted">
                      1. Recovered Signer Address
                    </span>
                    <CopyButton text={analysis.recoveredSigner} label="Copy Address" />
                  </div>
                  <div className="font-mono text-sm font-bold text-accent break-all p-2.5 rounded-lg bg-bg-page border border-border-subtle">
                    {analysis.recoveredSigner}
                  </div>
                  <span className="text-[11px] text-text-muted block">
                    Derived from public key point Q = r^-1(sR - zG)
                  </span>
                </div>

                {/* Identity Cross-Check */}
                <div className="p-4 rounded-xl bg-bg-card border border-border-subtle space-y-2 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-muted">
                      2. Declared Owner in Message
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
                        ? "✅ MATCH CONFIRMED"
                        : "❌ MISMATCH DETECTED"}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold text-text-primary break-all p-2.5 rounded-lg bg-bg-page border border-border-subtle">
                    {analysis.summary.ownerOrSigner || "No owner specified in message"}
                  </div>
                  <span className="text-[11px] text-text-muted block">
                    {analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
                      ? "The private key that authorized this signature belongs to the declared owner."
                      : "Warning: Signer does NOT match owner! Transaction will revert on-chain."}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-bg-card border border-border-subtle space-y-2">
                <span className="text-2xl">ℹ️</span>
                <h4 className="text-sm font-bold text-text-primary">No Valid Signature Loaded</h4>
                <p className="text-xs text-text-muted max-w-md mx-auto">
                  Click <strong>&quot;Auto-Sign with Owner Key&quot;</strong> above, or paste an existing 65-byte hex signature to unpack its elliptic curve coordinates.
                </p>
                {analysis.signatureError && (
                  <p className="text-xs text-rose-400 font-mono mt-2">{analysis.signatureError}</p>
                )}
              </div>
            )}

            {/* Signature (r, s, v) Breakdown */}
            {analysis.signatureComponents && (
              <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/50 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <span>🧩</span> ECDSA Component Decomposition (r, s, v)
                    </h4>
                    <p className="text-xs text-text-muted">
                      Unpacked 65-byte signature into curve coordinate and scalar proof
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                      analysis.signatureComponents.isLowerS
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {analysis.signatureComponents.formatDescription}
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {/* Parameter r */}
                  <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                    <div className="flex items-center justify-between text-text-muted">
                      <span className="font-bold text-accent">Parameter r (32 Bytes / X-Coordinate on secp256k1):</span>
                      <CopyButton text={analysis.signatureComponents.r} label="Copy r" />
                    </div>
                    <div className="text-text-primary break-all select-all font-semibold">
                      {analysis.signatureComponents.r}
                    </div>
                  </div>

                  {/* Parameter s */}
                  <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                    <div className="flex items-center justify-between text-text-muted">
                      <span className="font-bold text-accent">Parameter s (32 Bytes / Signature Scalar Proof):</span>
                      <CopyButton text={analysis.signatureComponents.s} label="Copy s" />
                    </div>
                    <div className="text-text-primary break-all select-all font-semibold">
                      {analysis.signatureComponents.s}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-text-muted">EIP-2 Malleability Compliance:</span>
                      <span
                        className={
                          analysis.signatureComponents.isLowerS
                            ? "text-emerald-400 font-bold"
                            : "text-amber-400 font-bold"
                        }
                      >
                        {analysis.signatureComponents.isLowerS
                          ? "✓ Lower S (s ≤ secp256k1_n / 2)"
                          : "⚠️ High S (May be rejected by strict contracts)"}
                      </span>
                    </div>
                  </div>

                  {/* Parameter v */}
                  <div className="p-3 rounded-lg bg-bg-page border border-border-subtle flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-accent block">
                        Recovery Identifier v (1 Byte):
                      </span>
                      <span className="text-text-muted text-[11px]">
                        Determines which of the two possible Y curve coordinates to select
                      </span>
                    </div>
                    <div className="text-sm font-bold text-text-primary bg-bg-card px-3 py-1 rounded border border-border-subtle">
                      {analysis.signatureComponents.v} (Hex: 0x{analysis.signatureComponents.v.toString(16)})
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cryptographic Recovery Step-by-Step Flow */}
            <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-3">
              <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>🔄</span> How Secp256k1 EIP-712 Signer Recovery Works
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="font-bold text-accent block">Step 1: Compute Digest</span>
                  <p className="text-text-muted text-[11px]">
                    Hash <code>\x19\x01</code>, domain separator, and struct hash into 32-byte digest z.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="font-bold text-accent block">Step 2: Unpack Curve Point</span>
                  <p className="text-text-muted text-[11px]">
                    Calculate point R = (r, y) on curve secp256k1 using recovery byte v.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="font-bold text-accent block">Step 3: Recover Public Key</span>
                  <p className="text-text-muted text-[11px]">
                    Evaluate Q = r^-1(sR - zG) to derive uncompressed 64-byte public key (Qx, Qy).
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <span className="font-bold text-accent block">Step 4: Keccak-256 Hash</span>
                  <p className="text-text-muted text-[11px]">
                    Take the last 20 bytes of Keccak-256(Q) to produce the Ethereum address.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Local Signer Simulator Workbench */}
            <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle/50 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <span>💻</span> Local Developer Signing Sandbox (100% In-Browser)
                  </h4>
                  <p className="text-xs text-text-muted">
                    Test signing this EIP-712 payload with any test private key without sending keys over network.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimPrivateKey(DEFAULT_TEST_PRIVATE_KEY)}
                    className="px-2.5 py-1 text-[11px] rounded bg-bg-page hover:bg-bg-hover border border-border-subtle text-accent"
                  >
                    Foundry #0 Key
                  </button>
                  <button
                    onClick={() => setSimPrivateKey(ATTACKER_TEST_PRIVATE_KEY)}
                    className="px-2.5 py-1 text-[11px] rounded bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-muted hover:text-text-primary"
                  >
                    Foundry #1 Key
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>Test Private Key (Hex):</span>
                    {simPrivateKey && (
                      <span className="font-mono text-emerald-400 text-[11px]">
                        Address: {deriveAddressFromPrivateKey(simPrivateKey)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={simPrivateKey}
                    onChange={(e) => setSimPrivateKey(e.target.value)}
                    placeholder="0x... 32-byte private key"
                    className="w-full p-2 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAutoSign(simPrivateKey)}
                    className="px-4 py-2 rounded-lg bg-accent text-white font-semibold text-xs hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <span>✍️</span> Sign EIP-712 Digest Now
                  </button>
                  <span className="text-xs text-text-muted">
                    Generates valid signature (r, s, v) and immediately tests recovery.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EIP-712 HASHES & DEVELOPER INSPECTOR */}
        {activeTab === "hashes" && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>🔬</span> Cryptographic Hashing Intermediate Values
              </h3>
              <p className="text-xs text-text-muted">
                Intermediate hashes computed according to the canonical EIP-712 specification.
              </p>

              <div className="space-y-3 font-mono text-xs">
                {/* Final EIP-712 Digest */}
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="font-bold text-accent">
                      EIP-712 Final Digest (hashTypedDataV4):
                    </span>
                    <CopyButton text={analysis.eip712Digest} label="Copy Digest" />
                  </div>
                  <div className="font-bold text-text-primary break-all select-all text-sm">
                    {analysis.eip712Digest}
                  </div>
                </div>

                {/* Domain Separator */}
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <div className="flex items-center justify-between text-text-muted">
                    <span>domainSeparatorHash:</span>
                    <CopyButton text={analysis.domainSeparatorHash} label="Copy" />
                  </div>
                  <div className="text-text-secondary break-all select-all">
                    {analysis.domainSeparatorHash}
                  </div>
                </div>

                {/* Struct Hash */}
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <div className="flex items-center justify-between text-text-muted">
                    <span>hashStruct(message):</span>
                    <CopyButton text={analysis.messageHash} label="Copy" />
                  </div>
                  <div className="text-text-secondary break-all select-all">
                    {analysis.messageHash}
                  </div>
                </div>

                {/* Type Hash */}
                <div className="p-3 rounded-lg bg-bg-page border border-border-subtle space-y-1">
                  <div className="flex items-center justify-between text-text-muted">
                    <span>typeHash (encodeType):</span>
                    <CopyButton text={analysis.typeHash} label="Copy" />
                  </div>
                  <div className="text-text-secondary break-all select-all">
                    {analysis.typeHash}
                  </div>
                  <div className="text-[11px] text-text-muted truncate pt-1">
                    Canonical Type String: <code>{analysis.encodedTypeString}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
