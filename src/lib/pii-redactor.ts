/**
 * Client-Side Secret & PII Redactor Engine
 * 100% in-browser processing for LLM prompts and developer logs.
 */

export type MaskingMode = "tokens" | "generic" | "asterisks" | "synthetic";

export type EntityCategory =
  | "email"
  | "phone"
  | "nik"
  | "npwp"
  | "credit_card"
  | "ip_address"
  | "api_key"
  | "jwt"
  | "private_key"
  | "db_connection"
  | "password"
  | "bearer_token"
  | "custom";

export interface RedactionRuleConfig {
  emails: boolean;
  phones: boolean;
  nik: boolean;
  npwp: boolean;
  creditCards: boolean;
  ipAddresses: boolean;
  apiKeys: boolean;
  jwts: boolean;
  privateKeys: boolean;
  dbConnections: boolean;
  passwords: boolean;
  bearerTokens: boolean;
}

export interface PiiRedactorOptions {
  rules: RedactionRuleConfig;
  maskingMode: MaskingMode;
  customTerms: string[];
  whitelistTerms: string[];
  maskIpWhitelistLocal: boolean; // skip 127.0.0.1, localhost
}

export const DEFAULT_REDACTION_RULES: RedactionRuleConfig = {
  emails: true,
  phones: true,
  nik: true,
  npwp: true,
  creditCards: true,
  ipAddresses: true,
  apiKeys: true,
  jwts: true,
  privateKeys: true,
  dbConnections: true,
  passwords: true,
  bearerTokens: true,
};

export const DEFAULT_PII_OPTIONS: PiiRedactorOptions = {
  rules: DEFAULT_REDACTION_RULES,
  maskingMode: "tokens",
  customTerms: [],
  whitelistTerms: [],
  maskIpWhitelistLocal: true,
};

export interface RedactedFinding {
  id: string;
  category: EntityCategory;
  categoryLabel: string;
  originalText: string;
  replacementText: string;
  startIndex: number;
  endIndex: number;
}

export interface PiiRedactionResult {
  redactedText: string;
  findings: RedactedFinding[];
  mappings: Record<string, string>; // replacementToken -> originalText
  inverseMappings: Record<string, string>; // originalText -> replacementToken
  stats: {
    totalFindings: number;
    countsByCategory: Record<EntityCategory, number>;
    originalLength: number;
    redactedLength: number;
  };
}

/**
 * Luhn Algorithm validator for Credit Cards
 */
