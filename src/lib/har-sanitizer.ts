/**
 * HAR File Sanitizer & Credential Stripper Engine
 * 100% client-side sanitization of HTTP Archive (.har) logs.
 */

export interface HarSanitizerOptions {
  stripAuthHeaders: boolean;
  stripCookies: boolean;
  stripQueryParams: boolean;
  sanitizeJsonBodies: boolean;
  sanitizeUrlTokens: boolean;
  stripAllResponseBodies: boolean;
  stripBinaryResponseBodies: boolean;
  maskIpAddresses: boolean;
  replacementText: string;
  customSensitiveKeys: string[];
}

export const DEFAULT_SANITIZER_OPTIONS: HarSanitizerOptions = {
  stripAuthHeaders: true,
  stripCookies: true,
  stripQueryParams: true,
  sanitizeJsonBodies: true,
  sanitizeUrlTokens: true,
  stripAllResponseBodies: false,
  stripBinaryResponseBodies: true,
  maskIpAddresses: false,
  replacementText: "[REDACTED]",
  customSensitiveKeys: [],
};

export interface SanitizationFinding {
  id: string;
  entryId: string;
  method: string;
  url: string;
  location: "header" | "cookie" | "query" | "body" | "url" | "ip";
  key: string;
  action: string;
}

export interface SanitizationStats {
  totalEntries: number;
  totalFindings: number;
  redactedHeaders: number;
  redactedCookies: number;
  redactedQueryParams: number;
  redactedBodyKeys: number;
  redactedUrls: number;
  redactedIps: number;
  originalSize: number;
  sanitizedSize: number;
  processingTimeMs: number;
}

export interface HarSanitizationResult {
  sanitizedHar: any;
  findings: SanitizationFinding[];
  stats: SanitizationStats;
}

const DEFAULT_AUTH_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-apikey",
  "api-key",
  "apikey",
  "x-auth-token",
  "x-authentication-token",
  "x-access-token",
  "access-token",
  "x-csrf-token",
  "x-xsrf-token",
  "csrf-token",
  "xsrf-token",
  "x-token",
  "token",
  "x-secret",
  "x-client-secret",
  "x-user-token",
  "cf-access-token",
  "cf-access-jwt-assertion",
]);

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
  /id[_-]?token/i,
  /auth[_-]?token/i,
  /bearer/i,
  /session/i,
  /sessid/i,
  /jwt/i,
  /private[_-]?key/i,
  /credit[_-]?card/i,
  /card[_-]?number/i,
  /cvv/i,
  /cvc/i,
  /ssn/i,
  /pin/i,
  /passphrase/i,
];

const SENSITIVE_QUERY_PARAMS = new Set([
  "token",
  "auth",
  "key",
  "api_key",
  "apikey",
  "secret",
  "password",
  "passwd",
  "pass",
  "access_token",
  "refresh_token",
  "id_token",
  "session",
  "session_id",
  "sessid",
  "code",
  "client_secret",
  "sig",
  "signature",
  "jwt",
]);

const BINARY_MIME_PATTERNS = [
  /^image\//i,
  /^font\//i,
  /^audio\//i,
  /^video\//i,
  /application\/(octet-stream|pdf|zip|x-zip|wasm|x-tar|gzip)/i,
];

function isBinaryMime(mimeType: string): boolean {
  if (!mimeType) return false;
  return BINARY_MIME_PATTERNS.some((p) => p.test(mimeType));
}

function isSensitiveKey(key: string, customKeys: string[] = []): boolean {
  if (!key) return false;
  const lower = key.toLowerCase().trim();
  if (customKeys.some((ck) => lower === ck.toLowerCase().trim())) return true;
  return SENSITIVE_KEY_PATTERNS.some((p) => p.test(lower));
}

