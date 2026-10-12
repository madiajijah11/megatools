"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import {
  analyzeEIP712Payload,
  EIP712AnalysisResult,
  PRESET_ERC2612_DRAINER_SCAM,
  PRESET_UNISWAP_PERMIT2,
  PRESET_SEAPORT_DRAINER,
  PRESET_SAFE_MULTISIG,
} from "@/lib/permit-analyzer";

export default function PermitAnalyzerClient() {
  const [jsonInput, setJsonInput] = useState<string>(PRESET_ERC2612_DRAINER_SCAM);
  const [signatureInput, setSignatureInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"security" | "summary" | "signature" | "hashes">("security");

  // Analysis result
  const analysis: EIP712AnalysisResult = useMemo(() => {
    return analyzeEIP712Payload(jsonInput, signatureInput);
  }, [jsonInput, signatureInput]);

  const loadPreset = (preset: string) => {
    setJsonInput(preset);
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
        <span className="text-text-muted">Risk Flags:</span>
        <span className={`font-bold ${analysis.riskFlags.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
          {analysis.riskFlags.length} detected
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
              onClick={() => loadPreset(PRESET_ERC2612_DRAINER_SCAM)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-rose-400 hover:text-rose-300 transition-colors font-medium"
            >
              🚨 ERC-2612 Drainer Scam
            </button>
            <button
              onClick={() => loadPreset(PRESET_SEAPORT_DRAINER)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-orange-400 hover:text-orange-300 transition-colors font-medium"
            >
              💀 Seaport 0-ETH NFT Drainer
            </button>
            <button
              onClick={() => loadPreset(PRESET_UNISWAP_PERMIT2)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              🦄 Uniswap Permit2
            </button>
            <button
              onClick={() => loadPreset(PRESET_SAFE_MULTISIG)}
              className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              🛡️ Safe Multi-Sig Tx
            </button>
          </div>

          <button
            onClick={() => setJsonInput("")}
            className="px-2.5 py-1 text-xs rounded-lg bg-bg-page hover:bg-bg-hover border border-border-subtle text-text-muted hover:text-text-primary transition-colors"
          >
            Clear Input
          </button>
        </div>

        {/* Input Area (JSON & Signature) */}
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
              <label className="block text-xs font-semibold text-text-secondary">
                <span>🔏</span> Optional Secp256k1 Signature Hex
              </label>
              <textarea
                value={signatureInput}
                onChange={(e) => setSignatureInput(e.target.value)}
                placeholder="0x... (65-byte raw signature r,s,v to recover and verify signer)"
                rows={4}
                className="w-full p-2.5 rounded-xl bg-bg-card border border-border-subtle font-mono text-xs text-text-primary focus:outline-none focus:border-accent resize-none"
              />
              <span className="text-[11px] text-text-muted block">
                Leave empty for pure signature deconstruction & risk analysis.
              </span>
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("security")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
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
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "summary"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>👤</span> Human-Readable Intent Card
            </button>
            <button
              onClick={() => setActiveTab("signature")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "signature"
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-primary"
              }`}
            >
              <span>🔏</span> Signer & Recovery
            </button>
            <button
              onClick={() => setActiveTab("hashes")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
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

        {/* TAB 3: SIGNER & RECOVERY */}
        {activeTab === "signature" && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-bg-card border border-border-subtle space-y-4">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>🔏</span> Secp256k1 Elliptic Curve Signer Recovery
              </h3>
              <p className="text-xs text-text-muted">
                Recovers the Ethereum public address from the 65-byte ECDSA signature (r, s, v) and the calculated EIP-712 digest.
              </p>

              {analysis.recoveredSigner ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-bg-page border border-border-subtle space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Recovered Signer Address:</span>
                      <CopyButton text={analysis.recoveredSigner} label="Copy Address" />
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-400 break-all">
                      {analysis.recoveredSigner}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-bg-page border border-border-subtle flex items-center justify-between text-xs">
                    <span className="text-text-muted">Matches Declared Owner:</span>
                    <span
                      className={`font-bold font-mono ${
                        analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {analysis.summary.ownerOrSigner?.toLowerCase() === analysis.recoveredSigner.toLowerCase()
                        ? "✅ MATCH CONFIRMED"
                        : "❌ MISMATCH DETECTED"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center rounded-xl bg-bg-page border border-border-subtle text-xs text-text-muted space-y-2">
                  <span>ℹ️</span>
                  <p>
                    Paste a 65-byte raw signature hex in the box above to perform cryptographic verification.
                  </p>
                  {analysis.signatureError && (
                    <p className="text-rose-400 font-mono">{analysis.signatureError}</p>
                  )}
                </div>
              )}
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