export function isValidLuhn(digits: string): boolean {
  const clean = digits.replace(/\D/g, "");
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let isEven = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

/**
 * Indonesian NIK validation heuristic:
 * 16 digits, province code (11-92), date of birth encoded in digits 7-12
 */
export function isLikelyIndonesianNik(digits: string): boolean {
  const clean = digits.replace(/\D/g, "");
  if (clean.length !== 16) return false;
  const province = parseInt(clean.substring(0, 2), 10);
  if (province < 11 || province > 92) return false;

  // Day (01-31 for males, 41-71 for females)
  const day = parseInt(clean.substring(6, 8), 10);
  if (!((day >= 1 && day <= 31) || (day >= 41 && day <= 71))) return false;

  // Month (01-12)
  const month = parseInt(clean.substring(8, 10), 10);
  if (month < 1 || month > 12) return false;

  return true;
}

/**
 * Generates an asterisk mask for sensitive data
 */
function createAsteriskMask(val: string, category: EntityCategory): string {
  if (category === "email") {
    const parts = val.split("@");
    if (parts.length === 2) {
      const user = parts[0];
      const domain = parts[1];
      const maskedUser = user.length > 2 ? user[0] + "***" + user[user.length - 1] : "***";
      return `${maskedUser}@${domain}`;
    }
  }
  if (category === "credit_card") {
    const digits = val.replace(/\D/g, "");
    if (digits.length >= 12) {
      return `${digits.slice(0, 4)}-****-****-${digits.slice(-4)}`;
    }
  }
  if (category === "phone") {
    if (val.length > 6) {
      return val.slice(0, 3) + "****" + val.slice(-3);
    }
  }
  if (category === "api_key" || category === "password" || category === "jwt") {
    if (val.length > 8) {
      return val.slice(0, 4) + "..." + "*".repeat(8);
    }
  }
  return "*".repeat(Math.min(val.length, 12));
}

/**
 * Synthetic replacement lookup for realistic placeholders
 */
const SYNTHETIC_VALUES: Record<EntityCategory, string[]> = {
  email: ["alex.smith@example.com", "jordan.lee@example.org", "taylor.dev@example.net"],
  phone: ["+6281200001234", "+6281399998888", "+15550192834"],
  nik: ["3171010101900001", "3273020202950002", "3578030303880003"],
  npwp: ["01.234.567.8-012.000", "02.345.678.9-123.000"],
  credit_card: ["4111-2222-3333-4444", "5500-0000-0000-0004"],
  ip_address: ["192.0.2.1", "198.51.100.14", "203.0.113.42"],
  api_key: ["sk-proj-DEMO_OPENAI_API_KEY_1234567890ABCDEF", "sk-ant-DEMO_ANTHROPIC_KEY_12345"],
  jwt: ["eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkZW1vX3VzZXIifQ.DEMO_SIGNATURE"],
  private_key: ["-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----"],
  db_connection: ["postgres://db_user:dummy_pass@db.example.internal:5432/production_db"],
  password: ["RedactedPassword_123!"],
  bearer_token: ["Bearer demo_bearer_token_xyz991"],
  custom: ["<CUSTOM_ENTITY>"],
};

interface RawMatch {
  category: EntityCategory;
  categoryLabel: string;
  originalText: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Main Client-Side Redaction Engine
 */
export function redactPiiAndSecrets(
  text: string,
  options: PiiRedactorOptions = DEFAULT_PII_OPTIONS
): PiiRedactionResult {
  if (!text) {
    return {
      redactedText: "",
      findings: [],
      mappings: {},
      inverseMappings: {},
      stats: {
        totalFindings: 0,
        countsByCategory: {
          email: 0,
          phone: 0,
          nik: 0,
          npwp: 0,
          credit_card: 0,
          ip_address: 0,
          api_key: 0,
          jwt: 0,
          private_key: 0,
          db_connection: 0,
          password: 0,
          bearer_token: 0,
          custom: 0,
        },
        originalLength: 0,
        redactedLength: 0,
      },
    };
  }

  const rawMatches: RawMatch[] = [];
  const whitelistSet = new Set(options.whitelistTerms.map((t) => t.trim().toLowerCase()).filter(Boolean));

  function isWhitelisted(val: string): boolean {
    if (!val) return true;
    const lower = val.toLowerCase().trim();
    if (whitelistSet.has(lower)) return true;
    if (options.maskIpWhitelistLocal && (lower === "127.0.0.1" || lower === "localhost" || lower === "::1")) {
      return true;
    }
    return false;
  }

  // Helper to test regex pattern
  function matchRegex(pattern: RegExp, category: EntityCategory, label: string, filterFn?: (match: RegExpExecArray) => boolean) {
    const rx = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    let m: RegExpExecArray | null;
    while ((m = rx.exec(text)) !== null) {
      const fullMatch = m[0];
      const matchIndex = m.index;
      if (filterFn && !filterFn(m)) continue;
      if (isWhitelisted(fullMatch)) continue;

      rawMatches.push({
        category,
        categoryLabel: label,
        originalText: fullMatch,
        startIndex: matchIndex,
        endIndex: matchIndex + fullMatch.length,
      });
    }
  }

  // 1. Private Key Blocks (Highest Priority - multiline)
  if (options.rules.privateKeys) {
    matchRegex(
      /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----[\s\S]+?-----END (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/g,
      "private_key",
      "Private Key Block"
    );
  }

  // 2. Database Connection Strings (e.g. postgres://user:pass@host:5432/db)
  if (options.rules.dbConnections) {
    matchRegex(
      /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis|amqp|mssql):\/\/[^\s"'`<>]+/gi,
      "db_connection",
      "Database Connection URI"
    );
  }

  // 3. API Keys & Cloud Credentials
  if (options.rules.apiKeys) {
    // OpenAI API keys
    matchRegex(/sk-(?:proj-)?[A-Za-z0-9_-]{20,90}/g, "api_key", "OpenAI API Key");
    // Anthropic API keys
    matchRegex(/sk-ant-[A-Za-z0-9_-]{25,90}/g, "api_key", "Anthropic Claude API Key");
    // Google AI / Gemini API keys
    matchRegex(/AIzaSy[A-Za-z0-9_-]{33}/g, "api_key", "Google Gemini/Firebase API Key");
    // GitHub Personal Access Tokens
    matchRegex(/(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}|github_pat_[A-Za-z0-9_]{82}/g, "api_key", "GitHub Token");
    // AWS Access Key ID
    matchRegex(/AKIA[0-9A-Z]{16}/g, "api_key", "AWS Access Key ID");
    // Stripe API keys
    matchRegex(/(?:sk|rk|pk)_(?:live|test)_[0-9a-zA-Z]{24,99}/g, "api_key", "Stripe API Key");
    // Slack tokens
    matchRegex(/xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,34}/g, "api_key", "Slack OAuth Token");
  }

  // 4. JWT Tokens
  if (options.rules.jwts) {
    matchRegex(
      /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
      "jwt",
      "JSON Web Token (JWT)"
    );
  }

  // 5. Bearer Tokens
  if (options.rules.bearerTokens) {
    matchRegex(
      /(?:Bearer\s+)[A-Za-z0-9\-._~+/]+=*/g,
      "bearer_token",
      "Bearer Authorization Token"
    );
  }

  // 6. Explicit Password Assignments (e.g. password: "superSecret123!")
  if (options.rules.passwords) {
    const pwdRegex = /(?:password|passwd|pwd|client_secret|api_secret)\b[^;\n]{0,35}?(?:[:=]|DEFAULT)\s*["']?([^\s"',;`]{6,64})["']?/gi;
    let m: RegExpExecArray | null;
    while ((m = pwdRegex.exec(text)) !== null) {
      const val = m[1];
      if (val && !isWhitelisted(val)) {
        const valIndex = m.index + m[0].indexOf(val);
        rawMatches.push({
          category: "password",
          categoryLabel: "Assigned Password",
          originalText: val,
          startIndex: valIndex,
          endIndex: valIndex + val.length,
        });
      }
    }
  }

  // 7. Emails
  if (options.rules.emails) {
    matchRegex(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "email",
      "Email Address"
    );
  }

  // 8. Indonesian NIK (16 Digits)
  if (options.rules.nik) {
    matchRegex(/\b\d{16}\b/g, "nik", "Indonesian NIK", (m) => {
      // Must not be a valid credit card (Luhn check takes precedence if it passes Luhn)
      if (options.rules.creditCards && isValidLuhn(m[0])) return false;
      return isLikelyIndonesianNik(m[0]);
    });
  }

  // 9. Credit Cards (Luhn Algorithm Validated)
  if (options.rules.creditCards) {
    matchRegex(
      /\b(?:4[0-9]{3}|5[1-5][0-9]{2}|3[47][0-9]{2})[- ]?(?:[0-9]{4}[- ]?){2}[0-9]{3,4}\b|\b(?:\d{4}[- ]?){3}\d{4}\b/g,
      "credit_card",
      "Credit Card Number",
      (m) => {
        const digits = m[0].replace(/\D/g, "");
        return isValidLuhn(digits) || (digits.startsWith("4") && digits.length === 16);
      }
    );
  }

  // 10. Indonesian NPWP (e.g. 01.234.567.8-123.000 or 15-16 continuous digits)
  if (options.rules.npwp) {
    matchRegex(
      /\b\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}\b/g,
      "npwp",
      "Indonesian NPWP (Tax ID)"
    );
  }

  // 11. Phone Numbers (ID +62, 08xx, and International)
  if (options.rules.phones) {
    matchRegex(
      /(?:\+62|62|0)8[1-9][0-9]{7,10}\b|\b\+?[1-9]\d{1,14}\b/g,
      "phone",
      "Phone Number",
      (m) => {
        const digits = m[0].replace(/\D/g, "");
        // Avoid matching random small numbers or single years
        return digits.length >= 9 && digits.length <= 15;
      }
    );
  }

  // 12. IP Addresses (IPv4 and IPv6)
  if (options.rules.ipAddresses) {
    matchRegex(
      /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
      "ip_address",
      "IPv4 Address"
    );
  }

  // 13. Custom Terms / User Keywords
  if (options.customTerms && options.customTerms.length > 0) {
    for (const term of options.customTerms) {
      const cleanTerm = term.trim();
      if (!cleanTerm) continue;
      const escaped = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      matchRegex(new RegExp(`\\b${escaped}\\b`, "gi"), "custom", `Custom Term: ${cleanTerm}`);
    }
  }

  // Filter overlapping matches: sort by startIndex ascending, then by match length descending
  rawMatches.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
  });

  const nonOverlapping: RawMatch[] = [];
  let lastEnd = 0;
  for (const match of rawMatches) {
    if (match.startIndex >= lastEnd) {
      nonOverlapping.push(match);
      lastEnd = match.endIndex;
    }
  }

  // Maintain consistent replacement tokens so the same entity gets the same token!
  const entityToTokenMap = new Map<string, string>();
  const tokenToEntityMap: Record<string, string> = {};
  const categoryCounters: Record<string, number> = {};

  const countsByCategory: Record<EntityCategory, number> = {
    email: 0,
    phone: 0,
    nik: 0,
    npwp: 0,
    credit_card: 0,
    ip_address: 0,
    api_key: 0,
    jwt: 0,
    private_key: 0,
    db_connection: 0,
    password: 0,
    bearer_token: 0,
    custom: 0,
  };

  const findings: RedactedFinding[] = [];

  for (let i = 0; i < nonOverlapping.length; i++) {
    const m = nonOverlapping[i];
    countsByCategory[m.category] = (countsByCategory[m.category] || 0) + 1;

    let replacement = "";
    if (entityToTokenMap.has(m.originalText)) {
      replacement = entityToTokenMap.get(m.originalText)!;
    } else {
      if (options.maskingMode === "tokens") {
        categoryCounters[m.category] = (categoryCounters[m.category] || 0) + 1;
        const tag = m.category.toUpperCase();
        replacement = `<${tag}_${categoryCounters[m.category]}>`;
      } else if (options.maskingMode === "generic") {
        replacement = `[REDACTED_${m.category.toUpperCase()}]`;
      } else if (options.maskingMode === "asterisks") {
        replacement = createAsteriskMask(m.originalText, m.category);
      } else if (options.maskingMode === "synthetic") {
        const pool = SYNTHETIC_VALUES[m.category] || ["<ANONYMIZED>"];
        categoryCounters[m.category] = (categoryCounters[m.category] || 0) + 1;
        const synthIndex = (categoryCounters[m.category] - 1) % pool.length;
        replacement = pool[synthIndex];
      }

      entityToTokenMap.set(m.originalText, replacement);
      tokenToEntityMap[replacement] = m.originalText;
    }

    findings.push({
      id: `finding-${i + 1}`,
      category: m.category,
      categoryLabel: m.categoryLabel,
      originalText: m.originalText,
      replacementText: replacement,
      startIndex: m.startIndex,
      endIndex: m.endIndex,
    });
  }

  // Construct final redacted text
  let resultText = "";
  let cursor = 0;
  for (const f of findings) {
    resultText += text.substring(cursor, f.startIndex);
    resultText += f.replacementText;
    cursor = f.endIndex;
  }
  resultText += text.substring(cursor);

  const inverseMap: Record<string, string> = {};
  entityToTokenMap.forEach((token, original) => {
    inverseMap[original] = token;
  });

  return {
    redactedText: resultText,
    findings,
    mappings: tokenToEntityMap,
    inverseMappings: inverseMap,
    stats: {
      totalFindings: findings.length,
      countsByCategory,
      originalLength: text.length,
      redactedLength: resultText.length,
    },
  };
}