function sanitizeUrl(
  rawUrl: string,
  replacement: string,
  options: HarSanitizerOptions,
  findings: SanitizationFinding[],
  entryId: string,
  method: string
): string {
  try {
    const urlObj = new URL(rawUrl);
    let modified = false;

    // Check query params in URL
    const searchParams = urlObj.searchParams;
    const keysToDelete: string[] = [];
    const keysToReplace: [string, string][] = [];

    searchParams.forEach((value, paramKey) => {
      const lowerKey = paramKey.toLowerCase();
      const isCustom = options.customSensitiveKeys.some((ck) => lowerKey === ck.toLowerCase().trim());
      const isKnown = SENSITIVE_QUERY_PARAMS.has(lowerKey) || SENSITIVE_KEY_PATTERNS.some((p) => p.test(lowerKey));

      if (isCustom || isKnown) {
        keysToReplace.push([paramKey, replacement]);
        findings.push({
          id: `${entryId}-urlparam-${paramKey}`,
          entryId,
          method,
          url: rawUrl,
          location: "url",
          key: `URL Param: ${paramKey}`,
          action: `Redacted token value in URL`,
        });
        modified = true;
      }
    });

    if (modified) {
      keysToReplace.forEach(([k, v]) => searchParams.set(k, v));
      return urlObj.toString();
    }
  } catch {
    // If not a full URL or relative, check regex token replacements
    const replaced = rawUrl.replace(
      /([?&](?:token|access_token|key|api_key|auth|secret|code)=)([^&]+)/gi,
      `$1${replacement}`
    );
    if (replaced !== rawUrl) {
      findings.push({
        id: `${entryId}-url-regex`,
        entryId,
        method,
        url: rawUrl,
        location: "url",
        key: `URL Query Token`,
        action: `Redacted matching token parameters in URL string`,
      });
      return replaced;
    }
  }
  return rawUrl;
}

function sanitizeJsonDeep(
  target: any,
  options: HarSanitizerOptions,
  findings: SanitizationFinding[],
  entryId: string,
  method: string,
  url: string,
  path = ""
): any {
  if (target === null || typeof target !== "object") {
    // String heuristic: check for Bearer or JWT or AWS keys
    if (typeof target === "string") {
      let mod = target;
      let matched = false;
      // JWT regex
      if (mod.match(/ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/)) {
        mod = mod.replace(/ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, options.replacementText);
        matched = true;
      }
      // AWS Access Key ID
      if (mod.match(/AKIA[0-9A-Z]{16}/)) {
        mod = mod.replace(/AKIA[0-9A-Z]{16}/g, options.replacementText);
        matched = true;
      }
      if (matched) {
        findings.push({
          id: `${entryId}-body-str-${path}`,
          entryId,
          method,
          url,
          location: "body",
          key: path || "token_string",
          action: "Redacted inline secret/JWT token",
        });
        return mod;
      }
    }
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item, idx) =>
      sanitizeJsonDeep(item, options, findings, entryId, method, url, `${path}[${idx}]`)
    );
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(target)) {
    const currentPath = path ? `${path}.${key}` : key;
    if (isSensitiveKey(key, options.customSensitiveKeys)) {
      result[key] = options.replacementText;
      findings.push({
        id: `${entryId}-body-${currentPath}`,
        entryId,
        method,
        url,
        location: "body",
        key: currentPath,
        action: `Replaced sensitive JSON field with ${options.replacementText}`,
      });
    } else {
      result[key] = sanitizeJsonDeep(value, options, findings, entryId, method, url, currentPath);
    }
  }
  return result;
}

