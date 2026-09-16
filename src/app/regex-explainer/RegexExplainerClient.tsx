"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface RegexToken {
  id: string;
  raw: string;
  category: "anchor" | "character-class" | "quantifier" | "group" | "lookaround" | "literal" | "operator";
  summary: string;
  detail: string;
}

const PRESETS = {
  email: {
    name: "Email Address (RFC 5322)",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    flags: "i",
  },
  semver: {
    name: "Semantic Version (SemVer)",
    pattern: "^v?(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$",
    flags: "",
  },
  strongPassword: {
    name: "Complex Password (Lookaheads)",
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,32}$",
    flags: "",
  },
  ipv4: {
    name: "IPv4 Address (0-255 Range)",
    pattern: "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    flags: "",
  },
  url: {
    name: "HTTP / HTTPS URL",
    pattern: "^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
    flags: "i",
  },
};

function explainRegexTokens(pattern: string): { tokens: RegexToken[]; error: string | null } {
  if (!pattern) return { tokens: [], error: null };

  try {
    new RegExp(pattern);
  } catch (e) {
    return { tokens: [], error: (e as Error).message };
  }

  const tokens: RegexToken[] = [];
  let i = 0;
  let counter = 1;

  while (i < pattern.length) {
    const char = pattern[i];
    const nextChar = pattern[i + 1];

    // Anchors
    if (char === "^") {
      tokens.push({
        id: String(counter++),
        raw: "^",
        category: "anchor",
        summary: "Start of string anchor",
        detail: "Matches the start of the string or beginning of a line in multiline mode.",
      });
      i++;
      continue;
    }

    if (char === "$") {
      tokens.push({
        id: String(counter++),
        raw: "$",
        category: "anchor",
        summary: "End of string anchor",
        detail: "Matches the end of the string or line boundary.",
      });
      i++;
      continue;
    }

    // Escaped sequences
    if (char === "\\") {
      const esc = pattern.slice(i, i + 2);
      const explanations: Record<string, { summary: string; detail: string; cat: RegexToken["category"] }> = {
        "\\d": { summary: "Digit character [0-9]", detail: "Matches any ASCII numerical digit from 0 to 9.", cat: "character-class" },
        "\\D": { summary: "Non-digit character", detail: "Matches any character that is not a numeric digit.", cat: "character-class" },
        "\\w": { summary: "Word character [a-zA-Z0-9_]", detail: "Matches any alphanumeric letter, number, or underscore.", cat: "character-class" },
        "\\W": { summary: "Non-word character", detail: "Matches any character that is not an alphanumeric or underscore.", cat: "character-class" },
        "\\s": { summary: "Whitespace character", detail: "Matches space, tab, line break, or form feed.", cat: "character-class" },
        "\\S": { summary: "Non-whitespace character", detail: "Matches any character except spaces, tabs, or newlines.", cat: "character-class" },
        "\\b": { summary: "Word boundary anchor", detail: "Matches position between word character and non-word character without consuming characters.", cat: "anchor" },
        "\\B": { summary: "Non-word boundary", detail: "Matches any position that is not a word boundary.", cat: "anchor" },
        "\\.": { summary: "Literal dot '.'", detail: "Escaped dot character matching a period literally instead of wildcard.", cat: "literal" },
      };

      if (explanations[esc]) {
        tokens.push({
          id: String(counter++),
          raw: esc,
          category: explanations[esc].cat,
          summary: explanations[esc].summary,
          detail: explanations[esc].detail,
        });
        i += 2;
        continue;
      } else {
        tokens.push({
          id: String(counter++),
          raw: esc,
          category: "literal",
          summary: `Escaped literal '${nextChar || ""}'`,
          detail: `Matches the literal character '${nextChar || ""}'.`,
        });
        i += 2;
        continue;
      }
    }

    // Character Sets e.g. [a-zA-Z0-9]
    if (char === "[") {
      let closeIdx = pattern.indexOf("]", i + 1);
      while (closeIdx !== -1 && pattern[closeIdx - 1] === "\\") {
        closeIdx = pattern.indexOf("]", closeIdx + 1);
      }

      if (closeIdx !== -1) {
        const setContent = pattern.slice(i, closeIdx + 1);
        const isNegated = setContent.startsWith("[^");
        tokens.push({
          id: String(counter++),
          raw: setContent,
          category: "character-class",
          summary: isNegated ? "Negated Character Class [^...]" : "Character Set Class [...]",
          detail: isNegated
            ? `Matches any single character EXCEPT those in the set: ${setContent.slice(2, -1)}`
            : `Matches any single character listed in the set: ${setContent.slice(1, -1)}`,
        });
        i = closeIdx + 1;
        continue;
      }
    }

    // Lookarounds & Groups
    if (char === "(") {
      if (pattern.slice(i, i + 3) === "(?=") {
        tokens.push({
          id: String(counter++),
          raw: "(?=",
          category: "lookaround",
          summary: "Positive Lookahead (?=...)",
          detail: "Asserts that the subpattern matches ahead without including it in the match result.",
        });
        i += 3;
        continue;
      } else if (pattern.slice(i, i + 3) === "(?!") {
        tokens.push({
          id: String(counter++),
          raw: "(?!",
          category: "lookaround",
          summary: "Negative Lookahead (?!...)",
          detail: "Asserts that the subpattern does NOT match ahead.",
        });
        i += 3;
        continue;
      } else if (pattern.slice(i, i + 4) === "(?<=") {
        tokens.push({
          id: String(counter++),
          raw: "(?<=",
          category: "lookaround",
          summary: "Positive Lookbehind (?<=...)",
          detail: "Asserts that the subpattern matches immediately behind.",
        });
        i += 4;
        continue;
      } else if (pattern.slice(i, i + 3) === "(?:") {
        tokens.push({
          id: String(counter++),
          raw: "(?:",
          category: "group",
          summary: "Non-capturing group (?:...)",
          detail: "Groups sub-expressions for quantifiers without saving match into backreferences.",
        });
        i += 3;
        continue;
      } else {
        tokens.push({
          id: String(counter++),
          raw: "(",
          category: "group",
          summary: "Capturing group (...)",
          detail: "Groups multiple tokens together and captures submatch for numbered backreference.",
        });
        i++;
        continue;
      }
    }

    if (char === ")") {
      tokens.push({
        id: String(counter++),
        raw: ")",
        category: "group",
        summary: "Close group ')'",
        detail: "Ends the active group or lookaround scope.",
      });
      i++;
      continue;
    }

    // Quantifiers
    if (char === "+" || char === "*" || char === "?") {
      const isLazy = pattern[i + 1] === "?";
      const qRaw = isLazy ? char + "?" : char;
      const summaries: Record<string, string> = {
        "+": "One or more times (1+)",
        "*": "Zero or more times (0+)",
        "?": "Optional / Zero or one time (0 or 1)",
        "+?": "Lazy: One or more times",
        "*?": "Lazy: Zero or more times",
        "??": "Lazy: Optional",
      };

      tokens.push({
        id: String(counter++),
        raw: qRaw,
        category: "quantifier",
        summary: `Quantifier ${qRaw}`,
        detail: `Modifies preceding item: ${summaries[qRaw] || "matches repetitions"}. ${isLazy ? "Matches as few characters as possible." : "Greedy match."}`,
      });
      i += isLazy ? 2 : 1;
      continue;
    }

    // Custom Repetition {min,max}
    if (char === "{") {
      const closeBrace = pattern.indexOf("}", i);
      if (closeBrace !== -1) {
        const qRange = pattern.slice(i, closeBrace + 1);
        tokens.push({
          id: String(counter++),
          raw: qRange,
          category: "quantifier",
          summary: `Exact Quantifier Range ${qRange}`,
          detail: `Specifies allowed repetition count for preceding token: ${qRange}.`,
        });
        i = closeBrace + 1;
        continue;
      }
    }

    // Wildcard dot
    if (char === ".") {
      tokens.push({
        id: String(counter++),
        raw: ".",
        category: "character-class",
        summary: "Wildcard Any Character '.'",
        detail: "Matches any single character except line breaks (or all characters including newline with /s flag).",
      });
      i++;
      continue;
    }

    // Logical OR / Alternation
    if (char === "|") {
      tokens.push({
        id: String(counter++),
        raw: "|",
        category: "operator",
        summary: "Alternation (OR) operator",
        detail: "Matches expression before OR expression after.",
      });
      i++;
      continue;
    }

    // Standard literal character
    tokens.push({
      id: String(counter++),
      raw: char,
      category: "literal",
      summary: `Literal character '${char}'`,
      detail: `Matches the exact character '${char}' (case-sensitive unless /i flag is set).`,
    });
    i++;
  }

  return { tokens, error: null };
}

