"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  auth: { user: string; pass: string } | null;
}

function parseCurl(rawInput: string): ParsedCurl {
  // Normalize line continuations and whitespace
  const cleanInput = rawInput.replace(/\\\r?\n/g, " ").trim();
  if (!cleanInput) {
    return { url: "", method: "GET", headers: {}, body: null, auth: null };
  }

  // Tokenize shell arguments respecting quotes
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < cleanInput.length; i++) {
    const char = cleanInput[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (char === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (/\s/.test(char) && !inSingle && !inDouble) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current.length > 0) {
    tokens.push(current);
  }

  let url = "";
  let method = "";
  const headers: Record<string, string> = {};
  const dataParts: string[] = [];
  let auth: { user: string; pass: string } | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "curl") continue;

    if (t === "-X" || t === "--request") {
      if (i + 1 < tokens.length) {
        method = tokens[++i].toUpperCase();
      }
    } else if (t === "-I" || t === "--head") {
      method = "HEAD";
    } else if (t === "-H" || t === "--header") {
      if (i + 1 < tokens.length) {
        const headerStr = tokens[++i];
        const colonIdx = headerStr.indexOf(":");
        if (colonIdx > -1) {
          const key = headerStr.slice(0, colonIdx).trim();
          const val = headerStr.slice(colonIdx + 1).trim();
          headers[key] = val;
        }
      }
    } else if (
      t === "-d" ||
      t === "--data" ||
      t === "--data-raw" ||
      t === "--data-binary" ||
      t === "--data-ascii"
    ) {
      if (i + 1 < tokens.length) {
        dataParts.push(tokens[++i]);
      }
    } else if (t === "--json") {
      if (i + 1 < tokens.length) {
        dataParts.push(tokens[++i]);
        headers["Content-Type"] = "application/json";
        headers["Accept"] = "application/json";
      }
    } else if (t === "-u" || t === "--user") {
      if (i + 1 < tokens.length) {
        const authStr = tokens[++i];
        const colonIdx = authStr.indexOf(":");
        if (colonIdx > -1) {
          auth = {
            user: authStr.slice(0, colonIdx),
            pass: authStr.slice(colonIdx + 1),
          };
        } else {
          auth = { user: authStr, pass: "" };
        }
      }
    } else if (t === "--url") {
      if (i + 1 < tokens.length) {
        url = tokens[++i];
      }
    } else if (!t.startsWith("-") && !url) {
      // First non-flag token is URL
      url = t;
    }
  }

  // Auto determine method if not specified
  if (!method) {
    method = dataParts.length > 0 ? "POST" : "GET";
  }

  const body = dataParts.length > 0 ? dataParts.join("&") : null;

  return { url, method, headers, body, auth };
}

function generateFetch(parsed: ParsedCurl): string {
  const { url, method, headers, body, auth } = parsed;
  if (!url) return "// Paste a valid cURL command above";

  const allHeaders: Record<string, string> = { ...headers };
  if (auth) {
    const encoded = typeof window !== "undefined" ? btoa(`${auth.user}:${auth.pass}`) : "BASE64_AUTH";
    allHeaders["Authorization"] = `Basic ${encoded}`;
  }

  const options: string[] = [];
  if (method !== "GET") {
    options.push(`  method: "${method}"`);
  }

  if (Object.keys(allHeaders).length > 0) {
    const headerLines = Object.entries(allHeaders)
      .map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"')}"`)
      .join(",\n");
    options.push(`  headers: {\n${headerLines}\n  }`);
  }

  if (body) {
    try {
      JSON.parse(body);
      options.push(`  body: JSON.stringify(${body})`);
    } catch {
      options.push(`  body: "${body.replace(/"/g, '\\"')}"`);
    }
  }

  let code = `const response = await fetch("${url}"`;
  if (options.length > 0) {
    code += `, {\n${options.join(",\n")}\n}`;
  }
  code += `);\n\nconst data = await response.json();\nconsole.log(data);`;
  return code;
}

function generatePython(parsed: ParsedCurl): string {
  const { url, method, headers, body, auth } = parsed;
  if (!url) return "# Paste a valid cURL command above";

  let code = `import requests\n\nurl = "${url}"\n`;

  const headerKeys = Object.keys(headers);
  if (headerKeys.length > 0) {
    code += `headers = {\n`;
    headerKeys.forEach((k) => {
      code += `    "${k}": "${headers[k].replace(/"/g, '\\"')}",\n`;
    });
    code += `}\n`;
  }

  if (auth) {
    code += `auth = ("${auth.user}", "${auth.pass}")\n`;
  }

  if (body) {
    try {
      const parsedJson = JSON.parse(body);
      code += `payload = ${JSON.stringify(parsedJson, null, 4)}\n`;
    } catch {
      code += `data = "${body.replace(/"/g, '\\"')}"\n`;
    }
  }

  code += `\nresponse = requests.${method.toLowerCase()}(\n    url,\n`;
  if (headerKeys.length > 0) code += `    headers=headers,\n`;
  if (auth) code += `    auth=auth,\n`;
  if (body) {
    try {
      JSON.parse(body);
      code += `    json=payload,\n`;
    } catch {
      code += `    data=data,\n`;
    }
  }
  code += `)\n\nprint(response.status_code)\nprint(response.json())`;
  return code;
}