export function sanitizeHar(rawHarString: string, userOptions: Partial<HarSanitizerOptions> = {}): HarSanitizationResult {
  const startTime = performance.now();
  const options: HarSanitizerOptions = { ...DEFAULT_SANITIZER_OPTIONS, ...userOptions };
  const findings: SanitizationFinding[] = [];

  const originalSize = new Blob([rawHarString]).size;
  let parsed: any;

  try {
    parsed = JSON.parse(rawHarString);
  } catch (err) {
    throw new Error("Invalid HAR JSON file. Unable to parse content.");
  }

  if (!parsed || !parsed.log || !Array.isArray(parsed.log.entries)) {
    throw new Error("Invalid HAR structure: expected a root 'log' object with an 'entries' array.");
  }

  // Clone entries deeply to prevent mutating originals
  const sanitized = JSON.parse(JSON.stringify(parsed));
  const entries: any[] = sanitized.log.entries;

  let redactedHeaders = 0;
  let redactedCookies = 0;
  let redactedQueryParams = 0;
  let redactedBodyKeys = 0;
  let redactedUrls = 0;
  let redactedIps = 0;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const entryId = entry.id ? String(entry.id) : `entry-${i + 1}`;
    const method = entry.request?.method || "GET";
    const originalUrl = entry.request?.url || "";

    // 1. IP Address Masking
    if (options.maskIpAddresses) {
      if (entry.serverIPAddress && entry.serverIPAddress !== "0.0.0.0") {
        findings.push({
          id: `${entryId}-ip-server`,
          entryId,
          method,
          url: originalUrl,
          location: "ip",
          key: "serverIPAddress",
          action: `Masked IP address (${entry.serverIPAddress} -> 127.0.0.1)`,
        });
        entry.serverIPAddress = "127.0.0.1";
        redactedIps++;
      }
      if (entry.clientIPAddress && entry.clientIPAddress !== "0.0.0.0") {
        findings.push({
          id: `${entryId}-ip-client`,
          entryId,
          method,
          url: originalUrl,
          location: "ip",
          key: "clientIPAddress",
          action: `Masked client IP address (${entry.clientIPAddress} -> 127.0.0.1)`,
        });
        entry.clientIPAddress = "127.0.0.1";
        redactedIps++;
      }
    }

    // 2. URL token sanitization
    if (options.sanitizeUrlTokens && entry.request?.url) {
      const sanitizedUrl = sanitizeUrl(entry.request.url, options.replacementText, options, findings, entryId, method);
      if (sanitizedUrl !== entry.request.url) {
        entry.request.url = sanitizedUrl;
        redactedUrls++;
      }
    }

    // 3. Request Headers
    if (entry.request?.headers && Array.isArray(entry.request.headers)) {
      entry.request.headers = entry.request.headers.map((h: { name: string; value: string }) => {
        if (!h || !h.name) return h;
        const lowerName = h.name.toLowerCase().trim();
        const isAuth = options.stripAuthHeaders && DEFAULT_AUTH_HEADERS.has(lowerName);
        const isCookie = options.stripCookies && (lowerName === "cookie" || lowerName === "set-cookie");
        const isCustom = options.customSensitiveKeys.some((ck) => lowerName === ck.toLowerCase().trim());
        const isSensitive = isSensitiveKey(lowerName, options.customSensitiveKeys);

        if (isAuth || isCookie || isCustom || isSensitive) {
          findings.push({
            id: `${entryId}-reqhdr-${h.name}`,
            entryId,
            method,
            url: originalUrl,
            location: isCookie ? "cookie" : "header",
            key: `Request Header: ${h.name}`,
            action: `Redacted header value`,
          });
          if (isCookie) redactedCookies++;
          else redactedHeaders++;
          return { ...h, value: options.replacementText };
        }
        return h;
      });
    }

    // 4. Response Headers
    if (entry.response?.headers && Array.isArray(entry.response.headers)) {
      entry.response.headers = entry.response.headers.map((h: { name: string; value: string }) => {
        if (!h || !h.name) return h;
        const lowerName = h.name.toLowerCase().trim();
        const isAuth = options.stripAuthHeaders && DEFAULT_AUTH_HEADERS.has(lowerName);
        const isCookie = options.stripCookies && (lowerName === "set-cookie" || lowerName === "cookie");
        const isCustom = options.customSensitiveKeys.some((ck) => lowerName === ck.toLowerCase().trim());
        const isSensitive = isSensitiveKey(lowerName, options.customSensitiveKeys);

        if (isAuth || isCookie || isCustom || isSensitive) {
          findings.push({
            id: `${entryId}-reshdr-${h.name}`,
            entryId,
            method,
            url: originalUrl,
            location: isCookie ? "cookie" : "header",
            key: `Response Header: ${h.name}`,
            action: `Redacted header value`,
          });
          if (isCookie) redactedCookies++;
          else redactedHeaders++;
          return { ...h, value: options.replacementText };
        }
        return h;
      });
    }

    // 5. Request Cookies array
    if (options.stripCookies && entry.request?.cookies && Array.isArray(entry.request.cookies)) {
      entry.request.cookies = entry.request.cookies.map((c: any) => {
        findings.push({
          id: `${entryId}-reqcookie-${c.name || "cookie"}`,
          entryId,
          method,
          url: originalUrl,
          location: "cookie",
          key: `Request Cookie: ${c.name || "unnamed"}`,
          action: `Redacted cookie value`,
        });
        redactedCookies++;
        return { ...c, value: options.replacementText };
      });
    }

    // 6. Response Cookies array
    if (options.stripCookies && entry.response?.cookies && Array.isArray(entry.response.cookies)) {
      entry.response.cookies = entry.response.cookies.map((c: any) => {
        findings.push({
          id: `${entryId}-rescookie-${c.name || "cookie"}`,
          entryId,
          method,
          url: originalUrl,
          location: "cookie",
          key: `Response Cookie: ${c.name || "unnamed"}`,
          action: `Redacted cookie value`,
        });
        redactedCookies++;
        return { ...c, value: options.replacementText };
      });
    }

    // 7. Request Query String array
    if (options.stripQueryParams && entry.request?.queryString && Array.isArray(entry.request.queryString)) {
      entry.request.queryString = entry.request.queryString.map((q: { name: string; value: string }) => {
        if (!q || !q.name) return q;
        const lowerName = q.name.toLowerCase().trim();
        const isCustom = options.customSensitiveKeys.some((ck) => lowerName === ck.toLowerCase().trim());
        const isKnown = SENSITIVE_QUERY_PARAMS.has(lowerName) || SENSITIVE_KEY_PATTERNS.some((p) => p.test(lowerName));

        if (isCustom || isKnown) {
          findings.push({
            id: `${entryId}-query-${q.name}`,
            entryId,
            method,
            url: originalUrl,
            location: "query",
            key: `Query Param: ${q.name}`,
            action: `Redacted query parameter value`,
          });
          redactedQueryParams++;
          return { ...q, value: options.replacementText };
        }
        return q;
      });
    }

    // 8. Request PostData (Body)
    if (entry.request?.postData) {
      const mime = entry.request.postData.mimeType || "";
      const text = entry.request.postData.text;

      // Handle params array (form-urlencoded / multipart)
      if (entry.request.postData.params && Array.isArray(entry.request.postData.params)) {
        entry.request.postData.params = entry.request.postData.params.map((p: any) => {
          if (!p || !p.name) return p;
          if (isSensitiveKey(p.name, options.customSensitiveKeys)) {
            findings.push({
              id: `${entryId}-formparam-${p.name}`,
              entryId,
              method,
              url: originalUrl,
              location: "body",
              key: `Form Param: ${p.name}`,
              action: `Redacted POST parameter value`,
            });
            redactedBodyKeys++;
            return { ...p, value: options.replacementText };
          }
          return p;
        });
      }

      // Handle JSON body
      if (options.sanitizeJsonBodies && text) {
        try {
          const parsedBody = JSON.parse(text);
          const sanitizedBody = sanitizeJsonDeep(
            parsedBody,
            options,
            findings,
            entryId,
            method,
            originalUrl,
            "request.body"
          );
          entry.request.postData.text = JSON.stringify(sanitizedBody, null, 2);
        } catch {
          // If not JSON, apply regex token redactor
          if (typeof text === "string") {
            let replaced = text.replace(
              /((?:password|passwd|secret|token|api_key|client_secret)=)([^&]+)/gi,
              `$1${options.replacementText}`
            );
            if (replaced !== text) {
              findings.push({
                id: `${entryId}-form-text`,
                entryId,
                method,
                url: originalUrl,
                location: "body",
                key: "Form urlencoded string",
                action: "Redacted matching credentials in raw post text",
              });
              redactedBodyKeys++;
              entry.request.postData.text = replaced;
            }
          }
        }
      }
    }

    // 9. Response Content
    if (entry.response?.content) {
      const mime = entry.response.content.mimeType || "";

      if (options.stripAllResponseBodies) {
        if (entry.response.content.text) {
          findings.push({
            id: `${entryId}-res-strip-all`,
            entryId,
            method,
            url: originalUrl,
            location: "body",
            key: "Response Content",
            action: `Purged complete response body (${mime}) to reduce size`,
          });
          entry.response.content.text = `[BODY STRIPPED - ${entry.response.content.size || 0} bytes]`;
          entry.response.content.size = 0;
        }
      } else if (options.stripBinaryResponseBodies && isBinaryMime(mime)) {
        if (entry.response.content.text) {
          findings.push({
            id: `${entryId}-res-strip-bin`,
            entryId,
            method,
            url: originalUrl,
            location: "body",
            key: `Binary Content (${mime})`,
            action: `Purged binary base64 data to save bandwidth`,
          });
          entry.response.content.text = `[BINARY MEDIA STRIPPED: ${mime}]`;
        }
      } else if (options.sanitizeJsonBodies && entry.response.content.text) {
        // Deep inspect JSON response body
        try {
          const parsedRes = JSON.parse(entry.response.content.text);
          const sanitizedRes = sanitizeJsonDeep(
            parsedRes,
            options,
            findings,
            entryId,
            method,
            originalUrl,
            "response.body"
          );
          entry.response.content.text = JSON.stringify(sanitizedRes, null, 2);
        } catch {
          // Non-JSON response text, ignore
        }
      }
    }
  }

  const sanitizedJsonString = JSON.stringify(sanitized, null, 2);
  const sanitizedSize = new Blob([sanitizedJsonString]).size;
  const endTime = performance.now();

  const totalFindings = findings.length;

  return {
    sanitizedHar: sanitized,
    findings,
    stats: {
      totalEntries: entries.length,
      totalFindings,
      redactedHeaders,
      redactedCookies,
      redactedQueryParams,
      redactedBodyKeys,
      redactedUrls,
      redactedIps,
      originalSize,
      sanitizedSize,
      processingTimeMs: Math.round(endTime - startTime),
    },
  };
}