const CATEGORY_COLORS: Record<RegexToken["category"], string> = {
  anchor: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  "character-class": "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
  quantifier: "border-accent/40 bg-accent/10 text-accent font-bold",
  group: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  lookaround: "border-rose-500/40 bg-rose-500/10 text-rose-300",
  operator: "border-orange-500/40 bg-orange-500/10 text-orange-300",
  literal: "border-border-subtle bg-bg-page text-text-primary",
};

export default function RegexExplainerClient() {
  const [pattern, setPattern] = useState<string>(PRESETS.email.pattern);
  const [flags, setFlags] = useState<string>(PRESETS.email.flags);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const { tokens, error } = useMemo(() => {
    return explainRegexTokens(pattern);
  }, [pattern]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total AST Tokens:</span>
        <span className="text-accent font-bold">{tokens.length} tokens</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Quantifiers:</span>
        <span className="text-text-primary">{tokens.filter((t) => t.category === "quantifier").length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Lookarounds / Groups:</span>
        <span className="text-text-primary">
          {tokens.filter((t) => t.category === "group" || t.category === "lookaround").length}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Pattern Validity:</span>
        <span className={error ? "text-error font-bold" : "text-success font-bold"}>
          {error ? "INVALID SYNTAX" : "VALID REGEX"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="regex-explainer" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle text-xs">
          <span className="text-text-muted">Regex Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setPattern(PRESETS[key].pattern);
                  setFlags(PRESETS[key].flags);
                }}
                className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                [{PRESETS[key].name}]
              </button>
            ))}
          </div>
        </div>

        {/* Regex Input Field */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Regular Expression to Deconstruct</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPattern("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
              <CopyButton text={pattern} label="Copy Pattern" />
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-border-subtle bg-bg-page px-3 py-1 focus-within:border-accent">
            <span className="text-sm text-text-muted select-none mr-2">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regular expression, e.g. ^(?=.*[A-Z])\w{8,}$..."
              className="w-full bg-transparent border-0 p-2 font-mono text-xs text-text-primary focus:outline-none"
            />
            <span className="text-sm text-text-muted select-none ml-2">/</span>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="gims"
              className="w-16 bg-transparent border-0 p-2 font-mono text-xs text-accent focus:outline-none text-center"
              title="Regex flags (e.g. g, i, m, s, u)"
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg border border-error/30 bg-error/10 text-xs text-error">
            ⚠ Invalid Regular Expression: {error}
          </div>
        )}

        {/* Visual Token Stream Chips */}
        {!error && tokens.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Interactive Token Stream</span>
              <span className="text-[10px] text-text-muted">Click any chip to highlight explanation</span>
            </div>

            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page flex flex-wrap gap-1.5 leading-loose">
              {tokens.map((token) => (
                <button
                  key={token.id}
                  type="button"
                  onClick={() => setSelectedTokenId(token.id === selectedTokenId ? null : token.id)}
                  className={`px-2 py-0.5 rounded text-xs border font-mono transition-transform hover:scale-105 ${
                    CATEGORY_COLORS[token.category]
                  } ${selectedTokenId === token.id ? "ring-2 ring-accent scale-105 shadow-md" : ""}`}
                  title={`${token.summary}: ${token.raw}`}
                >
                  {token.raw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token Explanation Step-by-Step Table */}
        {!error && tokens.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Step-by-Step Plain English Breakdown</span>
              <CopyButton
                text={tokens.map((t, idx) => `#${idx + 1} [${t.raw}] (${t.category}): ${t.summary} - ${t.detail}`).join("\n")}
                label="Copy Breakdown"
              />
            </div>

            <div className="divide-y divide-border-subtle border border-border-subtle bg-bg-page rounded-lg max-h-[380px] overflow-y-auto text-xs">
              {tokens.map((t, idx) => {
                const isSelected = selectedTokenId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTokenId(isSelected ? null : t.id)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected ? "bg-accent/15" : "hover:bg-bg-card/60"
                    }`}
                  >
                    <span className="w-6 shrink-0 font-bold text-text-muted text-[11px] pt-0.5">
                      #{idx + 1}
                    </span>

                    <span className={`px-2 py-0.5 rounded border text-xs font-mono font-bold shrink-0 ${CATEGORY_COLORS[t.category]}`}>
                      {t.raw}
                    </span>

                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">{t.summary}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-bg-card border border-border-subtle text-text-muted uppercase">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {t.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
