"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";
import {
  redactPiiAndSecrets,
  restoreAnonymizedResponse,
  PiiRedactorOptions,
  DEFAULT_PII_OPTIONS,
  MaskingMode,
  EntityCategory,
  SAMPLE_PROMPT_CUSTOMER_TICKET,
  SAMPLE_PROMPT_CRASH_LOG,
  SAMPLE_PROMPT_DATABASE_DUMP,
} from "@/lib/pii-redactor";

type ActiveTab = "sanitized" | "deanonymize" | "audit" | "settings";

const CATEGORY_META: Record<
  EntityCategory,
  { label: string; emoji: string; color: string; bg: string }
> = {
  email: { label: "Email Address", emoji: "✉️", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  phone: { label: "Phone Number", emoji: "📞", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  nik: { label: "Indonesian NIK", emoji: "🪪", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" },
  npwp: { label: "Indonesian NPWP", emoji: "📑", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  credit_card: { label: "Credit Card (Luhn)", emoji: "💳", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/30" },
  ip_address: { label: "IP Address", emoji: "🌐", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30" },
  api_key: { label: "API Key / Token", emoji: "🔑", color: "text-amber-300", bg: "bg-amber-500/15 border-amber-500/40" },
  jwt: { label: "JWT Token", emoji: "🎟️", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  private_key: { label: "Private Key", emoji: "🔐", color: "text-red-400", bg: "bg-red-500/15 border-red-500/40" },
  db_connection: { label: "Database URI", emoji: "🗄️", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  password: { label: "Secret / Password", emoji: "🔒", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  bearer_token: { label: "Bearer Token", emoji: "🛡️", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30" },
  custom: { label: "Custom Term", emoji: "🏷️", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
};

export default function PiiRedactorClient() {
  const [inputText, setInputText] = useState<string>(SAMPLE_PROMPT_CUSTOMER_TICKET);
  const [activeTab, setActiveTab] = useState<ActiveTab>("sanitized");
  const [options, setOptions] = useState<PiiRedactorOptions>(DEFAULT_PII_OPTIONS);
  const [customTermInput, setCustomTermInput] = useState<string>("");
  const [whitelistInput, setWhitelistInput] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // AI Response De-anonymizer State
  const [aiResponseInput, setAiResponseInput] = useState<string>("");
  const [restoredOutput, setRestoredOutput] = useState<string>("");
  const [restoredCount, setRestoredCount] = useState<number>(0);
  const [restoredTokens, setRestoredTokens] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redaction Calculation
  const result = useMemo(() => {
    return redactPiiAndSecrets(inputText, options);
  }, [inputText, options]);

  // Load sample prompt
  const loadPreset = (preset: "ticket" | "crash" | "db" | "clear") => {
    if (preset === "ticket") {
      setInputText(SAMPLE_PROMPT_CUSTOMER_TICKET);
      setAiResponseInput(
        "Halo Bapak Budi Santoso,\n\nTerima kasih telah menghubungi kami. Terkait keluhan gagal transfer ke rekening tujuan dengan email <EMAIL_1> dan kartu <CREDIT_CARD_1>, Anda dapat meningkatkan limit harian secara mandiri melalui menu Pengaturan Akun di aplikasi Mobile Banking kami."
      );
    } else if (preset === "crash") {
      setInputText(SAMPLE_PROMPT_CRASH_LOG);
      setAiResponseInput(
        "Based on the crash log, your database connection string <DB_CONNECTION_1> encountered a connection drop. Additionally, your Stripe webhook key <API_KEY_1> should be rotated immediately."
      );
    } else if (preset === "db") {
      setInputText(SAMPLE_PROMPT_DATABASE_DUMP);
      setAiResponseInput(
        "Here is the PostgreSQL migration script:\nCREATE INDEX idx_accounts_email ON accounts(email);\nNote: Keep the API key <API_KEY_1> securely encrypted in KMS."
      );
    } else {
      setInputText("");
      setAiResponseInput("");
      setRestoredOutput("");
    }
  };

  // Toggle single rule
  const toggleRule = (ruleKey: keyof typeof options.rules) => {
    setOptions((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ruleKey]: !prev.rules[ruleKey],
      },
    }));
  };

  // Set masking mode
  const setMaskingMode = (mode: MaskingMode) => {
    setOptions((prev) => ({ ...prev, maskingMode: mode }));
  };

  // Add Custom Term
  const addCustomTerm = () => {
    const term = customTermInput.trim();
    if (term && !options.customTerms.includes(term)) {
      setOptions((prev) => ({ ...prev, customTerms: [...prev.customTerms, term] }));
      setCustomTermInput("");
    }
  };

  // Remove Custom Term
  const removeCustomTerm = (term: string) => {
    setOptions((prev) => ({ ...prev, customTerms: prev.customTerms.filter((t) => t !== term) }));
  };

  // Add Whitelist Term
  const addWhitelistTerm = () => {
    const term = whitelistInput.trim();
    if (term && !options.whitelistTerms.includes(term)) {
      setOptions((prev) => ({ ...prev, whitelistTerms: [...prev.whitelistTerms, term] }));
      setWhitelistInput("");
    }
  };

  // Remove Whitelist Term
  const removeWhitelistTerm = (term: string) => {
    setOptions((prev) => ({ ...prev, whitelistTerms: prev.whitelistTerms.filter((t) => t !== term) }));
  };

  // Handle File Upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) setInputText(content);
    };
    reader.readAsText(file);
  };

  // Download Sanitized Text
  const downloadSanitized = () => {
    const blob = new Blob([result.redactedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sanitized-prompt-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Mappings JSON
  const exportMappings = () => {
    const blob = new Blob([JSON.stringify(result.mappings, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pii-mappings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Execute De-anonymization
  const handleDeAnonymize = useCallback(() => {
    const { restoredText, restoredCount: count, restoredTokens: tokens } = restoreAnonymizedResponse(
      aiResponseInput,
      result.mappings
    );
    setRestoredOutput(restoredText);
    setRestoredCount(count);
    setRestoredTokens(tokens);
  }, [aiResponseInput, result.mappings]);

  // Toggle reveal secret in audit table
  const toggleRevealSecret = (id: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Top stats bar
  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Redacted Entities:</span>
        <span className="text-accent font-bold">{result.stats.totalFindings} detected</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Masking Mode:</span>
        <span className="text-cyan-300 font-bold capitalize">{options.maskingMode}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Reversible Mappings:</span>
        <span className="text-purple-300 font-bold">{Object.keys(result.mappings).length} tokens</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Execution Mode:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="pii-redactor" stats={stats}>
      <div className="space-y-5 font-mono">
        {/* Presets & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border-subtle bg-bg-card text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-text-muted mr-1">Load Presets:</span>
            <button
              onClick={() => loadPreset("ticket")}
              className="px-2.5 py-1 rounded-lg border border-border-subtle bg-bg-page hover:border-accent hover:text-accent transition-colors"
            >
              Support Ticket (PII)
            </button>
            <button
              onClick={() => loadPreset("crash")}
              className="px-2.5 py-1 rounded-lg border border-border-subtle bg-bg-page hover:border-accent hover:text-accent transition-colors"
            >
              Crash Log & Secrets
            </button>
            <button
              onClick={() => loadPreset("db")}
              className="px-2.5 py-1 rounded-lg border border-border-subtle bg-bg-page hover:border-accent hover:text-accent transition-colors"
            >
              Database Schema Dump
            </button>
            <button
              onClick={() => loadPreset("clear")}
              className="px-2.5 py-1 rounded-lg border border-border-subtle text-text-muted hover:text-error hover:border-error/50 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 rounded-lg border border-border-subtle bg-bg-page text-text-secondary hover:text-text-primary hover:border-accent transition-colors flex items-center gap-1.5"
            >
              <span>📂 Open File</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Input Prompt & Output Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column: Raw Input Prompt */}
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-border-subtle">
              <span className="font-bold text-text-primary flex items-center gap-2">
                <span>📝 Original Prompt / Code / Log</span>
                <span className="text-[11px] font-normal text-text-muted">
                  ({inputText.length} chars)
                </span>
              </span>
              <CopyButton text={inputText} label="Copy Original" />
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
              className={`relative flex-1 min-h-[360px] rounded-lg border transition-all ${
                isDragging
                  ? "border-accent bg-accent/10"
                  : "border-border-subtle bg-bg-page"
              }`}
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste confidential prompt, user inquiry, API logs, SQL dumps, or code here..."
                className="w-full h-full min-h-[360px] p-3 rounded-lg bg-transparent text-xs text-text-primary font-mono focus:outline-none resize-none leading-relaxed placeholder:text-text-muted"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
              <span>Drag & drop .txt, .log, .json, .env, .csv</span>
              <span className="text-success font-medium flex items-center gap-1">
                <span>🔒 Safe: Stays in your browser</span>
              </span>
            </div>
          </div>

          {/* Right Column: Redaction Workspace Tabs */}
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 flex flex-col space-y-3">
            {/* Tabs Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-subtle">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("sanitized")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "sanitized"
                      ? "bg-accent text-bg-page"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  🛡️ Sanitized Prompt
                </button>
                <button
                  onClick={() => setActiveTab("deanonymize")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "deanonymize"
                      ? "bg-accent text-bg-page"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  🔄 De-anonymizer
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "audit"
                      ? "bg-accent text-bg-page"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  📋 Audit ({result.findings.length})
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "settings"
                      ? "bg-accent text-bg-page"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  ⚙️ Rules
                </button>
              </div>

              {activeTab === "sanitized" && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={downloadSanitized}
                    className="px-2 py-1 rounded-md border border-border-subtle bg-bg-page text-xs text-text-muted hover:text-text-primary hover:border-accent transition-colors"
                    title="Download Clean Text"
                  >
                    💾 Save
                  </button>
                  <CopyButton text={result.redactedText} label="Copy for AI" />
                </div>
              )}
            </div>

            {/* TAB 1: Sanitized Prompt Output */}
            {activeTab === "sanitized" && (
              <div className="flex flex-col flex-1 space-y-3">
                {/* Masking Mode Selector Pill */}
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-bg-page border border-border-subtle">
                  <span className="text-text-muted text-[11px]">Format:</span>
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: "tokens", label: "Smart Tokens (<TAG_1>)" },
                        { id: "generic", label: "Generic ([REDACTED])" },
                        { id: "asterisks", label: "Asterisks (***)" },
                        { id: "synthetic", label: "Synthetic Mock" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMaskingMode(m.id)}
                        className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                          options.maskingMode === m.id
                            ? "bg-accent/20 text-accent font-bold border border-accent/40"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-[300px] p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed max-h-[460px] overflow-y-auto">
                  {result.redactedText || (
                    <span className="text-text-muted italic">
                      Sanitized text will appear here once you enter a prompt...
                    </span>
                  )}
                </div>

                {/* Detected categories summary chips */}
                {result.findings.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="text-text-muted">Detected:</span>
                    {Object.entries(result.stats.countsByCategory)
                      .filter(([, count]) => count > 0)
                      .map(([cat, count]) => {
                        const meta = CATEGORY_META[cat as EntityCategory];
                        return (
                          <span
                            key={cat}
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1 ${meta.bg} ${meta.color}`}
                          >
                            <span>{meta.emoji}</span>
                            <span>{meta.label}:</span>
                            <span className="font-bold">{count}</span>
                          </span>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AI Response De-anonymizer */}
            {activeTab === "deanonymize" && (
              <div className="flex flex-col flex-1 space-y-3 text-xs">
                <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 text-[11px] text-text-secondary leading-relaxed">
                  💡 <strong className="text-purple-300">Reversible Privacy Bridge:</strong> Paste the
                  response received from ChatGPT, Claude, or Cursor (which contains tokens like{" "}
                  <code>&lt;EMAIL_1&gt;</code>, <code>&lt;API_KEY_1&gt;</code>). Click{" "}
                  <strong>Restore</strong> to seamlessly substitute the tokens back with your real data!
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-muted font-bold">1. AI Response (with tokens):</span>
                    {aiResponseInput && (
                      <button
                        onClick={() => setAiResponseInput("")}
                        className="text-text-muted hover:text-error"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    value={aiResponseInput}
                    onChange={(e) => setAiResponseInput(e.target.value)}
                    placeholder="Paste AI response here (e.g. 'Hello, regarding user <EMAIL_1>...')"
                    className="w-full h-28 p-2.5 rounded-lg border border-border-subtle bg-bg-page text-xs font-mono text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={handleDeAnonymize}
                    disabled={!aiResponseInput.trim()}
                    className="px-4 py-2 rounded-lg bg-accent text-bg-page font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <span>🔄 Restore Original Data</span>
                  </button>

                  {restoredCount > 0 && (
                    <span className="text-success font-bold text-xs">
                      ✅ {restoredCount} token(s) restored!
                    </span>
                  )}
                </div>

                {restoredOutput && (
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-text-muted font-bold">
                        2. De-anonymized Clean Output:
                      </span>
                      <CopyButton text={restoredOutput} label="Copy Unmasked" />
                    </div>
                    <div className="p-3 rounded-lg border border-border-subtle bg-bg-page text-xs font-mono text-text-primary whitespace-pre-wrap break-all max-h-48 overflow-y-auto leading-relaxed">
                      {restoredOutput}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Audit Log & Mappings Table */}
            {activeTab === "audit" && (
              <div className="flex flex-col flex-1 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-text-muted text-[11px]">
                    Total Findings: <strong className="text-accent">{result.findings.length}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportMappings}
                      className="px-2.5 py-1 rounded-lg border border-border-subtle bg-bg-page text-[11px] text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
                    >
                      Export Mapping JSON
                    </button>
                  </div>
                </div>

                {result.findings.length === 0 ? (
                  <div className="p-8 text-center text-text-muted bg-bg-page rounded-lg border border-border-subtle">
                    No PII or secrets detected in the current text with active rules.
                  </div>
                ) : (
                  <div className="border border-border-subtle rounded-lg overflow-hidden bg-bg-page max-h-[380px] overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-bg-card/70 border-b border-border-subtle text-[11px] text-text-muted">
                        <tr>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Original Sensitive Value</th>
                          <th className="p-2.5">Token / Mask</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle/50 text-[11px]">
                        {result.findings.map((f) => {
                          const meta = CATEGORY_META[f.category];
                          const isRevealed = !!revealedSecrets[f.id];
                          return (
                            <tr key={f.id} className="hover:bg-bg-card/40 transition-colors">
                              <td className="p-2.5 align-middle">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${meta.bg} ${meta.color}`}
                                >
                                  <span>{meta.emoji}</span>
                                  <span>{meta.label}</span>
                                </span>
                              </td>
                              <td className="p-2.5 align-middle">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`break-all ${
                                      isRevealed
                                        ? "text-rose-300 font-bold"
                                        : "filter blur-[3px] select-none text-text-muted"
                                    }`}
                                  >
                                    {f.originalText}
                                  </span>
                                  <button
                                    onClick={() => toggleRevealSecret(f.id)}
                                    className="text-[10px] text-text-muted hover:text-accent shrink-0"
                                    title={isRevealed ? "Hide Value" : "Reveal Value"}
                                  >
                                    {isRevealed ? "🙈" : "👁️"}
                                  </button>
                                </div>
                              </td>
                              <td className="p-2.5 align-middle">
                                <code className="text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded">
                                  {f.replacementText}
                                </code>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Granular Rules & Whitelist */}
            {activeTab === "settings" && (
              <div className="flex flex-col flex-1 space-y-4 text-xs max-h-[460px] overflow-y-auto pr-1">
                <div>
                  <span className="font-bold text-text-primary block mb-2">
                    🛡️ Detection Rules & Pattern Categories:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: "emails", label: "Email Addresses", emoji: "✉️" },
                      { key: "phones", label: "Phone Numbers (ID & Intl)", emoji: "📞" },
                      { key: "nik", label: "Indonesian NIK (16 Digits)", emoji: "🪪" },
                      { key: "npwp", label: "Indonesian NPWP (Tax ID)", emoji: "📑" },
                      { key: "creditCards", label: "Credit Cards (Luhn algorithm)", emoji: "💳" },
                      { key: "apiKeys", label: "API Keys (OpenAI, Anthropic, AWS, Stripe)", emoji: "🔑" },
                      { key: "passwords", label: "Assigned Passwords & Secrets", emoji: "🔒" },
                      { key: "jwts", label: "JSON Web Tokens (JWT)", emoji: "🎟️" },
                      { key: "bearerTokens", label: "Bearer Authorization Tokens", emoji: "🛡️" },
                      { key: "dbConnections", label: "Database Connection URIs", emoji: "🗄️" },
                      { key: "privateKeys", label: "Private Key Blocks (RSA/EC/SSH)", emoji: "🔐" },
                      { key: "ipAddresses", label: "Public IPv4 Addresses", emoji: "🌐" },
                    ].map(({ key, label, emoji }) => {
                      const enabled = options.rules[key as keyof typeof options.rules];
                      return (
                        <button
                          key={key}
                          onClick={() => toggleRule(key as keyof typeof options.rules)}
                          className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                            enabled
                              ? "border-accent/40 bg-accent/10 text-text-primary"
                              : "border-border-subtle bg-bg-page text-text-muted hover:border-border-subtle/80"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{emoji}</span>
                            <span className="text-[11px] font-medium">{label}</span>
                          </span>
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] ${
                              enabled
                                ? "bg-accent border-accent text-bg-page font-bold"
                                : "border-border-subtle"
                            }`}
                          >
                            {enabled ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Whitelist Settings */}
                <div className="pt-2 border-t border-border-subtle space-y-2">
                  <span className="font-bold text-text-primary block">
                    ✅ Whitelist Terms (Never Redact):
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={whitelistInput}
                      onChange={(e) => setWhitelistInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addWhitelistTerm()}
                      placeholder="e.g. support@megatools.dev, 127.0.0.1"
                      className="flex-1 p-2 rounded-lg border border-border-subtle bg-bg-page text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                    <button
                      onClick={addWhitelistTerm}
                      className="px-3 py-2 rounded-lg border border-border-subtle bg-bg-page text-xs font-bold hover:border-accent hover:text-accent transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                  {options.whitelistTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {options.whitelistTerms.map((term) => (
                        <span
                          key={term}
                          className="px-2 py-0.5 rounded-md border border-border-subtle bg-bg-page text-[10px] text-text-secondary flex items-center gap-1"
                        >
                          <span>{term}</span>
                          <button
                            onClick={() => removeWhitelistTerm(term)}
                            className="text-text-muted hover:text-error"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Sensitive Words Blacklist */}
                <div className="pt-2 border-t border-border-subtle space-y-2">
                  <span className="font-bold text-text-primary block">
                    🏷️ Custom Sensitive Terms (Always Redact):
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customTermInput}
                      onChange={(e) => setCustomTermInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustomTerm()}
                      placeholder="e.g. ProjectChimera, ACME_INTERNAL"
                      className="flex-1 p-2 rounded-lg border border-border-subtle bg-bg-page text-xs text-text-primary focus:border-accent focus:outline-none"
                    />
                    <button
                      onClick={addCustomTerm}
                      className="px-3 py-2 rounded-lg border border-border-subtle bg-bg-page text-xs font-bold hover:border-accent hover:text-accent transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                  {options.customTerms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {options.customTerms.map((term) => (
                        <span
                          key={term}
                          className="px-2 py-0.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 text-[10px] text-yellow-300 flex items-center gap-1"
                        >
                          <span>{term}</span>
                          <button
                            onClick={() => removeCustomTerm(term)}
                            className="text-text-muted hover:text-error"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