function generateAxios(parsed: ParsedCurl): string {
  const { url, method, headers, body, auth } = parsed;
  if (!url) return "// Paste a valid cURL command above";

  const allHeaders = { ...headers };
  let code = `import axios from "axios";\n\nconst response = await axios({\n  method: "${method.toLowerCase()}",\n  url: "${url}",\n`;

  if (Object.keys(allHeaders).length > 0) {
    const headerLines = Object.entries(allHeaders)
      .map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"')}"`)
      .join(",\n");
    code += `  headers: {\n${headerLines}\n  },\n`;
  }

  if (auth) {
    code += `  auth: {\n    username: "${auth.user}",\n    password: "${auth.pass}"\n  },\n`;
  }

  if (body) {
    try {
      JSON.parse(body);
      code += `  data: ${body},\n`;
    } catch {
      code += `  data: "${body.replace(/"/g, '\\"')}",\n`;
    }
  }

  code += `});\n\nconsole.log(response.data);`;
  return code;
}

function generateGo(parsed: ParsedCurl): string {
  const { url, method, headers, body, auth } = parsed;
  if (!url) return "// Paste a valid cURL command above";

  let code = `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n`;
  if (body) code += `\t"strings"\n`;
  code += `)\n\nfunc main() {\n`;

  if (body) {
    code += `\tbody := strings.NewReader(\`${body}\`)\n\treq, err := http.NewRequest("${method}", "${url}", body)\n`;
  } else {
    code += `\treq, err := http.NewRequest("${method}", "${url}", nil)\n`;
  }
  code += `\tif err != nil {\n\t\tpanic(err)\n\t}\n\n`;

  Object.entries(headers).forEach(([k, v]) => {
    code += `\treq.Header.Set("${k}", "${v}")\n`;
  });

  if (auth) {
    code += `\treq.SetBasicAuth("${auth.user}", "${auth.pass}")\n`;
  }

  code += `\n\tclient := &http.Client{}\n\tresp, err := client.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer resp.Body.Close()\n\n\trespBody, _ := io.ReadAll(resp.Body)\n\tfmt.Println(string(respBody))\n}`;
  return code;
}

const SAMPLE_CURL = `curl -X POST https://api.example.com/v1/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer secret_token_xyz" \\
  -d '{"name": "Jane Doe", "email": "jane@example.com", "role": "admin"}'`;

export default function CurlConverterClient() {
  const [curlInput, setCurlInput] = useState(SAMPLE_CURL);
  const [targetLang, setTargetLang] = useState<"fetch" | "python" | "axios" | "go">("fetch");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const parsed = useMemo(() => parseCurl(curlInput), [curlInput]);

  const outputCode = useMemo(() => {
    switch (targetLang) {
      case "fetch":
        return generateFetch(parsed);
      case "python":
        return generatePython(parsed);
      case "axios":
        return generateAxios(parsed);
      case "go":
        return generateGo(parsed);
    }
  }, [parsed, targetLang]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Method</p>
        <p className="text-accent font-mono font-bold uppercase">{parsed.method || "GET"}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Headers Count</p>
        <p className="text-text-primary font-mono">{Object.keys(parsed.headers).length}</p>
      </div>
      <div className="col-span-2">
        <p className="text-text-muted text-xs">Target Host</p>
        <p className="text-text-secondary font-mono text-xs truncate">
          {parsed.url ? new URL(parsed.url).hostname : "—"}
        </p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">cURL to Code Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Transform terminal cURL commands into clean JavaScript fetch, Python requests, Axios, or Go code.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              cURL Input:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurlInput(
                    `curl "https://api.github.com/repos/vercel/next.js" -H "User-Agent: MegaTools"`
                  )
                }
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                [GET Example]
              </button>
              <button
                type="button"
                onClick={() => setCurlInput(SAMPLE_CURL)}
                className="text-xs text-text-muted hover:text-accent transition-colors"
              >
                [POST JSON]
              </button>
              <button
                type="button"
                onClick={() => setCurlInput("")}
                className="text-xs text-text-muted hover:text-error transition-colors"
              >
                [Clear]
              </button>
            </div>
          </div>

          {/* cURL Input Textarea */}
          <div className="relative mb-6">
            <textarea
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              placeholder="Paste curl command here..."
              rows={6}
              className="w-full rounded-lg bg-bg-page border border-border-subtle p-4 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y"
              spellCheck={false}
            />
          </div>

          {/* Target Language Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-bg-page p-1 rounded-lg border border-border-subtle">
              {(
                [
                  { id: "fetch", label: "JS / TS Fetch" },
                  { id: "python", label: "Python Requests" },
                  { id: "axios", label: "Axios" },
                  { id: "go", label: "Go (net/http)" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTargetLang(tab.id)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                    targetLang === tab.id
                      ? "bg-accent-soft text-accent font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <CopyButton text={outputCode} />
          </div>

          {/* Output Code Area */}
          <div className="relative rounded-lg bg-bg-page border border-border-subtle p-4 font-mono text-sm overflow-x-auto">
            <pre className="text-text-primary whitespace-pre-wrap">{outputCode}</pre>
          </div>
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden lg:block">
          <InfoPanel toolId="curl-converter" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="curl-converter" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