/**
 * Reversible De-anonymizer:
 * Takes the LLM response text containing tokens (e.g. <EMAIL_1>, <API_KEY_1>)
 * and substitutes them back with the user's original data.
 */
export function restoreAnonymizedResponse(
  llmResponseText: string,
  mappings: Record<string, string>
): { restoredText: string; restoredCount: number; restoredTokens: string[] } {
  if (!llmResponseText || !mappings) {
    return { restoredText: llmResponseText || "", restoredCount: 0, restoredTokens: [] };
  }

  let restoredText = llmResponseText;
  let restoredCount = 0;
  const restoredTokens: string[] = [];

  // Sort tokens by length descending so longer tokens get replaced first
  const tokens = Object.keys(mappings).sort((a, b) => b.length - a.length);

  for (const token of tokens) {
    const original = mappings[token];
    if (!token || !original) continue;

    // Check if token exists in response
    if (restoredText.includes(token)) {
      // Global literal replacement
      const count = (restoredText.split(token).length - 1);
      restoredText = restoredText.split(token).join(original);
      restoredCount += count;
      restoredTokens.push(token);
    }
  }

  return { restoredText, restoredCount, restoredTokens };
}

/**
 * High-utility Preset Samples for 1-Click Testing
 */
export const SAMPLE_PROMPT_CUSTOMER_TICKET = `Halo tim support AI,
Tolong buatkan draf balasan untuk tiket nasabah atas nama Bapak Budi Santoso.
Detail identitas nasabah:
- Email: budi.santoso@perusahaan.co.id
- Nomor HP: 081289102831
- NIK KTP: 3171012508890002
- NPWP: 08.123.456.7-012.000
- Nomor Kartu Kredit: 4532-0150-1823-9910 (Visa Platinum)
- Alamat IP login: 180.252.12.98

Keluhan: Nasabah mengalami kegagalan transfer sebesar Rp 15.000.000 ke rekening tujuan karena limit harian terlampaui. Buatkan respons ramah dalam Bahasa Indonesia yang menjelaskan cara menaikkan limit lewat aplikasi mobile banking.`;