export const SAMPLE_DIRTY_HAR_JSON = JSON.stringify(
  {
    log: {
      version: "1.2",
      creator: { name: "MegaTools HAR Simulator", version: "1.0" },
      entries: [
        {
          id: "req-1",
          startedDateTime: "2026-10-05T08:14:00.120Z",
          time: 180,
          serverIPAddress: "198.51.100.42",
          clientIPAddress: "203.0.113.19",
          request: {
            method: "POST",
            url: "https://api.megatools.dev/v1/auth/login?token=sec_live_998124&session=user_sess_xyz",
            headers: [
              { name: "Host", value: "api.megatools.dev" },
              { name: "User-Agent", value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
              { name: "Authorization", value: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSecretSignature" },
              { name: "Cookie", value: "session_id=s%3A98a87b1c4e.fgh; auth_token=token_prod_12345; __Host-session=active" },
              { name: "X-Api-Key", value: "megatools_live_api_key_449190283" },
              { name: "Content-Type", value: "application/json" }
            ],
            queryString: [
              { name: "token", value: "sec_live_998124" },
              { name: "session", value: "user_sess_xyz" },
              { name: "ref", value: "github_oauth" }
            ],
            cookies: [
              { name: "session_id", value: "s:98a87b1c4e.fgh" },
              { name: "auth_token", value: "token_prod_12345" }
            ],
            postData: {
              mimeType: "application/json",
              text: JSON.stringify({
                username: "admin_user@megatools.dev",
                password: "SuperSecretPassword123!",
                client_secret: "prod_oauth_client_secret_9981",
                remember_me: true
              })
            },
            bodySize: 142
          },
          response: {
            status: 200,
            statusText: "OK",
            headers: [
              { name: "Content-Type", value: "application/json" },
              { name: "Set-Cookie", value: "session_id=s%3Anew_session_9921; Secure; HttpOnly; SameSite=Lax" },
              { name: "X-Access-Token", value: "eyJhbGciOiJIUzI1NiJ9.newlyGeneratedToken" }
            ],
            cookies: [
              { name: "session_id", value: "s:new_session_9921" }
            ],
            content: {
              size: 210,
              mimeType: "application/json",
              text: JSON.stringify({
                status: "success",
                access_token: "eyJhbGciOiJIUzI1NiJ9.secretTokenPayload",
                refresh_token: "rfr_981290481204812",
                user: { id: "usr_991", email: "admin@megatools.dev" }
              })
            },
            bodySize: 210
          }
        },
        {
          id: "req-2",
          startedDateTime: "2026-10-05T08:14:00.350Z",
          time: 65,
          serverIPAddress: "198.51.100.88",
          request: {
            method: "GET",
            url: "https://api.megatools.dev/v1/user/profile?api_key=ak_secret_key_8819",
            headers: [
              { name: "Accept", value: "application/json" },
              { name: "Authorization", value: "Bearer eyJhbGciOiJIUzI1NiJ9.token" },
              { name: "X-CSRF-Token", value: "csrf_token_secret_nonce_value" }
            ],
            queryString: [
              { name: "api_key", value: "ak_secret_key_8819" },
              { name: "expand", value: "preferences" }
            ],
            cookies: [],
            bodySize: 0
          },
          response: {
            status: 200,
            statusText: "OK",
            headers: [{ name: "Content-Type", value: "application/json" }],
            cookies: [],
            content: {
              size: 160,
              mimeType: "application/json",
              text: JSON.stringify({
                id: "usr_991",
                tier: "pro",
                secret_pin: "9102",
                credit_card: "4111-XXXX-XXXX-1111"
              })
            },
            bodySize: 160
          }
        },
        {
          id: "req-3",
          startedDateTime: "2026-10-05T08:14:00.520Z",
          time: 42,
          serverIPAddress: "104.21.49.200",
          request: {
            method: "GET",
            url: "https://api.megatools.dev/assets/avatar-large.png",
            headers: [
              { name: "Accept", value: "image/avif,image/webp,image/apng,*/*" },
              { name: "Referer", value: "https://megatools.dev/dashboard" }
            ],
            queryString: [],
            cookies: [],
            bodySize: 0
          },
          response: {
            status: 200,
            statusText: "OK",
            headers: [
              { name: "Content-Type", value: "image/png" },
              { name: "Cache-Control", value: "public, max-age=31536000" }
            ],
            cookies: [],
            content: {
              size: 345000,
              mimeType: "image/png",
              text: "iVBORw0KGgoAAAANSUhEUgAABAAAAAQACAIAAADwf7zUAAAgAElEQVR4nOy9d5wdV3ku/Ezv...[MASSIVE BASE64 ENCODED IMAGE DATA]..."
            },
            bodySize: 345000
          }
        }
      ]
    }
  },
  null,
  2
);