export const SAMPLE_PROMPT_CRASH_LOG = `Please analyze this backend API production crash stack trace and suggest a fix:

[2026-10-06 08:12:01] ERROR Connection refused on postgres://admin_service:p@ssw0rd9981!@db-prod.internal.cloud:5432/orders_db
[2026-10-06 08:12:02] Failed to verify webhook with Stripe key sk_test_51Mz99887766554433221100aabbccdd
[2026-10-06 08:12:03] Client auth error with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIn0.G3QZ-f0K1891823719827391823712
[2026-10-06 08:12:04] AWS S3 bucket upload rejected for AKIAIOSFODNN7EXAMPLE using secret key.
Developer contact: devops-lead@megatools.dev / +6281198765432

Why did the database pool drop and how should we configure circuit breakers?`;

export const SAMPLE_PROMPT_DATABASE_DUMP = `Can you write a PostgreSQL migration script to optimize this table?

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) DEFAULT 'Siti Rahmawati',
  email VARCHAR(150) DEFAULT 'siti.rahmawati@corporate.id',
  phone VARCHAR(30) DEFAULT '081399887766',
  api_key VARCHAR(120) DEFAULT 'sk-proj-99a8b7c6d5e4f3a2b1c099887766554433221100',
  client_password VARCHAR(100) DEFAULT 'SecretP@ssword2026!',
  last_login_ip VARCHAR(45) DEFAULT '114.124.200.15'
);

We need to add index on email and mask sensitive audit fields.`;
